import "../App.css";
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FaUser,
  FaClock,
  FaUsers,
  FaChartLine,
  FaUserTimes,
} from "react-icons/fa";

// Status dot logic
const statusDot = (status, checkInTime) => {
  let color = "#c62116ff"; // Default red

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
        width: 10,
        height: 10,
        borderRadius: "50%",
        margin: "0 auto",
        backgroundColor: color
      }}
    />
  );
};

const Entries = ({ searchTerm }) => {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({
    onTimeToday: 0,
    absentToday: 0,
    absentNames: [],
    totalPersonnel: 0,
  });

  useEffect(() => {
    axios.get("http://localhost:5000/api/pdks/today-stats")
      .then((res) => {
        setStats(res.data);
        {/*console.log("Today's Stats:", res.data);*/ }
      })
      .catch((err) => console.error("Failed to load stats:", err));
  }, []);


  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  useEffect(() => {
    axios.get(`http://localhost:5000/api/pdks/by-date/${today}`)
      .then(res => setRecords(res.data))
      .catch(err => console.error(err));
  }, []);

  // Calculate stats for cards
  const lastEntryRecord = records[0];
  const todayEntriesCount = records.filter((record) => {


    const recordDate = new Date(record.pdks_date).toDateString();
    return recordDate === today;
  }).length;

  const totalEntries = records.length;
  const averageEntriesPerDay =
    totalEntries > 0 ? Math.round(totalEntries / 30) : 0; // Assuming 30 days

  // Calculate average check-in time
  const checkInTimes = records
    .filter((record) =>
      record.pdks_checkInTime &&
      record.pdks_checkInTime !== "0000-00-00 00:00:00" &&
      !isNaN(new Date(record.pdks_checkInTime).getTime())
    )
    .map((record) => {
      const date = new Date(record.pdks_checkInTime);
      return date.getHours() * 60 + date.getMinutes();
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

  // Debug: Check the calculation
  // console.log("Check-in times:", checkInTimes);
  // console.log("Average minutes:", averageCheckInMinutes);
  // console.log("Average time:", averageCheckInTime);

  // Calculate department distribution
  const departmentStats = records.reduce((acc, record) => {
    const dept = record.per_department || "IT";
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});

  const topDepartment = Object.entries(departmentStats).sort(
    (a, b) => b[1] - a[1]
  )[0];
  const topDepartmentPercentage = topDepartment
    ? Math.round((topDepartment[1] / records.length) * 100)
    : 0;

  // Calculate absent personnel today
  const isValidDate = (date) =>
    date && date !== "0000-00-00 00:00:00" && !isNaN(new Date(date).getTime());
  const todayEntries = records.filter((record) => {
    console.log(record.pdks_date)
    console.log(today)
    return (
      record.pdks_date &&
      record.pdks_date.split(" ")[0] === today &&
      isValidDate(record.pdks_checkInTime)

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

  // Display formatted date
  const todayFormatted = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

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
          // overflowY: "auto",
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
              entry.pdks_checkInTime !== "0000-00-00 00:00:00" &&
              !isNaN(new Date(entry.pdks_checkInTime).getTime())
              ? new Date(entry.pdks_checkInTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
              : "-";

            const formattedCheckOut = entry.pdks_checkOutTime &&
              entry.pdks_checkOutTime !== "0000-00-00 00:00:00" &&
              !isNaN(new Date(entry.pdks_checkOutTime).getTime())
              ? new Date(entry.pdks_checkOutTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
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
                lastEntryRecord.pdks_checkInTime
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
                    const checkInTime = new Date(entry.pdks_checkInTime);
                    const hours = checkInTime.getHours();
                    const minutes = checkInTime.getMinutes();
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
                    const checkInTime = new Date(entry.pdks_checkInTime);
                    const hours = checkInTime.getHours();
                    const minutes = checkInTime.getMinutes();
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
