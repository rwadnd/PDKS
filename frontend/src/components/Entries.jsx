import "../App.css";
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FaUser,
  FaClock,
  FaUsers,
  FaChartLine,
  FaUserTimes,
  FaCalendarAlt,
  FaUmbrellaBeach,
  FaCoffee,
  FaHome,
} from "react-icons/fa";
import { FiInbox, FiAward } from "react-icons/fi";

// Official holidays (2025)
const OFFICIAL_HOLIDAYS_2025 = [
  "2025-01-01", // New Year's Day
  "2025-01-23", // Test Holiday
  "2025-04-23", // National Sovereignty and Children's Day
  "2025-05-01", // Labor and Solidarity Day
  "2025-05-19", // Youth and Sports Day
  "2025-07-15", // Democracy and National Unity Day
  "2025-08-30", // Victory Day
  "2025-10-29",
];

// Holiday names in Turkish
const HOLIDAY_NAMES = {
  "2025-01-01": "Yılbaşı",
  "2025-01-23": "23 Ocak Test Tatil Günü",
  "2025-04-23": "23 Nisan Ulusal Egemenlik ve Çocuk Bayramı",
  "2025-05-01": "1 Mayıs Emek ve Dayanışma Günü",
  "2025-05-19": "19 Mayıs Atatürk'ü Anma, Gençlik ve Spor Bayramı",
  "2025-07-15": "15 Temmuz Demokrasi ve Milli Birlik Günü",
  "2025-08-30": "30 Ağustos Zafer Bayramı",
  "2025-10-29": "29 Ekim Cumhuriyet Bayramı",
};

