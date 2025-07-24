import React from "react";
import "../App.css";

const mockEntries = [
  {
    photo:
      "https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=facearea&w=64&h=64&q=80",
    name: "İpek Zorpineci",
    department: "Digital Product",
    role: "Manager",
    checkin: "09.00",
    checkout: "10.00",
    status: "ok",
  },
  {
    photo:
      "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=facearea&w=64&h=64&q=80",
    name: "Ravad Nadam",
    department: "Digital Product",
    role: "Software Developer",
    checkin: "-",
    checkout: "-",
    status: "fail",
  },
  {
    photo:
      "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=facearea&w=64&h=64&q=80",
    name: "Sude Terkan",
    department: "Fashion",
    role: "Tester",
    checkin: "-",
    checkout: "-",
    status: "fail",
  },
  {
    photo:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=facearea&w=64&h=64&q=80",
    name: "Zekeriya Alabus",
    department: "Mobile",
    role: "Business Analyst",
    checkin: "08.38",
    checkout: "18.00",
    status: "ok",
  },
  {
    photo:
      "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=facearea&w=64&h=64&q=80",
    name: "Trump suu",
    department: "Electronic",
    role: "Cleaning Staff",
    checkin: "08.30",
    checkout: "18.30",
    status: "ok",
  },
  {
    photo:
      "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=facearea&w=64&h=64&q=80",
    name: "Melek Varol",
    department: "Digital Product",
    role: "Secretary",
    checkin: "-",
    checkout: "-",
    status: "fail",
  },
  {
    photo:
      "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=facearea&w=64&h=64&q=80",
    name: "Mehmet Türk",
    department: "Fashion",
    role: "Security",
    checkin: "08.20",
    checkout: "00.00",
    status: "ok",
  },
];

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

const Entries = () => (
  <div
    style={{ background: "#fff", borderRadius: 20, padding: 24, marginTop: 8 }}
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
        {mockEntries.map((entry, i) => (
          <tr key={i} style={{ height: 64, borderBottom: "1px solid #f0f0f0" }}>
            <td style={{ padding: "8px 16px" }}>
              <img
                src={entry.photo}
                alt={entry.name}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  objectFit: "cover",
                  background: "#ff9100",
                }}
              />
            </td>
            <td style={{ padding: "8px 16px", fontWeight: 500 }}>
              {entry.name}
            </td>
            <td style={{ padding: "8px 16px" }}>{entry.department}</td>
            <td style={{ padding: "8px 16px" }}>{entry.role}</td>
            <td style={{ padding: "8px 16px" }}>{entry.checkin}</td>
            <td style={{ padding: "8px 16px" }}>{entry.checkout}</td>
            <td style={{ textAlign: "center" }}>{statusDot(entry.status)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default Entries;
