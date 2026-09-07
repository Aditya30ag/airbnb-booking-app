# Airbnb Marketplace

This is the initial scaffolding for an Airbnb-inspired marketplace, featuring a FastAPI backend and a Next.js (App Router) frontend.

## Project Structure

- `backend/`: FastAPI application, SQLAlchemy ORM, Alembic migrations.
- `frontend/`: Next.js 14 App Router, Tailwind CSS, shadcn/ui setup.

## Local Setup Instructions

### Backend Setup
1. Navigate to the `backend` directory: `cd backend`
2. Create a virtual environment: `python3 -m venv venv`
3. Activate the environment: `source venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Copy environment variables: `cp .env.example .env` (update variables as needed)
6. Initialize migrations: `alembic upgrade head`
7. Run the development server: `uvicorn app.main:app --reload`

### Frontend Setup
1. Navigate to the `frontend` directory: `cd frontend`
2. Install dependencies: `npm install` (Make sure `next-auth@5`, `date-fns`, `react-hook-form`, `zod`, `lucide-react`, and `@hookform/resolvers` are added).
3. Copy environment variables: `cp .env.example .env.local`
4. Run the development server: `npm run dev`

The frontend will be available at http://localhost:3000 and the backend API at http://localhost:8000.
