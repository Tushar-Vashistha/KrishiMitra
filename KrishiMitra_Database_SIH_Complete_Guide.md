# 🌾 KrishiMitra — Database Architecture, Speaking Script & SIH Q&A Guide

**Project:** KrishiMitra (Smart Agricultural Procurement & Queue Management Platform)  
**Stack:** React 19 (Vite + Tailwind) | Node.js + Express | Prisma ORM | PostgreSQL (Supabase)  
**Purpose:** Smart India Hackathon (SIH) Technical Presentation & Judge Q&A Defense  

---

## 1. High-Level Database Architecture & Stack Choice

KrishiMitra ka database architecture 3 main layers par built hai. System ka primary goal hai **100% ACID Compliance**, **Zero Data Loss**, aur **High Concurrency** during Mandi peak hours.

* **Database Engine:** PostgreSQL (Hosted on *Supabase Cloud*) — Chosen for strict relational integrity & financial transaction safety.
* **ORM Layer:** Prisma ORM v5 — Provides type-safe queries, auto-generated TypeScript/JS client, and migration management.
* **Backend Runtime:** Node.js & Express REST API (Hosted on *Render*) — Communicates with DB via connection pooling.
* **Frontend:** React 19 + Vite (Hosted on *Vercel*) — Consumes REST APIs dynamically.

---

## 2. Database Connection Lifecycle & Configuration

Backend Express server aur Supabase PostgreSQL DB ke beech connection setup do connection strings se managed hai:

* **DATABASE_URL (Pooled Connection via PgBouncer - Port 6543):** Application runtime ke liye transaction-level connection pooling use hoti hai taaki peak traffic me connections limit exhaust ('Too Many Connections') na ho.
* **DIRECT_URL (Unpooled Direct Connection - Port 5432):** Prisma DDL migrations aur schema updates execute karne ke liye direct socket connection active rehta hai.
* **Query Event Logging:** `backend/src/config/db.js` me Prisma event listeners configured hain jo query execution time aur database errors ko log karte hain.

---

## 3. Database Schema Breakdown (22 Models in 5 Modules)

Data model `backend/prisma/schema.prisma` me defined 22 tables 5 core logical modules me divided hai:

| Module | Models / Tables | Key Responsibilities |
|---|---|---|
| **1. User & Auth** | `User`, `FarmerProfile`, `StaffProfile`, `FarmerVerificationHistory` | User roles (FARMER, STAFF, ADMIN), profile verification, masked Aadhaar & Bank hashing. |
| **2. Mandi Infrastructure** | `ProcurementCentre`, `Counter`, `StaffAssignment`, `SlotConfig`, `SlotAllocation` | Mandi location, daily procurement capacity, operational counters, and slot time limits. |
| **3. Crop & Pricing** | `Crop`, `CropGrade`, `CropPrice`, `ProcurementSeason`, `FarmerCropRegistration` | MSP price lists, crop quality grades, seasonal tracking, and farmer crop land registration. |
| **4. Procurement & Queue** | `ProcurementBooking`, `QueueToken`, `TokenStatusHistory` | Slot booking engine, real-time counter queue tokens, and token lifecycle status history. |
| **5. Fulfillment & Audit** | `ProcurementTransaction`, `WeighingRecord`, `QualityInspection`, `Payment`, `AuditLog`, `TrustScoreHistory` | Crop gross/tare/net weighment, moisture quality tests, automatic MSP payments, and admin audit trail. |

---

## 4. Word-for-Word Speaking Script for SIH Presentation

Aap is script ko SIH Judges ke samne directly deliver kar sakte hain (3 Minutes Duration):

### Part 1: Intro & Core Philosophy (30s)
> "Good morning / afternoon Respected Judges! Today I will present the core backbone of KrishiMitra — our Database Architecture and Data Lifecycle.
> 
> Jab hum Mandi Procurement aur Farmer Payments jaisa system design karte hain, humara primary goal hota hai: Zero Data Loss, High Security, aur 100% Transactional Accuracy. Isi liye humne PostgreSQL on Supabase choose kiya. NoSQL ke bajaye Relational DB select karne ki main reason hai strict ACID Compliance, taaki kisi bhi payment ya crop transaction me data mismatch na ho.
> 
> Backend me hum Node.js & Express REST APIs ke sath Prisma ORM use kar rahe hain jo type-safety aur query performance optimization provide karta hai."

### Part 2: End-to-End Data Flow (1.5m)
> "Ab main aapko ek Farmer ki end-to-end journey me backend data flow samjhata hoon:
> 
> 1. **Secure Onboarding:** Jab kisan register karta hai, details `FarmerProfile` table me save hoti hain. Data privacy ke liye hum Plain-Text Aadhaar ya Bank Account save nahi karte — hum Masked string (XXXX-XXXX-1234) ke sath SHA-256 Hashes store karte hain.
> 2. **Smart Slot & Queue Token:** Kisan Mandi slot book karta hai toh `ProcurementBooking` record create hota hai aur ek unique `QueueToken` issue hota hai. Overbooking aur race condition rokne ke liye humne schema level par Compound Unique Indexes (`[centreId, date, slotTime, tokenNumber]`) lagaye hain.
> 3. **Mandi Processing:** Mandi arrival par `QualityInspection` table update hoti hai (moisture % & grade) aur `WeighingRecord` me gross vs tare weight calculate karke net weight save hota hai.
> 4. **Automated Payment & Audit:** Quality pass hone par `ProcurementTransaction` create hota hai, net weight MSP rates se multiply hota hai, aur `Payment` status `PENDING` se `SUCCESS` update ho jata hai. Saare steps `AuditLog` table me capture hote hain fraud prevention ke liye."

