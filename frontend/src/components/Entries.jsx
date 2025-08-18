import "../App.css";
import { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import {
  FaClock,
  FaChartLine,
  FaUserTimes,
  FaCalendarAlt,
  FaUmbrellaBeach,
  FaHome,
} from "react-icons/fa";
import { FiInbox, FiAward } from "react-icons/fi";
import React from "react";

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

// Helpers for lateness severity (08:00 baseline, 10-min buckets)
const getMinutesLateFromEight = (timeStr) => {
  if (!timeStr || timeStr === "00:00:00") return 0;
  const [h, m] = timeStr.split(":").map(Number);
  const minutes = h * 60 + m;
  return Math.max(0, minutes - 480);
};

const getLatenessSeverity = (timeStr) => {
  const late = getMinutesLateFromEight(timeStr);
  const bucket = Math.min(5, Math.floor(late / 10)); // 0..5 within 08:00–09:00
  const levels = [
    { label: "Low", color: "#10b981" },
    { label: "Mild", color: "#84cc16" },
    { label: "Moderate", color: "#f59e0b" },
    { label: "Elevated", color: "#f97316" },
    { label: "High", color: "#ef4444" },
    { label: "Critical", color: "#991b1b" },
  ];
  return levels[bucket];
};

// --- Semicircle SVG gauge (Low → High) ---
function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = (Math.PI / 180) * angleDeg;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
  return [
    "M",
    start.x,
    start.y,
    "A",
    r,
    r,
    0,
    largeArcFlag,
    1,
    end.x,
    end.y,
  ].join(" ");
}

