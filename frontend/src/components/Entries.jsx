import "../App.css";
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const statusDot = (status) => (
  <span
    style={{
      display: "inline-block",
      width: 20,
      height: 20,
      borderRadius: "50%",
      background: status === "ok" ? "#1dbf73" : "#ff4d4f",
      margin: "0 auto",
    }}
  />
);

const Entries = () => {
  const [records, setRecords] = useState([]);

  useEffect(() => {

    axios.get(`http://localhost:5000/api/pdks`)
      .then(res => setRecords(res.data))
      .catch(err => console.error(err));
  });


  return (
    <div
      style={{ width: "118%", background: "#fff", borderRadius: 20, padding: 24, marginTop: 8, maxHeight: "75vh",
  overflowY: "auto" }}
    >
      <table
        style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}
      >
        <thead>
          <tr
            style={{ height: 48, fontWeight: 700, fontSize: 17, color: "#223" }}
          >
            <th style={{ textAlign: "left", padding: "8px 16px" }}>Photo</th>
            <th style={{ textAlign: "left", padding: "8px 16px" }}>
              Personnel Name
            </th>
            <th style={{ textAlign: "left", padding: "8px 16px" }}>Department</th>
            <th style={{ textAlign: "left", padding: "8px 16px" }}>Role</th>
            <th style={{ textAlign: "left", padding: "8px 16px" }}>
              Check-in Time
            </th>
            <th style={{ textAlign: "left", padding: "8px 16px" }}>
              Check-out Time
            </th>
            <th style={{ textAlign: "center", padding: "8px 16px" }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {records.map((entry, i) => {
    const formattedCheckOut = entry.pdks_checkOutTime
      ? new Date(entry.pdks_checkOutTime).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '-';

    const formattedCheckIn = entry.pdks_checkInTime
      ? new Date(entry.pdks_checkInTime).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '-';

    return (
      <tr key={i} style={{ height: 64, borderBottom: '1px solid #f0f0f0' }}>
        <td style={{ padding: '8px 16px' }}>
          <img
            src={`/${(entry.per_name + entry.per_lname).toLowerCase()}.jpg`}
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
        <td style={{ textAlign: 'center' }}>{statusDot(entry.per_status)}</td>
      </tr>
    );
  })}
      </tbody>
    </table>
  </div >
)};

export default Entries;
