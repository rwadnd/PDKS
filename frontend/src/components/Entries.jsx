import "../App.css";
import React, { useEffect, useState } from "react";
import axios from "axios";
import {FaClock, FaChartLine, FaUserTimes } from "react-icons/fa";

// Status dot logic
const statusDot = (status, checkInTime) => {
  let color = "#c62116ff"; // Default red

  const isCheckInValid =
    checkInTime &&
    checkInTime !== "00:00:00" &&
    /^\d{2}:\d{2}:\d{2}$/.test(checkInTime); // Basic regex check for time format

  if (isCheckInValid) {
    color = "#1dbf73"; // Green
  } else if (status === "OnLeave" || status === "OnSickLeave") {
    color = "#ffc107"; // Yellow
  }

  return (
    <span
      style={{
        display: "inline-block",
        width: 10,
        height: 10,
        borderRadius: "50%",
        margin: "0 auto",
        backgroundColor: color,
      }}
    />
  );
};


const Entries = ({ searchTerm, onSelectPerson }) => {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({
    onTimeToday: 0,
    absentToday: 0,
    absentNames: [],
    totalPersonnel: 0,
  });

  useEffect(() => {
    axios.get("http://localhost:5050/api/pdks/today-stats")
      .then((res) => {
        setStats(res.data);
        {/*console.log("Today's Stats:", res.data);*/ }
      })
      .catch((err) => console.error("Failed to load stats:", err));
  }, []);


  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  useEffect(() => {
    axios.get(`http://localhost:5050/api/pdks/by-date/${today}`)
      .then(res => setRecords(res.data))
      .catch(err => console.error(err));
  }, []);

  // Calculate stats for cards
  const lastEntryRecord = records[0];

  // Calculate average check-in time
  const checkInTimes = records
    .filter((record) =>
      record.pdks_checkInTime &&
      record.pdks_checkInTime !== "00:00:00"
    )
    .map((record) => {
      const [hours, minutes] = record.pdks_checkInTime.split(":").map(Number);
      return hours * 60 + minutes;
    });

  const averageCheckInMinutes =
    checkInTimes.length > 0
      ? Math.round(
        checkInTimes.reduce((sum, minutes) => sum + minutes, 0) /
        checkInTimes.length
      )
      : 0;

  const averageCheckInHours = Math.floor(averageCheckInMinutes / 60);
  const averageCheckInMins = averageCheckInMinutes % 60;
  const averageCheckInTime = `${averageCheckInHours
    .toString()
    .padStart(2, "0")}:${averageCheckInMins.toString().padStart(2, "0")}`;



  const todayEntries = records.filter((record) => {
    return (
      record.pdks_date &&
      record.pdks_date.slice(0, 10) === today &&
      record.pdks_checkInTime &&
      record.pdks_checkInTime !== "00:00:00"
    );
  });

  // Get all unique personnel from records
  const allPersonnel = [
    ...new Set(
      records.map((record) => `${record.per_name} ${record.per_lname}`)
    ),
  ];
  const presentToday = [
    ...new Set(
      todayEntries.map((record) => `${record.per_name} ${record.per_lname}`)
    ),
  ];
  const absentToday = allPersonnel.filter(
    (person) => !presentToday.includes(person)
  );


  // Check for invalid or empty date


  return (
    <div style={{ display: "flex", gap: "24px", height: "88%" }}>
      {/* Main Table */}
      <div
        style={{
          flex: "1",
          width: "110%",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          boxShadow:
            "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          border: "1px solid #e5e7eb",
          overflowX: "hidden",
          overflowY: "scroll",
          maxHeight: "88vh",
        }}
      >
        {/* Table Header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "80px 1fr 120px 120px 120px 120px 80px",
            gap: "16px",
            padding: "20px",
            backgroundColor: "#f9fafb",
            borderBottom: "1px solid #e5e7eb",
            fontWeight: "600",
            fontSize: "14px",
            color: "#374151",
          }}
        >
          <div>Photo</div>
          <div>Personnel Name</div>
          <div>Department</div>
          <div>Role</div>
          <div>Check-in Time</div>
          <div>Check-out Time</div>
          <div>Status</div>
        </div>

        {/* Table Rows */}
        {records
          .filter((entry) => {
            if (!searchTerm) return true;
            const searchLower = searchTerm.toLowerCase();
            return (
              entry.per_name?.toLowerCase().includes(searchLower) ||
              entry.per_lname?.toLowerCase().includes(searchLower) ||
              entry.per_department?.toLowerCase().includes(searchLower) ||
              entry.per_role?.toLowerCase().includes(searchLower)
            );
          })
          .map((entry, i) => {
            const formattedCheckIn = entry.pdks_checkInTime &&
              entry.pdks_checkInTime !== "00:00:00"
              ? entry.pdks_checkInTime.slice(0, 5)
              : "-";

            const formattedCheckOut = entry.pdks_checkOutTime &&
              entry.pdks_checkOutTime !== "00:00:00"
              ? entry.pdks_checkOutTime.slice(0, 5)
              : "-";

            return (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "80px 1fr 120px 120px 120px 120px 80px",
                  gap: "16px",
                  padding: "20px",
                  borderBottom: "1px solid #f3f4f6",
                  alignItems: "center",
                  transition: "background-color 0.2s ease",
                  cursor: "pointer", // İmleci pointer yap
                }}
                onClick={() => {
                  if (onSelectPerson) {
                    onSelectPerson({
                      per_id: entry.per_id,
                      per_name: entry.per_name,
                      per_lname: entry.per_lname,
                      per_role: entry.per_role,
                      per_department: entry.per_department,
                    });
                  }
                }}
                onMouseOver={(e) =>
                  (e.target.parentElement.style.backgroundColor = "#f9fafb")
                }
                onMouseOut={(e) =>
                  (e.target.parentElement.style.backgroundColor = "transparent")
                }
              >
                {/* Photo */}
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <img
                    src={`/${(
                      entry.per_name + entry.per_lname
                    ).toLowerCase()}.jpg`}
                    alt={`${entry.per_name} ${entry.per_lname}`}
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "2px solid #e5e7eb",
                    }}
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      backgroundColor: "#f59e0b",
                      display: "none",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#ffffff",
                      fontWeight: "600",
                      fontSize: "16px",
                    }}
                  >
                    ?
                  </div>
                </div>

                {/* Personnel Name */}
                <div style={{ fontWeight: "500", color: "#111827" }}>
                  {entry.per_name} {entry.per_lname}
                </div>

                {/* Department */}
                <div style={{ color: "#6b7280" }}>
                  {entry.per_department || "IT"}
                </div>

                {/* Role */}
                <div style={{ color: "#6b7280" }}>
                  {entry.per_role || "Intern"}
                </div>

                {/* Check-in Time */}
                <div style={{ color: "#6b7280" }}>{formattedCheckIn}</div>

                {/* Check-out Time */}
                <div style={{ color: "#6b7280" }}>{formattedCheckOut}</div>

                {/* Status */}
                <div style={{ display: "flex", justifyContent: "center" }}>
                  {statusDot(entry.per_status, entry.pdks_checkInTime)}
                </div>
              </div>
            );
          })}
      </div>

      {/* Right Sidebar Cards */}
      <div
        style={{
          width: "300px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {/* Last Entry Card */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            padding: "24px",
            boxShadow:
              "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            border: "1px solid #e5e7eb",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "14px",
                  color: "#6b7280",
                  fontWeight: "500",
                }}
              >
                Last Entry
              </div>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "600",
                  color: "#111827",
                }}
              >
                {lastEntryRecord
                  ? `${lastEntryRecord.per_name} ${lastEntryRecord.per_lname}`
                  : "No entries"}
              </div>
            </div>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                backgroundColor: "#3b82f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
              }}
            >
              <FaClock size={20} />
            </div>
          </div>
          <div style={{ fontSize: "14px", color: "#6b7280" }}>
            {lastEntryRecord
              ? `${new Date(
                `${lastEntryRecord.pdks_date}T${lastEntryRecord.pdks_checkInTime}`
              ).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })} • ${lastEntryRecord.per_department}`
              : "No recent activity"}
          </div>
        </div>

        {/* Average Check-in Time Card */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            padding: "24px",
            boxShadow:
              "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            border: "1px solid #e5e7eb",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "14px",
                  color: "#6b7280",
                  fontWeight: "500",
                }}
              >
                Average Check-in
              </div>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "600",
                  color: "#111827",
                }}
              >
                {averageCheckInTime}
              </div>
            </div>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                backgroundColor: "#10b981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
              }}
            >
              <FaChartLine size={20} />
            </div>
          </div>
          <div style={{ fontSize: "14px", color: "#6b7280" }}>
            All time average
          </div>
        </div>

        {/* On Time Card */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            padding: "24px",
            boxShadow:
              "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            border: "1px solid #e5e7eb",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "14px",
                  color: "#6b7280",
                  fontWeight: "500",
                }}
              >
                On Time Today
              </div>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "600",
                  color: "#111827",
                }}
              >
                {
                  todayEntries.filter((entry) => {
                    const [hours, minutes] = entry.pdks_checkInTime.split(":").map(Number);
                    // On time: before 9:00 AM
                    console.log(hours)
                    return hours <= 8 && minutes <= 30;
                  }).length
                }
              </div>
            </div>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                backgroundColor: "#8b5cf6", // Yeşilden mora değiştirdim
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
              }}
            >
              <FaClock size={20} />
            </div>
          </div>
          <div style={{ fontSize: "14px", color: "#6b7280" }}>
            {todayEntries.length > 0
              ? `${Math.round(
                (todayEntries.filter((entry) => {
                  const [hours, minutes] = entry.pdks_checkInTime.split(":").map(Number);
                  // On time: before 9:00 AM
                  console.log(hours)
                  return hours <= 8 && minutes <= 30;
                }).length /
                  todayEntries.length) *
                100
              )}% of today's entries`
              : "No entries today"}
          </div>
        </div>

        {/* Absent Personnel Card */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            padding: "24px",
            boxShadow:
              "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            border: "1px solid #e5e7eb",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "14px",
                  color: "#6b7280",
                  fontWeight: "500",
                }}
              >
                Absent Today
              </div>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "600",
                  color: "#111827",
                }}
              >
                {absentToday.length}
              </div>
            </div>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                backgroundColor: "#ef4444",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
              }}
            >
              <FaUserTimes size={20} />
            </div>
          </div>
          <div style={{ fontSize: "14px", color: "#6b7280" }}>
            {absentToday.length > 0
              ? `${absentToday.slice(0, 2).join(", ")}${absentToday.length > 2 ? "..." : ""
              }`
              : "All personnel present"}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Entries;