const SeverityGauge = ({ minutes = 0, width = 110, stroke = 9 }) => {
  const clamped = Math.max(0, Math.min(60, minutes));
  const cx = width / 2;
  const cy = width / 2;
  const r = width / 2 - stroke;
  const gap = 4;
  const severityLabels = [
    "Low",
    "Mild",
    "Moderate",
    "Elevated",
    "High",
    "Critical",
  ];
  const severityLabel = severityLabels[Math.min(5, Math.floor(clamped / 10))];
  const segments = [
    { from: -180, to: -150, color: "#22c55e" },
    { from: -150, to: -120, color: "#84cc16" },
    { from: -120, to: -90, color: "#eab308" },
    { from: -90, to: -60, color: "#f59e0b" },
    { from: -60, to: -30, color: "#f97316" },
    { from: -30, to: 0, color: "#ef4444" },
  ];
  const angle = -180 + (clamped / 60) * 180;
  const needleOuter = polarToCartesian(cx, cy, r, angle);
  const needleInner = polarToCartesian(cx, cy, r * 0.5, angle);

  return (
    <svg
      width={width}
      height={width / 2 + 8}
      viewBox={`0 0 ${width} ${width / 2 + 8}`}
    >
      <title>{severityLabel}</title>
      <path
        d={describeArc(cx, cy, r, -180, 0)}
        stroke="#f3f4f6"
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
      />
      {segments.map((s, i) => (
        <path
          key={i}
          d={describeArc(cx, cy, r, s.from + gap / 2, s.to - gap / 2)}
          stroke={s.color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="butt"
        />
      ))}
      {[-150, -120, -90, -60, -30].map((a, i) => {
        const p1 = polarToCartesian(cx, cy, r, a);
        const p2 = polarToCartesian(cx, cy, r - stroke, a);
        return (
          <line
            key={i}
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke="#ffffff"
            strokeWidth={2}
          />
        );
      })}
      <line
        x1={needleInner.x}
        y1={needleInner.y}
        x2={needleOuter.x}
        y2={needleOuter.y}
        stroke="#374151"
        strokeWidth={3}
      />
      <circle
        cx={cx}
        cy={cy}
        r={5}
        fill="#374151"
        stroke="#fff"
        strokeWidth={2}
      />
    </svg>
  );
};

// Small wrapper to show a custom tooltip with severity label on hover
const GaugeWithTooltip = ({ timeStr }) => {
  const [hover, setHover] = useState(false);
  const minutes = getMinutesLateFromEight(timeStr);
  const labels = ["Low", "Mild", "Moderate", "Elevated", "High", "Critical"];
  const severity = labels[Math.min(5, Math.floor(Math.max(0, minutes) / 10))];

  return (
    <div
      style={{ position: "relative", display: "inline-block" }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <SeverityGauge minutes={minutes} />
      {hover && (
        <div
          style={{
            position: "absolute",
            bottom: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            marginBottom: 8,
            background: "#111827",
            color: "#fff",
            fontSize: 12,
            padding: "4px 8px",
            borderRadius: 6,
            whiteSpace: "nowrap",
            boxShadow: "0 4px 10px rgba(0,0,0,0.12)",
            pointerEvents: "none",
          }}
        >
          {severity}
        </div>
      )}
    </div>
  );
};

const SeverityBar = ({ timeStr }) => {
  const late = getMinutesLateFromEight(timeStr);
  const clamped = Math.max(0, Math.min(60, late));
  const pct = (clamped / 60) * 100;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <div
        style={{
          position: "relative",
          width: 140,
          height: 12,
          borderRadius: 999,
          background:
            "linear-gradient(90deg,#10b981 0%,#84cc16 20%,#f59e0b 40%,#f97316 60%,#ef4444 80%,#991b1b 100%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -6,
            left: `calc(${pct}% - 8px)`,
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: "#475569",
            border: "2px solid #ffffff",
            boxShadow: "0 1px 2px rgba(0,0,0,0.25)",
          }}
        />
      </div>
    </div>
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

const Modal = ({ title, items, onClose }) => (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(0,0,0,0.2)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
    }}
    onClick={onClose}
  >
    <div
      style={{
        background: "#fff",
        borderRadius: "12px",
        padding: "32px",
        minWidth: "320px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <h2 style={{ marginBottom: "16px", fontSize: "20px" }}>{title}</h2>
      {items.length === 0 ? (
        <div style={{ color: "#6b7280" }}>No personnel found.</div>
      ) : (
        <ul style={{ padding: 0, margin: 0, listStyle: "none" }}>
          {items.map((person, idx) => (
            <li key={idx} style={{ marginBottom: "8px", color: "#374151" }}>
              {person}
            </li>
          ))}
        </ul>
      )}
      <button
        style={{
          marginTop: "24px",
          padding: "8px 16px",
          borderRadius: "8px",
          border: "none",
          background: "#3b82f6",
          color: "#fff",
          cursor: "pointer",
        }}
        onClick={onClose}
      >
        Close
      </button>
    </div>
  </div>
);

const getStatusDotColor = (person, isAbsent = false) => {
  if (!isAbsent) {
    // On time: green
    return "#1dbf73";
  }
  // Absent: yellow if leave, else red
  if (person.per_status === "OnLeave" || person.per_status === "OnSickLeave") {
    return "#ffc107";
  }
  return "#c62116ff";
};

const PersonnelModal = ({ title, personnelList, onClose, isAbsent }) => {
  // Check if modal is for On Time or Late
  const showCheckInTime =
    title === "On Time Today" ||
    title === "Late Personnel" ||
    title === "Late Today";

  const isLateToday = title === "Late Today";

  const [search, setSearch] = useState("");
  const [lateThreshold, setLateThreshold] = useState("08:30");
  const [sortDesc, setSortDesc] = useState(true);

  const toMinutes = useCallback((t) => {
    if (!t) return 0;
    const parts = t.length === 5 ? `${t}:00` : t;
    const [h, m] = parts.split(":").map(Number);
    return h * 60 + m;
  }, []);

  // Derive current view based on controls (memoized)
  const computeViewList = useMemo(() => {
    let list = Array.isArray(personnelList) ? [...personnelList] : [];
    if (isLateToday) {
      const thr = `${lateThreshold}:00`;
      list = list.filter(
        (p) =>
          p.pdks_checkInTime &&
          p.pdks_checkInTime !== "00:00:00" &&
          toMinutes(p.pdks_checkInTime) > toMinutes(thr)
      );
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(
        (p) =>
          `${p.per_name || ""} ${p.per_lname || ""}`
            .toLowerCase()
            .includes(s) || (p.per_department || "").toLowerCase().includes(s)
      );
    }
    if (isLateToday) {
      list.sort((a, b) => {
        const la = getMinutesLateFromEight(a.pdks_checkInTime);
        const lb = getMinutesLateFromEight(b.pdks_checkInTime);
        return sortDesc ? lb - la : la - lb;
      });
    }
    return list;
  }, [personnelList, isLateToday, lateThreshold, search, sortDesc, toMinutes]);

  const exportToCSV = useCallback(() => {
    const view = computeViewList;
    const headers = [
      "Name",
      "Department",
      "Role",
      "Status",
      "Check-in",
      "Check-out",
    ];
    const rows = (view || []).map((p) => {
      const name = `${p.per_name || ""} ${p.per_lname || ""}`.trim();
      const dept = p.per_department || "";
      const role = p.per_role || "";
      const checkIn =
        p.pdks_checkInTime && p.pdks_checkInTime !== "00:00:00"
          ? p.pdks_checkInTime.slice(0, 5)
          : "-";
      const checkOut =
        p.pdks_checkOutTime && p.pdks_checkOutTime !== "00:00:00"
          ? p.pdks_checkOutTime.slice(0, 5)
          : "-";
      let status = p.per_status || "-";
      if (showCheckInTime && checkIn !== "-") {
        const [h, m] = (p.pdks_checkInTime || "00:00:00")
          .split(":")
          .map(Number);
        status = h > 8 || (h === 8 && m > 30) ? "Late" : "On Time";
      }
      const fields = [name, dept, role, status, checkIn, checkOut];
      return fields.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    a.download = `${title.replace(/\s+/g, "_")}_${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [computeViewList, showCheckInTime, title]);

  // removed duplicate declaration

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "20px",
          padding: "32px",
          width: "90%",
          maxWidth: "850px",
          maxHeight: "80vh",
          overflowY: "auto",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <h2
            style={{
              fontSize: "24px",
              fontWeight: "700",
              color: "#1e293b",
              margin: 0,
            }}
          >
            {title}
          </h2>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {isLateToday && (
              <>
                <select
                  value={lateThreshold}
                  onChange={(e) => setLateThreshold(e.target.value)}
                  style={{
                    padding: "6px 12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    backgroundColor: "#ffffff",
                    color: "#111827",
                    minWidth: 155,
                    boxShadow: "0 2px 8px rgba(2,6,23,0.05)",
                    appearance: "none",
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3Csvg width='12' height='8' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236b7280' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 10px center",
                    paddingRight: 32,
                    fontSize: 12,
                    outline: "none",
                  }}
                >
                  <option value="08:30">Threshold 08:30</option>
                  <option value="08:45">Threshold 08:45</option>
                  <option value="09:00">Threshold 09:00</option>
                </select>
                <button
                  onClick={() => setSortDesc(!sortDesc)}
                  style={{
                    padding: "6px 8px",
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    background: "#fff",
                    fontSize: 12,
                  }}
                  title="Sort by minutes late"
                >
                  {sortDesc ? "Sort: Late ↓" : "Sort: Late ↑"}
                </button>
              </>
            )}
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              style={{
                padding: "6px 10px",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                fontSize: 12,
                outline: "none",
              }}
            />
            <button
              onClick={exportToCSV}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                background: "#f8fafc",
                color: "#374151",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              Export CSV
            </button>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                fontSize: 24,
                cursor: "pointer",
                color: "#64748b",
                padding: 4,
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Personnel Table Header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isLateToday
              ? "60px 2fr 1.5fr 1.5fr 1fr 1fr"
              : isAbsent
              ? "60px 2fr 1.5fr 1.5fr 80px"
              : showCheckInTime
              ? "60px 2fr 1.5fr 1.5fr 1fr"
              : "60px 2fr 1.5fr 1.5fr 80px",
            gap: "32px",
            padding: "16px",
            backgroundColor: "#f9fafb",
            borderRadius: "12px",
            marginBottom: "16px",
            fontWeight: "600",
            fontSize: "14px",
            color: "#374151",
          }}
        >
          <div>Photo</div>
          <div>Personnel Name</div>
          <div>Department</div>
          <div>Role</div>
          {isLateToday ? (
            <>
              <div>Minutes Late</div>
              <div>Severity</div>
            </>
          ) : isAbsent ? (
            <div style={{ justifySelf: "center" }}>Status</div>
          ) : showCheckInTime ? (
            <div>Check-in Time</div>
          ) : (
            <div style={{ justifySelf: "center" }}>Status</div>
          )}
        </div>

        {computeViewList.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              color: "#64748b",
              fontSize: "16px",
            }}
          >
            No personnel found
          </div>
        ) : (
          computeViewList.map((person, idx) => (
            <div
              key={idx}
              style={{
                display: "grid",
                gridTemplateColumns: isLateToday
                  ? "60px 2fr 1.5fr 1.5fr 1fr 1fr"
                  : isAbsent
                  ? "60px 2fr 1.5fr 1.5fr 80px"
                  : showCheckInTime
                  ? "60px 2fr 1.5fr 1.5fr 1fr"
                  : "60px 2fr 1.5fr 1.5fr 80px",
                gap: "32px",
                padding: "16px",
                borderBottom: "1px solid #f1f5f9",
                alignItems: "center",
                transition: "background-color 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#f9fafb";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "transparent";
              }}
            >
              {/* Photo */}
              <div style={{ display: "flex", justifyContent: "center" }}>
                <img
                  src={
                    person.avatar_url ||
                    `https://ui-avatars.com/api/?name=${person.per_name}+${person.per_lname}&background=E5E7EB&color=111827`
                  }
                  alt={`${person.per_name} ${person.per_lname}`}
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid #e5e7eb",
                  }}
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${person.per_name}+${person.per_lname}&background=E5E7EB&color=111827`;
                  }}
                />
              </div>
              {/* Name */}
              <div
                style={{
                  fontWeight: "500",
                  color: "#111827",
                  textAlign: "left",
                }}
              >
                {person.per_name} {person.per_lname}
              </div>
              {/* Department */}
              <div style={{ color: "#6b7280", textAlign: "left" }}>
                {person.per_department || "-"}
              </div>
              {/* Role */}
              <div style={{ color: "#6b7280", textAlign: "left" }}>
                {person.per_role || "-"}
              </div>
              {/* Status / Check-in / Late Buckets */}
              {isLateToday ? (
                <>
                  <div style={{ color: "#374151", textAlign: "center" }}>
                    {Math.max(
                      0,
                      getMinutesLateFromEight(person.pdks_checkInTime)
                    )}
                    m
                  </div>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <GaugeWithTooltip timeStr={person.pdks_checkInTime} />
                  </div>
                </>
              ) : isAbsent ? (
                <div style={{ justifySelf: "center", alignSelf: "center" }}>
                  <span
                    style={{
                      display: "inline-block",
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      backgroundColor:
                        person.per_status === "OnLeave" ||
                        person.per_status === "OnSickLeave"
                          ? "#ffc107"
                          : "#c62116ff",
                    }}
                  />
                </div>
              ) : showCheckInTime ? (
                <div style={{ color: "#374151", textAlign: "center" }}>
                  {person.pdks_checkInTime &&
                  person.pdks_checkInTime !== "00:00:00"
                    ? person.pdks_checkInTime.slice(0, 5)
                    : "-"}
                </div>
              ) : (
                <div style={{ justifySelf: "center", alignSelf: "center" }}>
                  <span
                    style={{
                      display: "inline-block",
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      backgroundColor: getStatusDotColor(person, isAbsent),
                    }}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const Entries = ({ searchTerm, onSelectPerson, setPreviousPage }) => {
  const [records, setRecords] = useState([]);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [modal, setModal] = useState({ open: false, title: "", items: [] });
  const [showPersonnelModal, setShowPersonnelModal] = useState(false);
  const [personnelModalTitle, setPersonnelModalTitle] = useState("");
  const [personnelModalList, setPersonnelModalList] = useState([]);
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const holidayInfo = isHoliday(today);

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

  // On time personnel
  const onTimePersonnel = todayEntries
    .filter((entry) => {
      const [hours, minutes] = entry.pdks_checkInTime.split(":").map(Number);
      return hours <= 8 && minutes <= 30;
    })
    .map((entry) => `${entry.per_name} ${entry.per_lname}`);

  // On Time Personnel List (full objects)
  const onTimePersonnelList = todayEntries.filter((entry) => {
    const [hours, minutes] = entry.pdks_checkInTime.split(":").map(Number);
    return hours <= 8 && minutes <= 30;
  });

  // Absent Personnel List (full objects)
  const absentPersonnelList = records.filter(
    (record) => !presentToday.includes(`${record.per_name} ${record.per_lname}`)
  );

  // Geç kalanlar (Late Personnel) listesi
  const latePersonnelList = todayEntries.filter((entry) => {
    const [hours, minutes] = entry.pdks_checkInTime.split(":").map(Number);
    return hours > 8 || (hours === 8 && minutes > 30);
  });

  return (
    <div
      style={{
        display: "flex",
        gap: "24px",
        height: "88%",
        overflow: "hidden",
      }}
    >
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
                  color: "#374151",
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
              maxHeight: "92%",
            }}
          >
            {/* Table Header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 2fr 1.5fr 1.5fr 1fr 1fr 1fr",
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
              <div>Check-in</div>
              <div>Check-out</div>
              <div style={{ display: "flex", justifyContent: "center" }}>
                Status
              </div>
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
                      gridTemplateColumns: "1fr 2fr 1.5fr 1.5fr 1fr 1fr 1fr",
                      gap: "16px",
                      padding: "20px",
                      borderBottom: "1px solid #f3f4f6",
                      alignItems: "center",
                      transition: "background-color 0.15s ease",
                      cursor: "pointer",
                      backgroundColor: hoveredIndex === i ? "#f9fafb" : "white", // <-- controlled
                    }}
                    onClick={(e) => {
                      // use currentTarget to avoid child click quirks
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
                    onMouseEnter={() => setHoveredIndex(i)} // <-- non-bubbling
                    onMouseLeave={() => setHoveredIndex(null)} // <-- non-bubbling
                  >
                    {/* Photo */}

                    <div style={{ display: "flex", justifyContent: "start" }}>
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
              gap: "18px",
            }}
          >
            {/* 1. Average Check-in Time Card */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "16px",
                padding: "20px",
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
                Today's average
              </div>
            </div>

            {/* 2. On Time Today Card */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "16px",
                padding: "20px",
                boxShadow:
                  "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                border: "1px solid #e5e7eb",
                cursor: "pointer",
              }}
              onClick={() => {
                setPersonnelModalTitle("On Time Today");
                setPersonnelModalList(onTimePersonnelList);
                setShowPersonnelModal(true);
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
                        return hours <= 8 && minutes <= 30;
                      }).length /
                        todayEntries.length) *
                        100
                    )}% of today's entries`
                  : "No entries today"}
              </div>
            </div>

            {/* 3. Late Personnel Card */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "16px",
                padding: "20px",
                boxShadow:
                  "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                border: "1px solid #e5e7eb",
                cursor: "pointer",
              }}
              onClick={() => {
                setPersonnelModalTitle("Late Today");
                setPersonnelModalList(latePersonnelList);
                setShowPersonnelModal(true);
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
                    Late Today
                  </div>
                  <div
                    style={{
                      fontSize: "20px",
                      fontWeight: "600",
                      color: "#111827",
                    }}
                  >
                    {latePersonnelList.length}
                  </div>
                </div>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    backgroundColor: "#f59e0b",
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
                      (latePersonnelList.length / todayEntries.length) * 100
                    )}% of today's entries`
                  : "No entries today"}
              </div>
            </div>

            {/* 4. Absent Today Card */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "16px",
                padding: "20px",
                boxShadow:
                  "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                border: "1px solid #e5e7eb",
                cursor: "pointer",
              }}
              onClick={() => {
                setPersonnelModalTitle("Absent Today");
                setPersonnelModalList(absentPersonnelList);
                setShowPersonnelModal(true);
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
                {allPersonnel.length > 0
                  ? `${Math.round(
                      (absentToday.length / allPersonnel.length) * 100
                    )}% of total personnel`
                  : "All personnel present"}
              </div>
            </div>
          </div>
        </>
      )}
      {modal.open && (
        <Modal
          title={modal.title}
          items={modal.items}
          onClose={() => setModal({ open: false, title: "", items: [] })}
        />
      )}
      {showPersonnelModal && (
        <PersonnelModal
          title={personnelModalTitle}
          personnelList={personnelModalList}
          onClose={() => setShowPersonnelModal(false)}
          isAbsent={personnelModalTitle === "Absent Today"}
        />
      )}
    </div>
  );
};

export default Entries;
