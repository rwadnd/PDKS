#!/bin/bash

echo "Starting Application..."
(cd application && npx expo start) &

echo "Starting backend..."
(cd backend && npm run dev) &

echo "Starting frontend..."
(cd frontend && npm run dev) &

echo "Starting QR Web..."
(cd "QR Web" && node generateQRWeb.js) &

# Wait a bit to let frontend start
sleep 3

echo "Opening browser tabs..."
open http://localhost:5173
open "QR Web/qr.html"

# Optional: keep script alive if needed
wait
