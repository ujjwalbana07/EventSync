EventSync
# CMIS Event Management System

A **full‑stack, role‑based university event management platform** designed for the **CMIS department** to manage events, track student engagement, and enable **context‑driven recruiter connections**.

> **Theme:** *“From Scalability Crisis to Active Connection”*

---

## 📌 Problem Statement

Traditional university event management relies on **emails, spreadsheets, and disconnected tools**, leading to:

* **Students:** Confusion about registration status and no engagement history
* **Faculty:** Heavy logistics burden using 3+ tools with no real‑time visibility
* **Recruiters:** Blind recruiting via generic PDF resume books
* **Admins:** Bottlenecks, manual approvals, and no master system view

The CMIS Event Management System solves this by providing **one centralized, scalable platform** for the **entire event lifecycle**.

---

## 🎯 Project Objectives

* Centralize all CMIS events on a single platform
* Enable real‑time registration, confirmations, and waitlists
* Automate capacity handling and notifications
* Maintain consistent workflows across all event types
* Store historical event data for analytics and future planning
* Bridge the gap between **students, faculty, recruiters, and admins**

---

## 🧱 System Architecture

### Tech Stack

**Frontend**

* Next.js (React)
* Tailwind CSS
* Responsive, mobile‑first UI

**Backend**

* FastAPI (Python)
* SQLAlchemy ORM
* Async task handling

**Database**

* SQLite (Development)
* PostgreSQL (Production‑ready)

**Infrastructure**

* Docker & Docker Compose
* Containerized services
* APScheduler for background jobs (emails, automation)

---

## 👥 Role‑Based Features

### 👨‍💻 Admin (System Compliance & Oversight)

**Command Center Dashboard**

* Live system statistics (Active users, Events, Requests)
* Real‑time notifications (auto‑refresh every 10 seconds)

**User Management**

* Approve or reject new registrations
* Assign and verify roles (Student, Faculty, Recruiter, Judge)
* Remove unauthorized or inactive users

**Event Oversight**

* View, edit, or delete *any* event department‑wide
* Create global/system‑wide events (Career Fairs, Summits)

**Resume Repository**

* Secure master access to all uploaded student resumes
* Used for internal audits and quality checks

---

### 🎓 Student (Engagement & Career Growth)

**Profile Management**

* Name, major, graduation year
* Upload PDF resume (required for recruiter visibility)

**Event Discovery**

* Browse upcoming events, workshops, competitions
* Search and filter by name or category

**Registration System**

* One‑click event registration
* Automatic status handling:

  * Registered
  * Waitlisted
  * Confirmed

**My Dashboard**

* Personalized view of all registered events
* Clear engagement history (no communication black holes)

---

### 👩‍🏫 Faculty (Event Organization)

**Event Creation & Management**

* Create events with title, description, time, location, capacity
* Edit or update event details in real time

**Guest & Invitation Management**

* Invite external guests via email
* Bulk invitations via CSV upload

**Analytics & Reporting**

* Live roster of registered attendees
* One‑click CSV export for attendance and reporting
* Real‑time feedback and engagement analytics

---

### 💼 Recruiter (Targeted Talent Discovery)

**Context‑Driven Recruiting**

* View student rosters for specific events (e.g., Career Fair)
* Filter candidates by:

  * Major
  * Graduation year
  * Skills

**Resume Access**

* Direct access to uploaded PDF resumes
* No more generic resume books — talent is shown *in context*

---

## 🔐 Authentication & Security

* Secure user registration with email verification (simulated)
* Admin‑controlled onboarding approval
* Role‑Based Access Control (RBAC)
* JWT‑based stateless authentication
* Strict permission boundaries per role

---

## ⚙️ Core Application Logic

* **Automatic Waitlist Handling:**

  * Capacity reached → users are waitlisted automatically
  * Seats open → next waitlisted user is confirmed

* **Dynamic Polling:**

  * Dashboards update without full page reloads

* **Responsive Design:**

  * Fully optimized for mobile and desktop usage

---

## 🎨 UI / UX Highlights

* Dark‑themed modern dashboard
* Glassmorphism‑inspired UI elements
* Animated transitions and hover effects
* Modal‑based workflows for critical actions
* Toast notifications for success and error states
* Role‑specific sidebar navigation ("My Tools")

---

## 🚀 Deployment & Setup

### Prerequisites

* Docker & Docker Compose
* Node.js (for local frontend dev)
* Python 3.10+

### Run Locally

```bash
# Clone the repository
git clone https://github.com/your-username/cmis-event-management-system.git
cd cmis-event-management-system

# Start all services
docker-compose up --build
```

* Frontend: `http://localhost:3000`
* Backend API: `http://localhost:8000`

---

## 🔮 Future Enhancements

* **Smart Scheduling Assistant**

  * Suggest optimal dates, times, and capacities using historical data
  * Conflict detection across CMIS events

* **QR‑Based Check‑In**

  * Real‑time attendance tracking
  * Reduced manual errors

* **Mobile Application**

  * Native app for event registration, updates, and QR check‑ins

* **AI‑Powered Communication**

  * Hyper‑personalized emails using GenAI
  * Context‑aware reminders and feedback requests

---

## 👨‍👩‍👦‍👦 Team

* **Ujjwal Bana**
* Akshaj Shah
* Bhavik Dalal
* Gautham Shetty

---

## 📄 License

This project is built for academic and departmental use under CMIS, Texas A&M University.

---

> **CMIS Event Management System** – One platform. One workflow. Infinite engagement.
