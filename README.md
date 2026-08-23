# CuraPulse - Healthcare Appointment & Follow-up Platform

A modern, full-stack, AI-augmented medical consultation and follow-up management platform designed for Clinics, Patients, Doctors, and Healthcare Administrators.

---

## 🌐 Live Cloud Deployments

| Component | Cloud URL | Status | Description |
| :--- | :--- | :---: | :--- |
| **Frontend Web App (UI)** | [**https://curapulse-frontend.onrender.com**](https://curapulse-frontend.onrender.com) | `🟢 Live` | Patient booking, AI triage view, Doctor queues, and Admin dashboards |
| **Backend REST API** | [**https://curapulse-api.onrender.com**](https://curapulse-api.onrender.com) | `🟢 Live` | Node.js / Express engine with Prisma, SQLite, AI & Background Cron |
| **API Health Endpoint** | [**https://curapulse-api.onrender.com/api/health**](https://curapulse-api.onrender.com/api/health) | `🟢 200 OK` | Live service health check & timestamp ping |
| **Specialists API** | [**https://curapulse-api.onrender.com/api/doctors**](https://curapulse-api.onrender.com/api/doctors) | `🟢 200 OK` | Doctor profiles, practicing hours & consultation pricing |

---

## 🔑 Instant Demo Accounts

You can log in instantly on the live site using either the **1-Click Instant Enter buttons** or the credentials below:

| Role | Demo Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **🧑 Patient** | `patient@cliniccare.com` | `Password123!` | Search specialists, hold 5-min booking slots, submit symptoms for AI triage, view medication compliance checklist |
| **🩺 Doctor** | `doctor.jenkins@cliniccare.com` | `Password123!` | Manage patient queue, view AI-suggested diagnostic questions, generate patient-friendly care plans, schedule leaves |
| **🛡️ Admin** | `admin@cliniccare.com` | `Password123!` | Monitor clinic booking volume, review AI urgency distribution charts, audit email & leave conflict resolution logs |

---

## 🌟 Key System Capabilities

- **👩‍⚕️ Doctor Profile & Schedule Management**: Configure weekly practicing hours, custom slot durations (15/30/45/60 min), break intervals, and consultation fees.
- **🔒 Concurrency Protection & 5-Min Slot Hold**: Prevents double-booking race conditions during multi-user checkout with time-limited distributed reservation tokens.
- **🧠 AI Pre-Visit Clinical Triage**: Evaluates patient-reported symptoms to compute triage urgency (`LOW`, `MEDIUM`, `HIGH`), extracts chief medical complaint, and prepares 3 tailored diagnostic questions for the doctor.
- **📝 AI Post-Visit Summary Converter**: Translates physician assessment and medical terminology into empathetic, patient-friendly guidance and structured medication schedules.
- **💊 Daily Medication Tracker**: Checkpoints scheduled doses daily with interactive *Taken / Skipped* compliance tracking.
- **📅 Calendar Integration & RFC 5545 `.ics`**: One-click Google Calendar sync and downloadable standard `.ics` invite attachments with email confirmations.
- **⚡ Doctor Leave Conflict Management**: Automatically identifies overlapping patient bookings when a doctor requests leave, cascades status to `CANCELLED_DUE_TO_LEAVE`, and dispatches patient reschedule notifications.
- **📊 Admin Operational Intelligence**: Real-time analytics on doctor utilization, clinic revenue volume, AI symptom triage severity distribution, and notification delivery health.

---

## 🏛️ System Architecture

Detailed system architecture and concurrency control specifications are documented in [**`SYSTEM_DESIGN.md`**](./SYSTEM_DESIGN.md).

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

## 🚀 Quick Start (Local Setup)

### 1. Install & Build
```bash
npm install
npm run build
npm run seed
```

### 2. Start Both Services Locally
```bash
npm run dev
```

- **Frontend Application:** `http://localhost:3000` (or `http://localhost:5173`)
- **Backend REST API:** `http://localhost:5000/api`

---

## 🧪 Testing Suite

Execute unit and integration test suites:
```bash
npm test
```
- Concurrency & double-booking protection tests
- Doctor leave conflict auto-cancellation tests
- AI pre-visit triage and post-visit summary conversion tests
