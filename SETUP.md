# Setup Guide - Airbnb Marketplace

This document provides step-by-step instructions for configuring, running, and deploying both the backend (FastAPI) and frontend (Next.js 15) applications.

---

## Prerequisites

Ensure you have the following installed on your machine:

- **Python**: `3.10` or higher (`python3 --version`)
- **Node.js**: `18.18+` or `20+` (`node --version`)
- **Package Managers**: `pip` and `npm` (or `pnpm` / `yarn`)
- **Database**: PostgreSQL 14+ (or a managed [Supabase](https://supabase.com/) project)

---

## Environment Variables Configuration

### 1. Backend Configuration (`backend/.env`)

Navigate to the `backend` folder and create a `.env` file from `.env.example`:

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your database credentials:

```env
# Database Connection (Supabase or local PostgreSQL)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

# Application Security
SECRET_KEY=your-super-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# CORS & Frontend Origins
FRONTEND_URL=http://localhost:3000

# OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

> **Security Note**: Never commit `backend/.env` to source control.

---

### 2. Frontend Configuration (`frontend/.env.local`)

Navigate to the `frontend` directory and create `.env.local`:

```bash
cd ../frontend
cp .env.example .env.local
```

Set the backend API URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Backend Setup (FastAPI)

### 1. Create Virtual Environment & Install Dependencies

From the repository root:

```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On Linux/macOS:
source venv/bin/activate
# On Windows (cmd):
# venv\Scripts\activate.bat
# On Windows (PowerShell):
# .\venv\Scripts\Activate.ps1

# Install requirements
pip install -r requirements.txt
```

### 2. Database Initialization & Schema

Ensure your PostgreSQL instance is running and reachable via `DATABASE_URL`. The models will synchronize directly with the database, or you can run migrations if configured:

```bash
# Optional: run migrations if using Alembic
alembic upgrade head
```

### 3. Seed Sample Marketplace Data

Populate the database with realistic demo accounts, categories, listings across top destinations, reservations, and reviews:

```bash
python seed.py
```

Expected output:
```text
Seeded 22 users (including host & guest demo accounts).
Seeded amenities, 81 listings, bookings, reviews, and wishlist records.
Database successfully seeded!
```

### 4. Start the Backend Development Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- **API Base URL**: `http://localhost:8000`
- **Interactive Swagger UI**: `http://localhost:8000/docs`
- **ReDoc Documentation**: `http://localhost:8000/redoc`
- **Health Check**: `http://localhost:8000/health`

---

## Frontend Setup (Next.js 15)

### 1. Install Node Dependencies

In a separate terminal tab:

```bash
cd frontend

# Install dependencies
npm install
```

### 2. Run the Development Server

```bash
npm run dev
```

The Next.js application will start on:
- **Local Application URL**: `http://localhost:3000`

### 3. Production Build & Verification

To verify production bundle compilation and type safety:

```bash
npm run build
npm run start
```

---

## Pre-Configured Demo Accounts

After running `python seed.py`, you can test both guest and host experiences using the pre-seeded accounts:

| Role | Email | Name | Capabilities |
| :--- | :--- | :--- | :--- |
| **Host** | `priya@example.com` | Priya Sharma | Create/edit listings, manage bookings, view host dashboard & analytics |
| **Host** | `rahul@example.com` | Rahul Verma | Manage properties, review reservations |
| **Guest** | `ananya@example.com` | Ananya Patel | Search listings, book trips, write reviews, save to wishlist |
| **Guest** | `vikram@example.com` | Vikram Singh | Browse listings, book stays, manage trips |

> **Tip**: You can also use the **"Demo 1-Click Accounts"** option directly in the top-right header menu of the UI to immediately sign in as any test user without passwords.

---

## Troubleshooting & Verification

1. **Backend Health Check**:
   ```bash
   curl http://localhost:8000/health
   # Expected: {"status": "ok"}
   ```

2. **CORS Issues**:
   - The FastAPI backend has CORS enabled for all origins (`allow_origins=["*"]`) with credentials support in `backend/app/main.py`.
   - Ensure `NEXT_PUBLIC_API_URL` points to the active port of your backend.

3. **Database Connection Errors**:
   - Confirm your Supabase or PostgreSQL connection string is correct in `backend/.env`.
   - In Supabase, verify database passwords and IPv4 pooler settings if your local ISP does not route IPv6.
