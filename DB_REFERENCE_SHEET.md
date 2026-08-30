# 📊 CampusRAG Database & Knowledge Reference Sheet

This reference sheet lists all structured database records, vector documents, student profiles, and exact sample queries available in your MongoDB Atlas database for testing.

---

## 1. 🎓 Student Academic & Exam Records (MongoDB `ExamResults` Collection)

| Roll Number | Student Name | Semester | Academic Year | SGPA | CGPA | Key Subjects & Grades | Status |
|:---|:---|:---:|:---:|:---:|:---:|:---|:---:|
| **`23CS101`** | Alex Student *(Demo Account)* | **Sem 5** | 2025-2026 | **9.38** | **9.16** | Networks (`O`), AI (`A+`), Software Eng (`A`), Web Tech (`O`), ML Lab (`O`) | **Pass** |
| **`23CS101`** | Alex Student *(Demo Account)* | **Sem 4** | 2024-2025 | **8.76** | **9.06** | Algorithms (`A+`), OS (`A`), Theory of Computation (`B+`), DBMS (`O`), Lab (`O`) | **Pass** |
| **`22CS104`** | Priya Sharma | **Sem 5** | 2025-2026 | **8.94** | **8.85** | Networks (`A`), AI (`O`), Software Eng (`A+`), Web Tech (`A`), ML Lab (`O`) | **Pass** |

### 🎯 Sample Queries to Test Exam Results Database:
- *"Show my semester 5 exam results & SGPA"*
- *"What is my current CGPA and subject grades?"*
- *"Check exam results for roll number 22CS104"*
- *"What did I score in Database Management Systems in semester 4?"*
- *"Show the semester 5 score card for Priya Sharma"*

---

## 2. 📑 Official Institutional Documents (MongoDB `Documents` & Vector Store)

| Document Title | Category | Department | Key Policies & Facts Indexed |
|:---|:---|:---|:---|
| **Admissions & Eligibility Guide 2026** | `Admissions` | Admissions Office | B.Tech min 60% aggregate, application deadline June 20, 2026, lateral entry 65% diploma cutoff |
| **Hostel Rules & Fee Schedule** | `Hostel` | Chief Warden Office | Curfew 9:30 PM weekdays & 10:30 PM weekends, Double Non-AC ($1,400), Double AC ($2,000), Mess ($1,000), max 4 night-outs/mo |
| **Academic Regulations & Grading System** | `Exams` | Controller of Exams | 75% attendance mandatory (65% with condonation), 10-point relative scale (`O`=10 down to `F`=0), supplementary exam fee $25 |
| **Training & Placement Policy** | `Placements` | Career Services | 6.5 CGPA eligibility, 80% PPT attendance, **One-Student-One-Offer**, Dream Company CTC > 1.75x rule, 8-10 week summer internship |
| **Scholarships & Financial Aid** | `Scholarships` | Student Welfare | President's Fellowship (100% waiver for CGPA >= 9.50), Dean's Honor (50% for CGPA 9.00-9.49), Means-cum-Merit (< $6,000 income) |

### 🎯 Sample Queries to Test Unstructured Document RAG:
- *"What are the hostel curfew hours and late entry penalties?"*
- *"Explain the placement policy and dream company offer criteria."*
- *"What is the minimum attendance required to appear for final exams?"*
- *"How do I qualify for the President's Merit Fellowship?"*
- *"What is the annual fee for a double occupancy AC hostel room?"*

---

## 3. 👥 Seeded User Accounts (MongoDB `Users` Collection)

| Role | Email | Password | Linked Roll No | Purpose |
|:---|:---|:---|:---:|:---|
| **Student** | `student@campus.edu` | `StudentPassword123!` | `23CS101` | Test student chat, exam results lookup, and general campus RAG |
| **Admin** | `admin@campus.edu` | `AdminPassword123!` | — | Access `/admin/documents` to upload new PDFs/DOCXs and view telemetry |

---

## 4. ⚡ Live REST API Endpoints Reference

| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/` | API Status and service info |
| `GET` | `/api/health` | Diagnostic check (MongoDB, AI Providers, Vector Store) |
| `POST` | `/api/auth/login` | Student & Admin authentication |
| `POST` | `/api/chat/query` | Hybrid RAG query processing (DB + Vector Search) |
| `GET` | `/api/results/my-results` | Fetch logged-in student's complete semester transcripts |
| `GET` | `/api/results/lookup/:rollNumber` | Look up public exam results by Roll Number |
| `GET` | `/api/documents` | List all indexed institutional documents *(Admin)* |
| `POST` | `/api/documents/upload` | Ingest and vector-index new documents *(Admin)* |
