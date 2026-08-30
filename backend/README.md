# KrishiMitra Backend

KrishiMitra is a digital agricultural procurement platform. This Express.js backend replaces the frontend mock data and local storage behaviors with real API endpoints, business validation logic, role authorization, and a relational Supabase PostgreSQL database using Prisma ORM.

---

## Tech Stack
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database ORM:** Prisma ORM
- **Database Engine:** Supabase PostgreSQL
- **Security & Cryptography:** bcrypt, jsonwebtoken (JWT), Helmet, express-rate-limit
- **Validation:** Zod
- **API Documentation:** Swagger UI, swagger-ui-express
- **Unit Testing:** Jest, Supertest
- **Logging:** Winston logger

---

## Folder Structure
```
backend/
├── prisma/
│   ├── schema.prisma       # Database schema for all 22 tables
│   └── seed.js             # Idempotent seed script with realistic demo data
├── src/
│   ├── config/
│   │   └── db.js           # Prisma client client setup with logging handlers
│   ├── controllers/        # Express controllers mapping routes to logic
│   ├── middleware/         # Auth validation, error handler, rate limiters
│   ├── routes/             # API routing mounts under /api/v1
│   ├── services/           # Decoupled business logic (pricing, trust, queue)
│   ├── utils/              # Helper functions, errors, Zod validation schemas
│   ├── app.js              # Express app security configuration
│   └── server.js           # Server listen and graceful termination triggers
├── tests/
│   └── api.test.js         # Jest test suite (mocking database requests)
├── .env.example
├── package.json
└── README.md
```

---

## Database Overview (22 Models)
1. **User**: Handles authentication credentials, mobile identifiers, and system roles.
2. **FarmerProfile**: Stores personal details, land records, masked bank accounts, and trust metrics.
3. **FarmerVerificationHistory**: Audits farmer verification status transitions.
4. **StaffProfile**: Identifies procurement center managers and service desk operators.
5. **ProcurementCentre**: Procurement hub coordinates, contact info, and open status.
6. **Counter**: Service desk terminals within a center (e.g. Weighing, Inspection).
7. **StaffAssignment**: Records staff assignments to centers and counters.
8. **Crop**: Registered agricultural crops (Wheat, Paddy, Mustard).
9. **ProcurementSeason**: Active procurement periods (Rabi, Kharif seasons).
10. **FarmerCropRegistration**: Links farmers to crops, land acreage, and yield limits.
11. **SlotConfig**: Database-driven capacity limits and timeslots per centre.
12. **SystemSetting**: Stores key-value configurations (e.g., Tatkaal fees).
13. **ProcurementBooking**: Farmer appointments linking crop, quantity, date, and slot.
14. **QueueToken**: Daily queue token numbers, counter assignments, and queue positions.
15. **TokenStatusHistory**: Chronological state transitions of queue tokens.
16. **ProcurementTransaction**: Financial and weight ledger representing completed transactions.
17. **WeighingRecord**: Gross weight, tare weight, net weight, and device logs.
18. **CropGrade**: Crop grade multipliers (Grade A premium rates).
19. **CropPrice**: Historical and effective MSP and market price rates.
20. **QualityInspection**: Quality inspections (moisture, foreign matter, pass/fail state).
21. **Payment**: Payment ledger recording transaction numbers, amounts, reference IDs, and statuses.
22. **Notification**: In-app notifications.

---

## Authentication & Authorization Flow

### Roles
- **FARMER**: Can update self-profile, browse rates, check slot capacities, book standard/Tatkaal slots, track queue token positions, and see payment details.
- **CENTRE_STAFF**: Handles center-specific operations (calling tokens, updating counter statuses, registering weight logs, completing quality checks).
- **CENTRE_MANAGER**: Oversees center queues, manages staff assignments, updates center profile details, and updates farmer verification states.
- **ADMIN**: Access to all endpoints, global settings, and configuration controls.

### Flow
1. User logs in at `POST /api/v1/auth/login`.
2. Backend validates password using `bcrypt` and issues:
   - **Access Token:** Short-lived JWT (attached to request header as `Authorization: Bearer <token>`).
   - **Refresh Token:** Long-lived token to request new access tokens at `POST /api/v1/auth/refresh`.
3. Validation checks are triggered on every protected endpoint to verify roles (`protect`, `restrictTo`).

---

## Environment Setup & Commands

### Prerequisites
1. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```
2. Configure your Supabase connection strings inside `.env`:
   - `DATABASE_URL` (e.g., transaction pool connection)
   - `DIRECT_URL` (direct connection for migration scripts)
   - `JWT_SECRET`
   - `PORT=8080`

### Installation & Client Generation
```bash
npm install
npx prisma validate
npx prisma generate
```

### Database Migration & Seeding
If you are connecting to a fresh database, run the following commands:
```bash
# Run database migrations
npx prisma migrate dev --name init

# Seed development/demo data
npx prisma db seed
```

### Run the Server
```bash
# Development mode with hot-reloading
npm run dev

# Production start
npm start
```

### Testing
To run the automated tests mocking database connections:
```bash
npm test
```

---

## API Endpoints & Examples

### Health Check
- **`GET /api/v1/health`**
- Response:
  ```json
  {
    "success": true,
    "message": "Server is healthy",
    "timestamp": "2026-08-30T17:03:50.000Z"
  }
  ```

### API Docs
- **`GET /api/docs`**
- Accesses the interactive Swagger UI panel inside your browser.

### Sample Farmer Registration
- **`POST /api/v1/auth/register/farmer`**
- Body:
  ```json
  {
    "mobile": "9876543210",
    "password": "password123",
    "name": "Ramesh Kumar",
    "dob": "1980-01-01",
    "gender": "Male",
    "aadhaar": "123456789012",
    "village": "Bhagwanpur",
    "district": "Lucknow",
    "state": "Uttar Pradesh",
    "tehsil": "Lucknow",
    "block": "Lucknow",
    "pincode": "226001",
    "khasraNumber": "123/4B",
    "landOwnerName": "Ramesh Kumar",
    "bankName": "State Bank of India",
    "accountNumber": "987654321012",
    "ifscCode": "SBIN0001234"
  }
  ```

### Sample Slot Booking
- **`POST /api/v1/bookings`** (Header: `Authorization: Bearer <JWT>`)
- Body:
  ```json
  {
    "cropId": 2,
    "weight": 25.0,
    "centreId": 1,
    "date": "2026-11-15",
    "slotTime": "10:00 - 11:00"
  }
  ```

---

## Security Notes
- **Data Protection:** Aadhaar and Bank Account Numbers are fully masked (`XXXX XXXX 5678`) in database displays and API responses. Only a secure one-way hash is kept for uniqueness and duplication checks.
- **Payload Limits:** Request bodies are restricted to `10kb` to prevent buffer overflow/DDoS.
- **Audit Ledger:** Every critical state change (booking, weighing, verification, status) logs an entry to the `AuditLog` table.
