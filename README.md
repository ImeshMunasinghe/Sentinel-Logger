# NFC-Based Security Patrol Logging System

A robust, full-stack, corporate-security patrol logging and analytics system. It allows patrol officers to simulate scanning NFC tags at physical checkpoints, which are recorded in an SQLite database, and provides supervisors with a high-fidelity Next.js web application for mapping routes, reviewing logs, and downloading audits (CSV/PDF).

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Python 3.12+** | Core backend language |
| **FastAPI** | REST API framework |
| **SQLAlchemy** | ORM & database abstraction |
| **SQLite** | Lightweight embedded database |
| **Pydantic** | Request/response data validation |
| **BCrypt** | Password hashing |
| **PyJWT** | JWT-based authentication |
| **Uvicorn** | ASGI server |
| **ReportLab** | PDF report generation |

### Frontend
| Technology | Purpose |
|---|---|
| **Next.js 14** | React-based web framework (App Router) |
| **TypeScript** | Typed JavaScript |
| **Tailwind CSS** | Utility-first styling |
| **Axios** | HTTP client for API communication |
| **React Leaflet** | Interactive patrol route mapping |
| **Recharts** | Analytics charts & visualizations |

### Simulator
| Technology | Purpose |
|---|---|
| **Python 3.12+** | CLI patrol simulation scripts |
| **Requests** | HTTP calls to backend API |

---

## 📅 Project Structure

```
nfc-security-logger/
├── backend/                       # FastAPI Server Component
│   ├── app/
│   │   ├── main.py                # Server entrypoint and lifecycles
│   │   ├── database.py            # SQLite engine and get_db session generator
│   │   ├── models.py              # SQLAlchemy schemas (User, Location, etc.)
│   │   ├── schemas.py             # Pydantic validation structures
│   │   ├── auth.py                # BCrypt hashing & JWT signature helpers
│   │   ├── seed.py                # Database population logic
│   │   ├── Users.csv              # Seed users profile table
│   │   ├── Locations.csv          # Seed checkpoints coordinate catalog
│   │   └── routers/               # Modular API endpoint routers
│   └── venv/                      # Python virtual workspace
├── frontend/                      # Next.js Dashboard Client
│   ├── app/                       # Routings workspace (auth/dashboards)
│   ├── components/                # React Leaflet and navigation layouts
│   ├── lib/                       # API axios connection and Context hook interfaces
│   └── tailwind.config.ts         # Styles configurations
└── simulator/                     # Interactive CLI Tag Simulator
    ├── patrol_simulator.py        # Python console patrol generator
    └── simulator_run.log          # Simulator execution trace logs
```

---

## 🚀 Quickstart Guide

### 1. Start the FastAPI Backend
Ensure Python 3.12+ (or compatible environment) is active:
```bash
cd backend
# With virtual environment active:
venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --port 8000 --reload
```
*Note: On startup, the backend automatically seeds SQLite database table records from `Users.csv` and `Locations.csv`.*

### 2. Run the Patrol Simulator
Launch the automated patrol simulator menu run to populate test logs in the database:
```bash
cd simulator
# In another terminal window:
..\backend\venv\Scripts\python.exe patrol_simulator.py --auto
```
*Note: In automated mode, the simulator logs in as `officer1`, spawns a new patrol session, sequentially scans all 5 checkpoints with brief intervals, and finalizes the session.*

### 3. Start the Next.js Dashboard
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 🔒 Default Logins
*   **Security Supervisor (Admin)**:
    *   **Username**: `admin`
    *   **Password**: `adminpass123`
*   **Patrol Officer**:
    *   **Username**: `officer1`
    *   **Password**: `officerpass1`

---

## 💻 Dashboard Modules
1.  **Logs desk (`/logs`)**: Filter scan events dynamically by Officer, Checkpoint, Date Bounds, or Patrol Session ID.
2.  **Patrol Tracker (`/map`)**: Select active or historical patrol sessions to view Leaflet-drawn polylines tracking chronological checkpoint navigation.
3.  **Analytics Center (`/analytics`)**: View charts tracking patrol frequency distributions, leaderboard officers, and missed tag warnings.
4.  **Reports Desk (`/reports`)**: Export activity audits to clean CSV format or ReportLab compiled PDFs.