### Part 3: Engineering Highlights & Wrap-up (1m)
> "Judges, humare DB design me 3 critical engineering highlights hain:
> - **First — Interactive Transactions (`prisma.$transaction`):** Multi-table operations atomic transactions me hoti hain. Agar payment step fail hota hai, toh saare steps automatically Rollback ho jate hain.
> - **Second — B-Tree Indexing:** High traffic filters like `district`, `mobile`, `status`, and `date` par indexes hain jo O(log N) fast lookups guarantee karte hain.
> - **Third — Connection Pooling:** Production me Supabase PgBouncer connection pooler active hai jo thousand concurrent requests smoothly handle karta hai.
> 
> In short, KrishiMitra ka database Security, Crowd Management, aur Automated Payment Verification ko backend level par enforce karta hai. Thank you!"

---

## 5. Top 10 Technical Q&A with SIH Judges

### Q1: High Concurrency par slot double-booking kaise rokte ho?
* **Answer:** Humne 2-layer defense mechanism use kiya hai: (1) Schema level par Compound Unique Index `@@unique([centreId, date, slotTime, tokenNumber])`, jo DB level par duplicate entries reject karta hai. (2) Prisma Interactive Transaction (`$transaction`) jahan slot check, capacity update, aur booking atomic block me execution hoti hai.
* **Code Reference:** `schema.prisma:L319` | `booking.controller.js:L125`

### Q2: Farmer Aadhaar aur Bank details leak hone se kaise protected hain?
* **Answer:** Plain-text Aadhaar ya Bank AC details store nahi hoti. Display ke liye Masked Strings (`aadhaarMasked`, `accountNumberMasked`) store hote hain. Identity lookup ke liye SHA-256 Hashes (`aadhaarHash`, `accountNumberHash`) rely kiye jaate hain jo 100% irreversible hote hain.
* **Code Reference:** `schema.prisma:L92-L105`

### Q3: MongoDB (NoSQL) ke bajaye PostgreSQL (SQL) kyun choose kiya?
* **Answer:** NoSQL eventual consistency par work karta hai jo financial platforms ke liye risky hai. KrishiMitra me crop weighment, MSP calculations aur Direct Bank Payments involve hain. Strict ACID compliance, foreign key constraints, aur zero financial mismatch ke liye PostgreSQL mandatory choice thi.
* **Code Reference:** Architecture Decision

### Q4: Payment creation ke waqt server crash ho jaye toh kya data half-save hoga?
* **Answer:** Nahi! All multi-table updates are wrapped inside Prisma Interactive Transactions (`prisma.$transaction`). Agar step 3 (Payment) fail ho jata hai, toh step 1 (Weighing) aur step 2 (Quality) automatically Rollback ho jate hain. DB state completely clean aur unchanged rehti hai.
* **Code Reference:** `procurement.controller.js:L46`

### Q5: Staff member crop weight ya grade me fraud kare toh kaise catch karoge?
* **Answer:** System me Complete Auditability enforcement hai: `WeighingRecord` me staff `operatorId`, `QualityInspection` me `inspectorId` linked hoti hai. Global `AuditLog` table me exact user ID, entity name, entity ID, aur timestamp automatically populate hota hai.
* **Code Reference:** `schema.prisma:L385, L423, L462`

### Q6: Tens of thousands of records par queries slow nahi hongi?
* **Answer:** Queries O(log N) execution complexity me perform karti hain kyunki humne target B-Tree Indexes (`@@index`) configure kiye hain on columns like `district`, `mobile`, `status`, `centreId`, aur `effectiveDate`.
* **Code Reference:** `schema.prisma:L116-L118, L320-L325`

### Q7: Cloud backend hits se Connection Limit Exhaust ('Too Many Connections') kaise prevent hota hai?
* **Answer:** Humne Two-URL Connection Architecture setup kiya hai. Application runtime `DATABASE_URL` connects through Supabase PgBouncer (Port 6543) for connection pooling, while `DIRECT_URL` (Port 5432) is reserved exclusively for migrations.
* **Code Reference:** `schema.prisma:L3-L4`

### Q8: Farmer account delete hone par historical transaction data ka kya hoga?
* **Answer:** `FarmerProfile` level par `onDelete: Cascade` enabled hai for profile cleanup, but financial records (`ProcurementTransaction`, `Payment`) auditing compliance ke liye retained rehte hain. Account suspension `status: SUSPENDED` Enum through handle hota hai.
* **Code Reference:** `schema.prisma:L20, L87`

### Q9: Counter Queue System live updates DB se real-time kaise synced rehta hai?
* **Answer:** `QueueToken` model me status (`WAITING`, `CALLED`, `PROCESSING`, `COMPLETED`) aur timestamps track hote hain. Jab staff token call karta hai, status update DB me write hote hi Express backend WebSocket/SSE events broadcast karta hai.
* **Code Reference:** `schema.prisma:L327-L360`

### Q10: Farmer ka Trust Score calculation DB me kaise log hota hai?
* **Answer:** `FarmerProfile` me `trustScore: 100.0` initial baseline hota hai. Timely mandi arrival ya standard quality crop landing par `TrustScoreHistory` table me event and points log hote hain. Absence ya violation par negative points deduct hoke score update hota hai.
* **Code Reference:** `schema.prisma:L107, L283-L291`
