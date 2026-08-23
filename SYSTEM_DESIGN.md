# System Design: Healthcare Appointment & Follow-up Platform

## 1. System Architecture Overview

The platform is designed as a secure, distributed, role-based healthcare coordination engine. It decouples high-throughput booking transactions from long-running clinical LLM evaluations and asynchronous communication pipelines.

```
┌─────────────────────────────────────────────────────────────┐
│                    React 18 + Vite SPA                      │
│     (Patient Portal / Doctor Dashboard / Admin Portal)      │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JSON Web Token
┌──────────────────────────────▼──────────────────────────────┐
│                  Node.js / Express Backend                  │
│       ├── Auth & RBAC Guard                                 │
│       ├── Slot Engine & 5-Min Distributed Lock              │
│       ├── Doctor Leave Conflict Cascader                    │
│       └── Post-Visit Prescription Generator                 │
└───┬──────────────────────────┬──────────────────────────┬───┘
    │                          │                          │
┌───▼────────────────┐ ┌───────▼──────────────┐ ┌─────────▼───────────────┐
│ SQLite / PostgreSQL│ │ Gemini Flash LLM API │ │ SMTP & Google Calendar  │
│  (ACID Isolation)  │ │ (Clinical Triage &   │ │ (RFC 5545 .ics Engine,  │
│                    │ │  Care Plan Converter)│ │  Retry Queue Workers)   │
└────────────────────┘ └──────────────────────┘ └─────────────────────────┘
```

---

## 2. Double-Booking Prevention & Concurrency Control

Medical slot booking involves high peak concurrency. Preventing double bookings requires a multi-layered concurrency strategy:

1. **5-Minute Slot Hold Locking (`SlotHold` Entity)**:
   - When a patient selects an available slot, a temporary reservation is acquired via `acquireSlotHold`.
   - The hold is assigned a unique `holdToken` with a 5-minute TTL (`expiresAt`).
   - Other patients viewing the doctor's calendar receive `isAvailable: false, isHeld: true` in real-time.
2. **ACID Transaction Isolation**:
   - The final booking request is executed inside an atomic `prisma.$transaction`.
   - The transaction re-verifies doctor leaves, checks `WHERE doctorId = ... AND date = ... AND startTime = ... AND status IN ('CONFIRMED', 'COMPLETED')`, validates the `holdToken`, and inserts the appointment in a single atomic database lock.
3. **Compound Unique Indexing**:
   - Compound indexes on `[doctorId, date, startTime]` guarantee zero possibility of overlapping records.

---

## 3. Doctor Leave Conflict Management & Auto-Cancellation

When a doctor schedules an approved absence (`startDate` to `endDate`), existing confirmed visits cannot be honored:

1. **Conflict Discovery**:
   - The system queries all active appointments matching `doctorId` and `date BETWEEN startDate AND endDate` with `status = 'CONFIRMED'`.
2. **Atomic Status Cascade**:
   - Inside an atomic transaction, all conflicting bookings are updated to `CANCELLED_DUE_TO_LEAVE` and tagged with `cancellationReason`.
   - All active slot holds within the date window are cleared.
3. **Asynchronous Patient Reschedule Notifications**:
   - The leave service dispatches high-priority notification emails to every affected patient.
   - The notification provides an immediate 1-click URL (`/patient/doctors`) directing the patient to choose their next preferred slot with that physician.

---

## 4. AI Clinical Triage & Patient-Friendly Summaries

The platform integrates Gemini 1.5 Flash with deterministic clinical heuristics for fast and reliable medical data processing:

1. **Pre-Visit Triage**:
   - Evaluates patient symptoms submitted at booking.
   - Classifies urgency level into `HIGH`, `MEDIUM`, or `LOW`.
   - Extracts a concise chief complaint and generates 3 tailored diagnostic questions for the doctor.
2. **Post-Visit Summary & Care Plan Converter**:
   - Translates physician clinical jargon into empathetic, patient-friendly guidance.
   - Parses digital prescriptions into structured daily schedules and spawns automated medication dosage reminders.

---

## 5. Notification Reliability & Background Workers

1. **Multi-Channel Notification Architecture**:
   - Transacts confirmation emails, RFC 5545 `.ics` attachments, and direct Google Calendar template URLs.
2. **Audit Logging & Retry Queue**:
   - Every email attempt is logged to the `NotificationLog` table.
   - Failures are tagged with `status = 'FAILED'` and processed by a cron worker running every 5 minutes with exponential backoff (up to 3 retries).
