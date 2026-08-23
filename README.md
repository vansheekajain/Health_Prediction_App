# CuraPulse - Healthcare Appointment & Follow-up Platform

A modern full-stack medical consultation and care platform designed for Clinics, Patients, Doctors, and Administrators.

---

## 🌟 Key Capabilities

- **👩‍⚕️ Doctor Profile Management**: Dynamic practicing schedules, break times, and slot duration configuration.
- **🔒 5-Minute Slot Hold Lock**: Prevents race conditions and double-booking during checkout.
- **🧠 AI Pre-Visit Clinical Triage**: Computes triage urgency (`LOW`, `MEDIUM`, `HIGH`), identifies chief complaint, and generates 3 targeted diagnostic questions for the doctor.
- **📝 AI Post-Visit Summary Converter**: Translates physician clinical assessment into empathetic, patient-friendly guidance and structured medication schedules.
- **💊 Daily Medication Tracker**: Checkpoints daily doses with taken/skipped compliance logging.
- **📅 Google Calendar & RFC 5545 `.ics`**: Instant calendar sync with 24-hour and 1-hour email reminders.
- **⚡ Doctor Leave Management**: Live conflict scanner and automated cancellation with patient reschedule alerts.
- **📊 Admin Operational Intelligence**: Clinic booking analytics, AI urgency distributions, and email dispatch audit logs.

---

## 🚀 Quick Start (Local Setup)

### 1. Install & Build
```bash
npm install
npm run build
npm run seed
```

### 2. Start Both Backend & Frontend
```bash
npm run dev
```

- **Frontend Application:** `http://localhost:5173`
- **Backend REST API:** `http://localhost:5000/api`

---

## 🧪 Testing

Run all unit & integration test suites:
```bash
npm test
```

---

## ☁️ Deployment on Render (1-Click Blueprint)

1. Push your repository to GitHub.
2. In [Render Dashboard](https://render.com), click **New + > Blueprint**.
3. Select your repository. Render automatically provisions the API Web Service and Vite Static Site using [`render.yaml`](./render.yaml).

