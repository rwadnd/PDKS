@echo off

echo Starting Application...
start cmd /k "cd "application" && npx expo start"

echo Starting backend...
start cmd /k "cd backend && npm run dev"

echo Starting frontend...
start cmd /k "cd frontend && npm run dev"

echo Starting QR Web...
start cmd /k "cd "QR Web" && node generateQRWeb.js"

timeout /t 3 >nul  REM wait a bit for frontend to start

echo Opening browser tabs...
start http://localhost:5173
start "" "QR Web\qr.html"
