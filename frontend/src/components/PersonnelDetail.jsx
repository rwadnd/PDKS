import React from "react";
import "../App.css";

const PersonnelDetail = ({ person, onBack }) => {
  if (!person) return null;

  return (
    <div>
      <button onClick={onBack} style={{ marginBottom: 24 }}>
        &larr; Back
      </button>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          background: "#fff",
          borderRadius: 16,
          padding: 32,
          marginBottom: 32,
        }}
      >
        <img
          src={
            person.avatar || "https://randomuser.me/api/portraits/men/32.jpg"
          }
          alt={person.per_name}
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            marginRight: 32,
          }}
        />
        <div>
          <h2 style={{ margin: 0 }}>
            {person.per_name} {person.per_lname}
          </h2>
          <div style={{ fontSize: 20, color: "#8a8a8a", margin: "8px 0" }}>
            {person.per_role}
          </div>
          <div style={{ fontSize: 18 }}>
            {person.per_department || "Department"}
          </div>
        </div>
      </div>
      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-title">Total Work Hours</div>
          <div className="stat-value">70</div>
          <div className="stat-desc up">Weekly</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Total Work Hours</div>
          <div className="stat-value">3</div>
          <div className="stat-desc up">Monthly</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Today's Check-in Time</div>
          <div className="stat-value">45</div>
          <div className="stat-desc down">4.3% Down from yesterday</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Today's Check-out Time</div>
          <div className="stat-value">2040</div>
          <div className="stat-desc up">1.8% Up from yesterday</div>
        </div>
      </div>
      {/* Takvim veya diğer detaylar buraya eklenebilir */}
      <div
        style={{
          marginTop: 40,
          background: "#fff",
          borderRadius: 16,
          padding: 24,
        }}
      >
        <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 16 }}>
          Attendance
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {/* Gün isimleri */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              marginRight: 8,
            }}
          >
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div
                key={day}
                style={{
                  height: 16,
                  fontSize: 12,
                  color: "#888",
                  textAlign: "right",
                  width: 28,
                }}
              >
                {day}
              </div>
            ))}
          </div>
          {/* Aylar ve günler grid'i */}
          <div style={{ display: "flex", gap: 2 }}>
            {/* 12 ay için sütunlar */}
            {Array.from({ length: 52 }).map((_, weekIdx) => (
              <div
                key={weekIdx}
                style={{ display: "flex", flexDirection: "column", gap: 2 }}
              >
                {/* 7 gün için kutucuklar */}
                {Array.from({ length: 7 }).map((_, dayIdx) => (
                  <div
                    key={dayIdx}
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 3,
                      background: "#e5e9f2",
                      marginBottom: 1,
                    }}
                  ></div>
                ))}
              </div>
            ))}
          </div>
        </div>
        {/* Ay isimleri */}
        <div style={{ display: "flex", gap: 18, marginTop: 8, marginLeft: 36 }}>
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
                width: 64,
                fontSize: 11,
                color: "#888",
                textAlign: "center",
              }}
            >
              {month}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PersonnelDetail;
