# Personnel Attendance Management System (PDKS)

This is a multi-component PDKS (Personnel Attendance Control System) project. It includes a mobile app for QR code-based check-ins, a backend server with a MySQL database, a web-based dashboard, and a QR code generator.

## 📁 Project Structure

```
root/
├── application/        # React Native mobile app (Expo)
├── backend/            # Node.js backend with REST API and MySQL
├── frontend/           # React.js dashboard (Vite/React)
├── QR Web/             # QR code generator and viewer
│   ├── generateQRWeb.js
│   └── qr.html
├── pdks.sql            # MySQL database dump
├── start-all.bat       # Windows startup script
└── start-all.sh        # macOS/Linux startup script
```

---

## ✨ Features

* ✅ Mobile QR code scanning app (React Native + Expo)
* ✅ RESTful backend with Node.js and MySQL
* ✅ React dashboard for attendance monitoring
* ✅ QR code generator and HTML viewer
* ✅ One-click startup scripts for Windows and macOS/Linux
* ✅ Opens local browser with dashboard and QR code viewer

---

## 🛠️ Prerequisites

Make sure you have the following installed:

* Node.js (v18+ recommended)
* npm
* MySQL or MariaDB
* Expo CLI (`npm install -g expo-cli`)
* macOS: `open` must be available
* Windows: `start` must be available via CMD

---

## 🧑‍💼 Installation

1. Clone or download the repository.
2. Install dependencies:

```bash
cd backend && npm install
cd ../frontend && npm install
cd ../application && npm install
```

3. Import the MySQL database:

```bash
# Using phpMyAdmin or MySQL CLI
CREATE DATABASE pdks;
USE pdks;
# Import pdks.sql content
```

---

## ▶️ Running the Project

### 🫯 On Windows

Double-click or run in terminal:

```bash
start-all.bat
```

This will:

* Start the Expo app
* Launch backend server
* Launch React dashboard
* Run the QR code generator
* Open:

  * [http://localhost:5173](http://localhost:5173) (frontend)
  * QR Web/qr.html in browser

---

### 🍎 On macOS/Linux

Make the script executable:

```bash
chmod +x start-all.sh
./start-all.sh
```

This will do the same as the Windows script, including opening the browser.

---

## 🗃️ Database Overview

Import the `pdks.sql` file to create and populate:

### Tables

* `personnel`: staff info
* `pdks_entry`: daily check-ins and check-outs
* `admin_users`: login accounts with roles (`admin`, `manager`, `supervisor`)

### Sample Admin Accounts

| Username   | Password      | Role       |
| ---------- | ------------- | ---------- |
| admin      | admin123      | admin      |
| manager    | manager123    | manager    |
| supervisor | supervisor123 | supervisor |

---

## 🔐 Environment Variables

If needed, create a `.env` file in the `backend/` directory:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=pdks
PORT=3000
```

> Replace with your actual MySQL credentials.

---

## 📸 Screenshots

Coming soon...

---

## 📌 Notes

* React frontend runs on `http://localhost:5173` by default.
* Backend typically runs on port 3000 or what’s defined in `.env`.
* QR HTML viewer opens from local `QR Web/qr.html`.
* Expo will open a QR code to scan for mobile testing.

---

## 📄 License

This project is intended for educational, demo, or internal use. License terms will be added later.
