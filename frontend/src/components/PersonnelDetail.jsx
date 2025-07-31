import React, { useEffect, useState } from "react";
import "../App.css";
import axios from "axios";
import { FiClock, FiActivity, FiTrendingUp, FiCalendar } from "react-icons/fi";

const PersonnelDetail = ({ person, onBack, onUpdate }) => {
  if (!person) return null;
  const [records, setRecords] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    per_name: person.per_name || "",
    per_lname: person.per_lname || "",
    per_role: person.per_role || "",
    per_department: person.per_department || "",
  });

  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/pdks/${person.per_id}`)
      .then((res) => setRecords(res.data))
      .catch((err) => console.error(err));
  }, [person]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({
      per_name: person.per_name || "",
      per_lname: person.per_lname || "",
      per_role: person.per_role || "",
      per_department: person.per_department || "",
    });
  };

  const handleSave = async () => {
    try {
      await axios.put(
        `http://localhost:5000/api/personnel/${person.per_id}`,
        editForm
      );
      console.log(editForm)
      setIsEditing(false);
      if (onUpdate) {
        onUpdate({ ...person, ...editForm });
      }
    } catch (error) {
      console.error("Error updating personnel:", error);
      alert("Güncelleme sırasında hata oluştu!");
    }
  };

  const handleInputChange = (field, value) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const getMonday = () => {
    const d = new Date();
    const day = d.getDay() || 7;
    if (day !== 1) d.setHours(-24 * (day - 1));
    d.setHours(0, 0, 0, 0);
    return d;
  };


  const today = new Date().toISOString().split("T")[0]; // "2025-07-30"


  const todayRecord = records.find((rec) => {
    const recordDate = rec.pdks_date?.split(" ")[0];
    return recordDate === today;
  });
  const formattedCheckIn = todayRecord?.pdks_checkInTime &&
    todayRecord.pdks_checkInTime !== "0000-00-00 00:00:00" &&
    !isNaN(new Date(todayRecord.pdks_checkInTime).getTime())
    ? new Date(todayRecord.pdks_checkInTime).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    : "-";

  const formattedCheckOut = todayRecord?.pdks_checkOutTime &&
    todayRecord.pdks_checkOutTime !== "0000-00-00 00:00:00" &&
    !isNaN(new Date(todayRecord.pdks_checkOutTime).getTime())
    ? new Date(todayRecord.pdks_checkOutTime).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    : "-";


  const getTimeAtWork = () => {
    if (!todayRecord?.pdks_checkInTime || todayRecord.pdks_checkInTime === "0000-00-00 00:00:00") {
      return "-"; // No check-in
    }

    const checkIn = new Date(todayRecord.pdks_checkInTime);
    const checkOutValid = todayRecord.pdks_checkOutTime && todayRecord.pdks_checkOutTime !== "0000-00-00 00:00:00";

    const end = checkOutValid ? new Date(todayRecord.pdks_checkOutTime) : new Date(); // Use now if no check-out
    const diffMs = end - checkIn;

    if (isNaN(diffMs) || diffMs < 0) return "-";

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };




  const getProductivityScore = () => {
    const now = new Date();
    const currentDay = now.getDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6

    // Adjust to Monday
    const monday = new Date(now);
    const offset = currentDay === 0 ? -6 : 1 - currentDay;
    monday.setDate(now.getDate() + offset);
    monday.setHours(0, 0, 0, 0);

    // 🔢 Total worked hours (Mon → now)
    const totalWorkedHours = records
      .filter((rec) => {
        const date = new Date(rec.pdks_date);
        return date >= monday && date <= now;
      })
      .reduce((sum, rec) => {
        if (!rec.pdks_checkInTime || rec.pdks_checkInTime === "0000-00-00 00:00:00") return sum;
        const inTime = new Date(rec.pdks_checkInTime);
        const outTimeValid = rec.pdks_checkOutTime && rec.pdks_checkOutTime !== "0000-00-00 00:00:00";
        const outTime = outTimeValid ? new Date(rec.pdks_checkOutTime) : now;
        if (isNaN(inTime) || isNaN(outTime) || outTime < inTime) return sum;
        const diff = (outTime - inTime) / (1000 * 60 * 60); // in hours
        return sum + diff;
      }, 0);

    // ⏳ Required hours = 9h per weekday up to now
    let requiredHours = 0;

    for (let i = 0; i <= 6; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      if (day > now) break; // Don't count future days

      const isWeekday = day.getDay() >= 1 && day.getDay() <= 5;
      if (!isWeekday) continue;

      if (day.toDateString() === now.toDateString()) {
        // If today, only add hours up to current time
        const hoursSoFar = now.getHours() + now.getMinutes() / 60;
        requiredHours += Math.min(hoursSoFar, 9);
      } else {
        requiredHours += 9;
      }
    }

    if (requiredHours === 0) return "0%";

    const percentage = (totalWorkedHours / requiredHours) * 100;
    return `${Math.round(percentage)}%`;
  };




  const getTotalAbsencesThisMonth = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // normalize

    // Create a Set of valid check-in dates (YYYY-MM-DD)
    const checkInDates = new Set(
      records
        .filter(
          (rec) =>
            rec.pdks_checkInTime &&
            rec.pdks_checkInTime !== "0000-00-00 00:00:00" &&
            !isNaN(new Date(rec.pdks_checkInTime).getTime())
        )
        .map((rec) => new Date(rec.pdks_checkInTime).toISOString().split("T")[0])
    );

    let absenceCount = 0;

    // Loop through each day from start of month to today
    for (let d = new Date(startOfMonth); d <= today; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip Sunday & Saturday

      const dateStr = d.toISOString().split("T")[0];
      if (!checkInDates.has(dateStr)) {
        absenceCount++;
      }
    }

    return absenceCount;
  };

  const checkInDatesSet = new Set(
    records
      .filter((rec) =>
        rec.pdks_checkInTime &&
        rec.pdks_checkInTime !== "0000-00-00 00:00:00" &&
        !isNaN(new Date(rec.pdks_checkInTime).getTime())
      )
      .map((rec) => new Date(rec.pdks_checkInTime).toISOString().split("T")[0])
  );




  // Find most recent Monday before or on today
  const todayy = new Date();
  todayy.setHours(0, 0, 0, 0);
  const todayDay = todayy.getDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6
  const daysSinceMonday = (todayDay + 6) % 7; // converts Sun→6, Mon→0, Tue→1, etc.
  const lastMonday = new Date(todayy);
  lastMonday.setDate(todayy.getDate() - daysSinceMonday);
  lastMonday.setHours(0, 0, 0, 0);

  // Get the first day in the heatmap (52 weeks ago from last Monday)
  const startDate = new Date(lastMonday);
  startDate.setDate(startDate.getDate() - (51 * 7));





  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
          marginTop: -20,
        }}
      >
        <button
          onClick={onBack}
          style={{
            padding: "8px 16px",
            backgroundColor: "transparent",
            color: "#374151",
            border: "none",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          &larr; Back
        </button>
        <div></div> {/* Sağ tarafta boşluk bırakıyor */}
      </div>
      <div
        // personneldetail kart kismi
        style={{
          display: "flex",
          alignItems: "flex-start",
          background: "#fff",
          borderRadius: 10,
          padding: 32,
          marginBottom: 32,
          position: "relative",
          marginLeft: 32,
        }}
      >
        <img
          src={`/${(person.per_name + person.per_lname).toLowerCase()}.jpg`}
          alt={person.per_name}
          style={{
            width: 130,
            height: 125,
            borderRadius: "50%",
            marginRight: 40,
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "0px",
          }}
        >
          {isEditing ? (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "17px" }}
            >
              <div style={{ display: "flex", gap: "16px" }}>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      fontSize: "14px",
                      color: "#6b7280",
                      marginBottom: "4px",
                      display: "block",
                    }}
                  >
                    Ad
                  </label>
                  <input
                    type="text"
                    value={editForm.per_name}
                    onChange={(e) =>
                      handleInputChange("per_name", e.target.value)
                    }
                    style={{
                      padding: "12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "16px",
                      outline: "none",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#3b82f6";
                      e.target.style.boxShadow =
                        "0 0 0 3px rgba(59, 130, 246, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#d1d5db";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      fontSize: "14px",
                      color: "#6b7280",
                      marginBottom: "4px",
                      display: "block",
                    }}
                  >
                    Soyad
                  </label>
                  <input
                    type="text"
                    value={editForm.per_lname}
                    onChange={(e) =>
                      handleInputChange("per_lname", e.target.value)
                    }
                    style={{
                      padding: "12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "16px",
                      outline: "none",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#3b82f6";
                      e.target.style.boxShadow =
                        "0 0 0 3px rgba(59, 130, 246, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#d1d5db";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: "16px" }}>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      fontSize: "14px",
                      color: "#6b7280",
                      marginBottom: "4px",
                      display: "block",
                    }}
                  >
                    Pozisyon
                  </label>
                  <input
                    type="text"
                    value={editForm.per_role}
                    onChange={(e) =>
                      handleInputChange("per_role", e.target.value)
                    }
                    style={{
                      padding: "12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "16px",
                      outline: "none",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#3b82f6";
                      e.target.style.boxShadow =
                        "0 0 0 3px rgba(59, 130, 246, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#d1d5db";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      fontSize: "14px",
                      color: "#6b7280",
                      marginBottom: "4px",
                      display: "block",
                    }}
                  >
                    Departman
                  </label>
                  <input
                    type="text"
                    value={editForm.per_department}
                    onChange={(e) =>
                      handleInputChange("per_department", e.target.value)
                    }
                    style={{
                      padding: "12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "16px",
                      outline: "none",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#3b82f6";
                      e.target.style.boxShadow =
                        "0 0 0 3px rgba(59, 130, 246, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#d1d5db";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: "16px" }}>
                <div style={{ flex: 1 }}>
                 
                </div>
                <div style={{ flex: 1 }}>
                 
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "24px",
                  fontWeight: "600",
                  color: "#111827",
                }}
              >
                {person.per_name} {person.per_lname}
              </h2>
              <div style={{ fontSize: "16px", color: "#6b7280" }}>
                {person.per_department || "IT"} / {person.per_role}
              </div>
            </div>
          )}
        </div>
        <div style={{ position: "absolute", top: "16px", right: "16px" }}>
          {isEditing ? (
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={handleSave}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = "#059669";
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = "#10b981";
                }}
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#6b7280",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = "#4b5563";
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = "#6b7280";
                }}
              >
                İptal
              </button>
            </div>
          ) : (
            <button
              onClick={handleEdit}
              style={{
                padding: "8px 16px",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = "#2563eb";
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = "#3b82f6";
              }}
            >
              Düzenle
            </button>
          )}
        </div>
      </div>
      <div className="stat-cards">
        <div className="stat-card" style={{ position: "relative" }}>
          <div className="stat-title">Check-in/Check-out</div>
          <div className="stat-value">{formattedCheckIn} - {formattedCheckOut}</div>
          <div className="stat-desc up">Today</div>
          <div
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              backgroundColor: "#e9d5ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#7c3aed",
              fontSize: "20px",
            }}
          >
            <FiClock size={20} />
          </div>
        </div>
        <div className="stat-card" style={{ position: "relative" }}>
          <div className="stat-title">Time at Work</div>
          <div className="stat-value">{getTimeAtWork()}</div>
          <div className="stat-desc up">Today</div>
          <div
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              backgroundColor: "#d1fae5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#059669",
              fontSize: "20px",
            }}
          >
            <FiActivity size={20} />
          </div>
        </div>
        <div className="stat-card" style={{ position: "relative" }}>
          <div className="stat-title">Productivity Score</div>
          <div className="stat-value">{getProductivityScore()}</div>
          <div className="stat-desc up">Weekly</div>
          <div
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              backgroundColor: "#fed7aa",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#d97706",
              fontSize: "20px",
            }}
          >
            <FiTrendingUp size={20} />
          </div>
        </div>
        <div className="stat-card" style={{ position: "relative" }}>
          <div className="stat-title">Total Absences</div>
          <div className="stat-value">{getTotalAbsencesThisMonth()}</div>
          <div className="stat-desc up">Monthly</div>
          <div
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              backgroundColor: "#fecaca",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#dc2626",
              fontSize: "20px",
            }}
          >
            <FiCalendar size={20} />
          </div>
        </div>
      </div>
      {/* Attendance Chart */}
      <div
        style={{
          marginTop: 24,
          background: "#fff",
          borderRadius: 15,
          padding: 30,
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div
          style={{
            fontWeight: 600,
            fontSize: 16,
            marginBottom: 16,
            color: "#1f2937",
          }}
        >
          📅 Attendance
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          {/* Gün isimleri */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",

              marginRight: 8,

            }}
          >
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div
                key={day}
                style={{
                  height: 15,
                  fontSize: 12,
                  color: "#6b7280",
                  textAlign: "right",
                  width: 30,
                  fontWeight: "500",
                }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Attendance Grid */}
          <div
            style={{
              display: "flex",
              gap: 4,
              flex: 1,
              overflowX: "auto",
              paddingBottom: 5,
            }}
          >

            {Array.from({ length: 52 }).map((_, weekIdx) => (
              <div key={weekIdx} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {Array.from({ length: 7 }).map((_, dayIdx) => {
                  const cellDate = new Date(startDate);
                  cellDate.setDate(startDate.getDate() + (weekIdx * 7 + dayIdx));
                  cellDate.setHours(0, 0, 0, 0);

                  if (cellDate > todayy) {
                    // ✅ Skip rendering future boxes altogether (optional)
                    return <div key={dayIdx} style={{ width: 12, height: 12 }} />;
                  }

                  const dateStr = cellDate.toISOString().split("T")[0];
                  const isWeekend = cellDate.getDay() === 0 || cellDate.getDay() === 6;

                 let status;
if (cellDate > todayy) {
  status = "no-data"; // ✅ force gray for future
} else if (checkInDatesSet.has(dateStr)) {
  status = "present";
} else if (!isWeekend) {
  status = "absent";
} else {
  status = "no-data";
}

                  const colors = {
                    present: { bg: "#10b981", border: "#059669" },
                    absent: { bg: "#ef4444", border: "#dc2626" },
                    "no-data": { bg: "#f3f4f6", border: "#e5e7eb" },
                  };

                  return (
                    <div
                      key={dayIdx}
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 2,
                        background: colors[status].bg,
                        border: `1px solid ${colors[status].border}`,
                        transition: "all 0.15s ease",
                        cursor: "pointer",
                      }}
                      title={`${cellDate.toDateString()} - ${status}`}
                    />
                  );
                })}

              </div>
            ))}
          </div>
        </div>

        {/* Ay isimleri */}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 8,
            marginLeft: 32,
            overflowX: "auto",
            paddingBottom: 2,
          }}
        >
          {[
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ].map((month) => (
            <div
              key={month}
              style={{
                minWidth: 48,
                fontSize: 10,
                color: "#6b7280",
                textAlign: "center",
                fontWeight: "500",
              }}
            >
              {month}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 12,
            paddingTop: 12,
            borderTop: "1px solid #f3f4f6",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 2,
                background: "#f3f4f6",
                border: "1px solid #e5e7eb",
              }}
            ></div>
            <span style={{ fontSize: 11, color: "#6b7280", fontWeight: "500" }}>
              No Data
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 2,
                background: "#10b981",
                border: "1px solid #059669",
              }}
            ></div>
            <span style={{ fontSize: 11, color: "#6b7280", fontWeight: "500" }}>
              Present
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 2,
                background: "#ef4444",
                border: "1px solid #dc2626",
              }}
            ></div>
            <span style={{ fontSize: 11, color: "#6b7280", fontWeight: "500" }}>
              Absent
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonnelDetail;