// Holiday check
const isHoliday = (date) => {
  const dateStr = date.toISOString().split("T")[0];
  const dayOfWeek = date.getDay();

  // Official holiday check (öncelikli)
  if (OFFICIAL_HOLIDAYS_2025.includes(dateStr)) {
    return { isHoliday: true, type: "official", message: "Official Holiday" };
  }

  // Weekend check (0 = Sunday, 6 = Saturday)
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return { isHoliday: true, type: "weekend", message: "Weekend" };
  }

  return { isHoliday: false, type: null, message: null };
};



  const normalizeAvatar = (avatar_url, person) => {
    if (!avatar_url) {
      // basic initials avatar
      const name =
        (person?.per_name ? person.per_name[0] : "") +
        (person?.per_lname ? person.per_lname[0] : "");
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(
        name || "User"
      )}&background=E5E7EB&color=111827`;
    }
    if (avatar_url.startsWith("http")) return avatar_url;
    // ensure leading slash so it works with the static /uploads mount
    return `${avatar_url.startsWith("/") ? "" : "/"}${avatar_url}`;
  };


// Holiday icon and color functions
const getHolidayIcon = (type) => {
  switch (type) {
    case "weekend":
      return <FaHome style={{ fontSize: "24px", color: "#3b82f6" }} />;
    case "official":
      return <FaUmbrellaBeach style={{ fontSize: "24px", color: "#f59e0b" }} />;
    default:
      return <FaCalendarAlt style={{ fontSize: "24px", color: "#10b981" }} />;
  }
};

const getHolidayColor = (type) => {
  switch (type) {
    case "weekend":
      return "#dbeafe";
    case "official":
      return "#fef3c7";
    default:
      return "#d1fae5";
  }
};

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

// Holiday message component
const HolidayMessage = ({ holidayInfo }) => {
  return (
    <div style={{ display: "flex", gap: "24px", height: "88%" }}>
      {/* Left Card - White */}
      <div
        style={{
          flex: "1",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          padding: "32px",
          boxShadow:
            "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          border: "1px solid #e5e7eb",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "48px",
            color: "#3b82f6",
            marginBottom: "16px",
          }}
        >
          📦
        </div>
        <div
          style={{
            fontSize: "18px",
            fontWeight: "600",
            color: "#374151",
            marginBottom: "8px",
          }}
        >
          1 Mayıs Emek ve Dayanışma Günü
        </div>
        <div
          style={{
            fontSize: "16px",
            color: "#6b7280",
          }}
        >
          No entries found
        </div>
      </div>

      {/* Right Card - Light Blue */}
      <div
        style={{
          width: "300px",
          backgroundColor: "#eaf6ff",
          borderRadius: "16px",
          padding: "32px",
          boxShadow:
            "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          border: "1px solid #e5e7eb",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "24px",
            marginBottom: "16px",
          }}
        >
          🇹🇷
        </div>
        <div
          style={{
            fontSize: "21px",
            fontWeight: "700",
            color: "#00123B",
            marginBottom: "8px",
          }}
        >
          Official Holiday
        </div>
        <div
          style={{
            fontSize: "16px",
            color: "#374151",
            fontWeight: "600",
            marginBottom: "8px",
          }}
        >
          19 Mayıs Atatürk'ü Anma,
        </div>
        <div
          style={{
            fontSize: "16px",
            color: "#374151",
            fontWeight: "600",
            marginBottom: "16px",
          }}
        >
          Gençlik ve Spor Bayramı
        </div>
        <div
          style={{
            fontSize: "15px",
            color: "#00123B",
            fontWeight: "500",
            fontStyle: "italic",
          }}
        >
          Bayramınız kutlu olsun!
        </div>
      </div>
    </div>
  );
};

// Empty list message component
const EmptyStateMessage = ({ isHoliday, holidayInfo }) => {
  if (isHoliday) {
    return <HolidayMessage holidayInfo={holidayInfo} />;
  }

  return (
    <div
      style={{
        backgroundColor: "#f9fafb",
        borderRadius: "16px",
        padding: "40px",
        textAlign: "center",
        border: "2px dashed #e5e7eb",
        margin: "20px",
      }}
    >
      <div
        style={{
          fontSize: "48px",
          marginBottom: "16px",
          opacity: "0.5",
        }}
      >
        📊
      </div>
      <h3
        style={{
          fontSize: "20px",
          fontWeight: "600",
          color: "#374151",
          marginBottom: "8px",
        }}
      >
        No Entry Records Today
      </h3>
      <p
        style={{
          fontSize: "16px",
          color: "#6b7280",
          marginBottom: "16px",
        }}
      >
        Personnel haven't arrived at the office or checked in yet.
      </p>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            padding: "6px 12px",
            backgroundColor: "#e5e7eb",
            borderRadius: "12px",
            fontSize: "12px",
            color: "#6b7280",
          }}
        >
          ⏰ Morning 08:00-09:00
        </div>
        <div
          style={{
            padding: "6px 12px",
            backgroundColor: "#e5e7eb",
            borderRadius: "12px",
            fontSize: "12px",
            color: "#6b7280",
          }}
        >
          📱 QR Code Entry
        </div>
      </div>
    </div>
  );
};

const Entries = ({ searchTerm, onSelectPerson, setPreviousPage }) => {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({
    onTimeToday: 0,
    absentToday: 0,
    absentNames: [],
    totalPersonnel: 0,
  });


  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const holidayInfo = isHoliday(today);

  useEffect(() => {
    axios
      .get("http://localhost:5050/api/pdks/today-stats")
      .then((res) => {
        setStats(res.data);
      })
      .catch((err) => console.error("Failed to load stats:", err));
  }, []);

  useEffect(() => {
    axios
      .get(`http://localhost:5050/api/pdks/by-date/${todayStr}`)
      .then((res) => setRecords(res.data))
      .catch((err) => console.error(err));
  }, []);

  // Calculate stats for cards
  const lastEntryRecord = records[0];

  // Calculate average check-in time
  const checkInTimes = records
    .filter(
      (record) =>
        record.pdks_checkInTime && record.pdks_checkInTime !== "00:00:00"
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
      record.pdks_date.slice(0, 10) === todayStr &&
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

  // Filtered records
  const filteredRecords = records.filter((entry) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      entry.per_name?.toLowerCase().includes(searchLower) ||
      entry.per_lname?.toLowerCase().includes(searchLower) ||
      entry.per_department?.toLowerCase().includes(searchLower) ||
      entry.per_role?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div style={{ display: "flex", gap: "24px", height: "88%" }}>
      {holidayInfo.isHoliday && holidayInfo.type === "official" ? (
        // Official Holiday Design - Two Cards
        <>
          {/* Main Table */}
          <div
            style={{
              flex: "1",
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              boxShadow:
                "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
              border: "1px solid #e5e7eb",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
              height: "82vh",
            }}
          >
            <div
              style={{
                fontSize: "48px",
                color: "#3b82f6",
                marginBottom: "16px",
              }}
            >
              <FiInbox />
            </div>
            <div
              style={{
                fontSize: "22px",
                fontWeight: "600",
                color: "#374151",
                marginBottom: "8px",
              }}
            >
              Official Holiday
            </div>
            <div
              style={{
                fontSize: "18px",
                color: "#6b7280",
              }}
            >
              No entries found
            </div>
          </div>

          {/* Right Sidebar Card */}
          <div
            style={{
              width: "300px",
              height: "75vh",
            }}
          >
            <div
              style={{
                backgroundColor: "#eaf6ff",
                borderRadius: "16px",
                padding: "32px",
                boxShadow:
                  "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                border: "1px solid #e5e7eb",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "35px",
                  marginBottom: "16px",
                  color: "#3b82f6",
                }}
              >
                <FiAward />
              </div>
              <div
                style={{
                  fontSize: "21px",
                  fontWeight: "700",
                  color: "#00123B",
                  marginBottom: "8px",
                }}
              >
                Official Holiday
              </div>
              <div
                style={{
                  fontSize: "16px",
                  color: "#374151",
                  fontWeight: "600",
                  marginBottom: "8px",
                }}
              >
                {HOLIDAY_NAMES[todayStr] || "Official Holiday"}
              </div>
              <div
                style={{
                  fontSize: "15px",
                  color: "#00123B",
                  fontWeight: "500",
                  fontStyle: "italic",
                }}
              >
                Bayramınız kutlu olsun!
              </div>
            </div>
          </div>
        </>
      ) : holidayInfo.isHoliday && holidayInfo.type === "weekend" ? (
        // Weekend Design - Two Cards
        <>
          {/* Main Table */}
          <div
            style={{
              flex: "1",
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              boxShadow:
                "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
              border: "1px solid #e5e7eb",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
              height: "82vh",
            }}
          >
            <div
              style={{
                fontSize: "48px",
                color: "#3b82f6",
                marginBottom: "16px",
              }}
            >
              <FaHome />
            </div>
            <div
              style={{
                fontSize: "22px",
                fontWeight: "600",
                color: "#374151",
                marginBottom: "8px",
              }}
            >
              Weekend
            </div>
            <div
              style={{
                fontSize: "18px",
                color: "#6b7280",
              }}
            >
              No entries found
            </div>
          </div>

          {/* Right Sidebar Card */}
          <div
            style={{
              width: "300px",
              height: "75vh",
            }}
          >
            <div
              style={{
                backgroundColor: "#eaf6ff",
                borderRadius: "16px",
                padding: "32px",
                boxShadow:
                  "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                border: "1px solid #e5e7eb",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "35px",
                  marginBottom: "16px",
                  color: "#3b82f6",
                }}
              >
                <FaHome />
              </div>
              <div
                style={{
                  fontSize: "21px",
                  fontWeight: "700",
                  color: "#374151",
                  marginBottom: "8px",
                }}
              >
                Weekend
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "16px",
                  color: "#6b7280",
                  fontWeight: "600",
                  marginBottom: "16px",
                }}
              >
                <FaCalendarAlt />
                <span>
                  {new Date().toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                    weekday: "short",
                  })}
                </span>
              </div>
              <div
                style={{
                  fontSize: "15px",
                  color: "#374151",
                  fontWeight: "500",

                  marginTop: "16px",
                }}
              >
                Have a nice holiday!
              </div>
            </div>
          </div>
        </>
      ) : (
        // Normal Day Design - Table with Sidebar Cards
        <>
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

            {/* Table Content */}
            {filteredRecords.length === 0 ? (
              <EmptyStateMessage isHoliday={false} holidayInfo={{}} />
            ) : (
              filteredRecords.map((entry, i) => {
                const formattedCheckIn =
                  entry.pdks_checkInTime &&
                  entry.pdks_checkInTime !== "00:00:00"
                    ? entry.pdks_checkInTime.slice(0, 5)
                    : "-";

                const formattedCheckOut =
                  entry.pdks_checkOutTime &&
                  entry.pdks_checkOutTime !== "00:00:00"
                    ? entry.pdks_checkOutTime.slice(0, 5)
                    : "-";
                return (
                  
                  <div
                    key={i}
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "80px 1fr 120px 120px 120px 120px 80px",
                      gap: "16px",
                      padding: "20px",
                      borderBottom: "1px solid #f3f4f6",
                      alignItems: "center",
                      transition: "background-color 0.2s ease",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      if (onSelectPerson && setPreviousPage) {
                        setPreviousPage("entries");
                        window.history.pushState(
                          null,
                          "",
                          `/personnel/${entry.per_id}`
                        );
                        window.dispatchEvent(new PopStateEvent("popstate"));
                      }
                    }}
                    onMouseOver={(e) =>
                      (e.target.parentElement.style.backgroundColor = "#f9fafb")
                    }
                    onMouseOut={(e) =>
                      (e.target.parentElement.style.backgroundColor =
                        "transparent")
                    }
                  >
                    
                    {/* Photo */}
                    
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <img
                        src={normalizeAvatar(entry.avatar_url, entry)}
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
              })
            )}
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
                        const [hours, minutes] = entry.pdks_checkInTime
                          .split(":")
                          .map(Number);
                        // On time: before 9:00 AM
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
                    backgroundColor: "#8b5cf6",
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
                        const [hours, minutes] = entry.pdks_checkInTime
                          .split(":")
                          .map(Number);
                        // On time: before 9:00 AM
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
                  ? `${absentToday.slice(0, 2).join(", ")}${
                      absentToday.length > 2 ? "..." : ""
                    }`
                  : "All personnel present"}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Entries;
