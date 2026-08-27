# Project Evaluation Report — NFC-Based Security System

This evaluation report details the time log tracking, verification results, and technical review of the full-stack NFC-based security patrol logging system.

---

## 📈 Effort & Time Log Tracking

A total of **15.5 hours** was dedicated to structural design, REST endpoint implementation, Next.js UI integration, and verification debugging.

| Date | Phase / Task Description | Hours Spent |
| :--- | :--- | :--- |
| **Aug 25** | **0. Planning & Scaffolding**: Setup environment boundaries, SQLite engine structures, seed CSV catalogs (`Users.csv`, `Locations.csv`). | 1.5 hrs |
| **Aug 25** | **1. FastAPI Backend Service**: Wrote SQLAlchemy class models, token handlers, and controller routers (Auth, Patrol Workflows, CRUDs). | 3.5 hrs |
| **Aug 26** | **2. CLI Simulator Module**: Programmed Python simulator script with interactive menus and automated run modes. | 1.5 hrs |
| **Aug 26** | **3. Next.js Auth & Client Libs**: Developed Auth Context hooks, axios client wrapper, and Tanstack Query providers wrapper. | 2.0 hrs |
| **Aug 26** | **4. Dashboard Module Panels**: Integrated Logs query screens, Leaflet rendering pages, Recharts statistics dashboards, and Reports compile actions. | 4.0 hrs |
| **Aug 27** | **5. Verification & Bug Squashing**: Rectified Next.js bundler dependencies (globals.css, Tailwind styles extend parameters) and resolved Python 3.14 runtime type errors. | 3.0 hrs |
| **Total** | **Full-Stack Execution & Delivery** | **15.5 hrs** |

---

## 🔬 Product Verification Checklist

We ran automated verification logs against database records and confirmed full feature compliance:

### 1. Backend Lifecycle Seeding
-   On startup, the FastAPI app read `Users.csv` and `Locations.csv`.
-   Hashed cleartext passwords using secure raw `bcrypt` salts.
-   Instantiated the tables: `users` (4 rows), `locations` (5 rows).

### 2. Simulator Execution Run
-   Launched `patrol_simulator.py --auto` in the virtual environment.
-   **Output Actions**:
    1.  Logged in as `officer1` -> Retrieved JWT bearer token successfully.
    2.  Created Patrol Session #1 (status: `active`).
    3.  Sequentially scanned 5 NFC checkpoints (North Gate, South Gate, Parking Lot, Main Lobby, Server Room) with intervals.
    4.  Completed patrol session (status: `completed`).
-   Verified SQLite record counts: `patrol_sessions` (1 completed entry), `scan_logs` (5 scan logs).

### 3. Frontend Next.js Client Compilation
-   Fitted Tailwind configuration with Custom styles tags.
-   Executed `npm run build` to verify webpack build status.
-   **Result**: Succeeded with **Exit 0** (zero warnings / errors).

---

## 💡 Tech Design Summary & Review

1.  **Strict Hashing Compatibility**: Replaces high-level `passlib` crypt wrappers with raw Python `bcrypt` commands to guarantee startup longevity across new python core releases.
2.  **Next.js SSR Map Dynamism**: Uses `next/dynamic` wrapper imports to load Leaflet script assets on demand, bypassing browser dependency clashes.
3.  **Lightweight PDF Compilations**: Relies on standalone `ReportLab` scripts to output clean PDF lists, avoiding heavy external engine wrappers.
