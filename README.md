# Tu Credito - Technical Test (Senior)

This repository contains a Senior-level implementation of the technical test using:

- **Backend:** Django 5 + Django REST Framework + **drf-spectacular (OpenAPI/Swagger)**
- **Frontend:** React SPA (Vite) + **MUI Core** (no license-key modules)
- **Database:** PostgreSQL (via Docker or environment variables)
- **Docker:** docker compose

## Key Requirements Covered

- `/v1/` API prefix for all endpoints
- Django Admin enabled
- CRUD for **Banks**, **Clients**, **Credits**
- Forms with validation feedback (frontend shows DRF field errors)
- Loading states and error handling (frontend)
- OpenAPI schema + Swagger UI documentation
- Pagination, filtering, search, ordering (DRF)
- JWT Authentication (SimpleJWT)
- Security headers: Content Security Policy (django-csp) + Permissions-Policy
- Email notification on new credit creation (console backend by default)

## API Documentation (Swagger)

- OpenAPI Schema: `http://localhost:8001/v1/schema/`
- Swagger UI: `http://localhost:8001/v1/docs/`
- Redoc: `http://localhost:8001/v1/redoc/`

## Running with Docker (recommended)

```bash
./scripts/ensure-env.sh
docker compose up --build
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8001/v1/`
- Admin: `http://localhost:8001/admin/`

Database environment variables (set in `.env`; `.env.example` provides defaults):

```bash
POSTGRES_DB=tu_credito
POSTGRES_USER=tu_credito
POSTGRES_PASSWORD=tu_credito
POSTGRES_HOST=db
POSTGRES_PORT=5432
```

A default admin user is automatically created:
- Username: `admin`
- Password: `admin12345`

For running the backend outside Docker, `./scripts/ensure-env.sh` also seeds
`backend/.env` from `backend/.env.example` so Postgres settings are available.

## Running locally without Docker

### Backend

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 8001
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Frontend: Generate a typed client from drf-spectacular

The frontend includes a generator script that pulls the OpenAPI schema from the backend and generates TypeScript types.

```bash
cd frontend
npm run generate:api
```

This writes to `frontend/src/api/schema.d.ts`.

## Tests (backend)
I wrote tests only for clients.

```bash
cd backend
pytest
```

## AI Usage

I used AI for creating frontend components.



## API Documentation (Swagger)

- OpenAPI Schema: `http://localhost:8001/v1/schema/`
- Swagger UI: `http://localhost:8001/v1/docs/`
- ReDoc: `http://localhost:8001/v1/redoc/`

## Main API Routes

- `GET/POST /v1/banks/`
- `GET/PUT/DELETE /v1/banks/{id}/`
- `GET/POST /v1/clients/`
- `GET/PUT/DELETE /v1/clients/{id}/`
- `GET/POST /v1/credits/`
- `GET/PUT/DELETE /v1/credits/{id}/`

Auth:
- `POST /v1/auth/token/` (JWT)
- `POST /v1/auth/token/refresh/`

## UI Requirements

The React SPA implements:

- Forms with field-level validation feedback (server-side DRF validation errors mapped to inputs)
- Loading states for list fetch + form submits
- Error handling (alerts/snackbars)
- Async delete (no full-page reload)
