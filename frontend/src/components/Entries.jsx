import "../App.css";
import React, { useEffect, useState } from 'react';
import axios from 'axios';

// Status dot logic
const statusDot = (status, checkInTime) => {
  let color = "#ff4d4f"; // Default red

  const isCheckInValid = checkInTime &&
    checkInTime !== "0000-00-00 00:00:00" &&
    !isNaN(new Date(checkInTime).getTime());

  if (isCheckInValid) {
    color = "#1dbf73"; // Green
  } else if (status === "OnLeave" || status === "OnSickLeave") {
    color = "#ffc107"; // Yellow
  }

  return (
    <span
      style={{
        display: "inline-block",
        width: 20,
        height: 20,
        borderRadius: "50%",
        background: color,
        margin: "0 auto",
      }}
    />
  );
};

const Entries = () => {
  const [records, setRecords] = useState([]);

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    axios.get(`http://localhost:5000/api/pdks/by-date/${today}`)
      .then(res => setRecords(res.data))
      .catch(err => console.error(err));
  }, []);

  // Display formatted date
  const todayFormatted = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Check for invalid or empty date
  const isValidDate = (date) =>
    date && date !== "0000-00-00 00:00:00" && !isNaN(new Date(date).getTime());

  return (
    <div
      style={{
        width: "118%",
        background: "#fff",
        borderRadius: 20,
        padding: 24,
        marginTop: 8,
        maxHeight: "75vh",
        overflowY: "auto"
      }}
    >
      <h2 style={{ marginBottom: 16 }}>{todayFormatted}</h2>

      <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
        <thead>
          <tr style={{ height: 48, fontWeight: 700, fontSize: 17, color: "#223" }}>
            <th style={{ textAlign: "left", padding: "8px 16px" }}>Photo</th>
            <th style={{ textAlign: "left", padding: "8px 16px" }}>Personnel Name</th>
            <th style={{ textAlign: "left", padding: "8px 16px" }}>Department</th>
            <th style={{ textAlign: "left", padding: "8px 16px" }}>Role</th>
            <th style={{ textAlign: "left", padding: "8px 16px" }}>Check-in Time</th>
            <th style={{ textAlign: "left", padding: "8px 16px" }}>Check-out Time</th>
            <th style={{ textAlign: "center", padding: "8px 16px" }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {records.map((entry, i) => {
            const formattedCheckIn = isValidDate(entry.pdks_checkInTime)
              ? new Date(entry.pdks_checkInTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '-';

            const formattedCheckOut = isValidDate(entry.pdks_checkOutTime)
              ? new Date(entry.pdks_checkOutTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '-';

            const fullName = `${entry.per_name || ''}${entry.per_lname || ''}`.toLowerCase();

            return (
              <tr key={i} style={{ height: 64, borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '8px 16px' }}>
                  <img
                    src={`/${fullName}.jpg`}
                    alt={entry.per_name}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      objectFit: 'cover',
                      background: '#ff9100',
                    }}
                  />
                </td>
                <td style={{ padding: '8px 16px', fontWeight: 500 }}>
                  {entry.per_name} {entry.per_lname}
                </td>
                <td style={{ padding: '8px 16px' }}>{entry.per_department}</td>
                <td style={{ padding: '8px 16px' }}>{entry.per_role}</td>
                <td style={{ padding: '8px 16px' }}>{formattedCheckIn}</td>
                <td style={{ padding: '8px 16px' }}>{formattedCheckOut}</td>
                <td style={{ textAlign: 'center' }}>
                  {statusDot(entry.per_status, entry.pdks_checkInTime)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default Entries;
