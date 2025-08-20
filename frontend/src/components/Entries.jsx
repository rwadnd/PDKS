import "../App.css";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import axios from "axios";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import {
  FaClock,
  FaChartLine,
  FaUserTimes,
  FaCalendarAlt,
  FaUmbrellaBeach,
  FaHome,
  FaFilePdf,
} from "react-icons/fa";
import { FiInbox, FiAward, FiFileText, FiFile } from "react-icons/fi";
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
  const isOnTimeToday = title === "On Time Today";

  const [search, setSearch] = useState("");
  const [lateThreshold, setLateThreshold] = useState("08:30");
  const [sortDesc, setSortDesc] = useState(true);
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedReason, setSelectedReason] = useState("All");
  // const [remindingIds, setRemindingIds] = useState(new Set());
  const todayStrModal = useMemo(
    () => new Date().toISOString().slice(0, 10),
    []
  );
  const [selectedDate, setSelectedDate] = useState(todayStrModal);
  const [dateRecords, setDateRecords] = useState(null);

  const [departmentOptions, setDepartmentOptions] = useState(["All"]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaves, setLeaves] = useState([]);
  useEffect(() => {
    // fetch all departments from backend to include non-present ones
    axios
      .get("/api/department/list")
      .then((res) => {
        const arr = Array.isArray(res.data) ? res.data : [];
        setDepartmentOptions(["All", ...arr]);
      })
      .catch(() => {
        // fallback to present-only if request fails
        const set = new Set();
        (Array.isArray(personnelList) ? personnelList : []).forEach((p) => {
          if (p && p.per_department) set.add(p.per_department);
        });
        setDepartmentOptions(["All", ...Array.from(set).sort()]);
      });
  }, [personnelList]);
  const [exportOpen, setExportOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const toMinutes = useCallback((t) => {
    if (!t) return 0;
    const parts = t.length === 5 ? `${t}:00` : t;
    const [h, m] = parts.split(":").map(Number);
    return h * 60 + m;
  }, []);

  // Update absent reason (OnLeave vs no reason) for Absent Today
  const handleAbsentReasonChange = useCallback(async (person, value) => {
    try {
      const payload =
        value === "OnLeave"
          ? { status: "OnLeave" }
          : value === "OnSickLeave"
          ? { status: "OnSickLeave" }
          : { status: "Active" }; // clear reason (did not come)
      await axios.put(`/api/personnel/${person.per_id}`, payload);
      // optimistic local update
      person.per_status = payload.status;
    } catch (err) {
      console.error("Failed to update absent reason", err);
      window.alert("Couldn't update reason");
    }
  }, []);

  // Load all leave requests once; we'll filter by selected date on the client
  useEffect(() => {
    axios
      .get("/api/leave")
      .then((res) => setLeaves(Array.isArray(res.data) ? res.data : []))
      .catch(() => setLeaves([]));
  }, []);

  // Index leaves by person for the selected date
  const leaveIndex = useMemo(() => {
    if (!selectedDate || !Array.isArray(leaves)) return new Map();
    const idx = new Map();
    const d = new Date(selectedDate);
    leaves.forEach((lr) => {
      const s = new Date(lr.request_start_date);
      const e = new Date(lr.request_end_date);
      if (isNaN(s) || isNaN(e)) return;
      if (d >= s && d <= e) {
        const arr = idx.get(lr.personnel_per_id) || [];
        arr.push(lr);
        idx.set(lr.personnel_per_id, arr);
      }
    });
    // pick best per person: Approved > Pending > Rejected
    const rank = { Approved: 3, Pending: 2, Rejected: 1 };
    const pick = new Map();
    idx.forEach((arr, perId) => {
      let best = null;
      arr.forEach((lr) => {
        if (!best || (rank[lr.status] || 0) > (rank[best.status] || 0))
          best = lr;
      });
      if (best) pick.set(perId, best);
    });
    return pick;
  }, [leaves, selectedDate]);

  useEffect(() => {
    axios
      .get("/api/pdks/leaderboard/on-time", {
        params: { days: 30, threshold: "08:30:00", limit: 1 },
      })
      .then((res) => setLeaderboard(Array.isArray(res.data) ? res.data : []))
      .catch(() => setLeaderboard([]));
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    axios
      .get(`/api/pdks/by-date/${selectedDate}`)
      .then((res) => setDateRecords(Array.isArray(res.data) ? res.data : []))
      .catch(() => setDateRecords(null));
  }, [selectedDate]);

  // Derive current view based on controls (memoized)
  const computeViewList = useMemo(() => {
    const base = Array.isArray(dateRecords)
      ? dateRecords
      : Array.isArray(personnelList)
      ? personnelList
      : [];
    let list = [...base];
    if (isAbsent) {
      list = list.filter(
        (p) => !p.pdks_checkInTime || p.pdks_checkInTime === "00:00:00"
      );
      if (selectedReason && selectedReason !== "All") {
        if (selectedReason === "OnLeave") {
          list = list.filter(
            (p) => p.per_status === "OnLeave" || p.per_status === "OnSickLeave"
          );
        } else if (selectedReason === "Absent") {
          list = list.filter(
            (p) => p.per_status !== "OnLeave" && p.per_status !== "OnSickLeave"
          );
        }
      }
    }
    if (isLateToday) {
      const thr = `${lateThreshold}:00`;
      list = list.filter(
        (p) =>
          p.pdks_checkInTime &&
          p.pdks_checkInTime !== "00:00:00" &&
          toMinutes(p.pdks_checkInTime) > toMinutes(thr)
      );
    }
    if (isOnTimeToday) {
      list = list.filter((p) => {
        const t = p.pdks_checkInTime;
        if (!t || t === "00:00:00") return false;
        const [h, m] = t.split(":").map(Number);
        return h < 8 || (h === 8 && m <= 30);
      });
    }
    if (
      (isOnTimeToday || isLateToday || isAbsent) &&
      selectedDept &&
      selectedDept !== "All"
    ) {
      list = list.filter((p) => (p.per_department || "") === selectedDept);
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter((p) => {
        const name = `${p.per_name || ""} ${p.per_lname || ""}`.toLowerCase();
        const dept = (p.per_department || "").toLowerCase();
        const role = (p.per_role || "").toLowerCase();
        const id = (p.per_id || "").toString();
        const checkIn = (p.pdks_checkInTime || "").toLowerCase();
        const checkOut = (p.pdks_checkOutTime || "").toLowerCase();

        return (
          name.includes(s) ||
          dept.includes(s) ||
          role.includes(s) ||
          id.includes(s) ||
          checkIn.includes(s) ||
          checkOut.includes(s)
        );
      });
    }
    if (isLateToday) {
      list.sort((a, b) => {
        const la = getMinutesLateFromEight(a.pdks_checkInTime);
        const lb = getMinutesLateFromEight(b.pdks_checkInTime);
        return sortDesc ? lb - la : la - lb;
      });
    }
    return list;
  }, [
    personnelList,
    dateRecords,
    isAbsent,
    isLateToday,
    isOnTimeToday,
    selectedDept,
    selectedReason,
    lateThreshold,
    search,
    sortDesc,
    toMinutes,
  ]);

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

  const exportToXLSX = useCallback(() => {
    const view = computeViewList;
    const aoa = [
      ["Name", "Department", "Role", "Status", "Check-in", "Check-out"],
      ...(view || []).map((p) => {
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
        return [name, dept, role, status, checkIn, checkOut];
      }),
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `${title.replace(/\s+/g, "_")}_${dateStr}.xlsx`);
  }, [computeViewList, showCheckInTime, title]);

  const exportToPDF = useCallback(() => {
    const view = computeViewList;
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(title, 14, 16);
    doc.setFontSize(10);
    let y = 24;
    doc.text("Name | Department | Role | Status | Check-in | Check-out", 14, y);
    y += 6;
    (view || []).forEach((p) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
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
      doc.text(
        `${name} | ${dept} | ${role} | ${status} | ${checkIn} | ${checkOut}`,
        14,
        y
      );
      y += 6;
    });
    const dateStr = new Date().toISOString().slice(0, 10);
    doc.save(`${title.replace(/\s+/g, "_")}_${dateStr}.pdf`);
  }, [computeViewList, showCheckInTime, title]);

  // handleRemind removed (auto notifications will replace manual action)

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
      onClick={(e) => {
        // Close export dropdown if open
        if (exportOpen) {
          setExportOpen(false);
          return;
        }
        onClose();
      }}
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
            marginBottom: "8px",
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
            {/* removed threshold + sort controls near Export */}
            {/* search moved to second row */}
            <div
              ref={exportRef}
              style={{ position: "relative" }}
              data-export-container
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExportOpen((v) => !v);
                }}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  background: "linear-gradient(180deg,#ffffff,#f8fafc)",
                  color: "#111827",
                  cursor: "pointer",
                  fontSize: 12,
                  minWidth: 96,
                  boxShadow: exportOpen
                    ? "inset 0 1px 3px rgba(0,0,0,0.06)"
                    : "0 1px 2px rgba(0,0,0,0.04)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
                title="Export"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7,10 12,15 17,10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export
              </button>
              {exportOpen && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "calc(100% + 8px)",
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    boxShadow: "0 12px 28px rgba(0,0,0,0.12)",
                    zIndex: 10,
                    overflow: "hidden",
                    minWidth: 180,
                    backdropFilter: "blur(6px)",
                    padding: 6,
                  }}
                >
                  <button
                    onClick={() => {
                      exportToCSV();
                      setExportOpen(false);
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      background: "#ffffff",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      fontSize: 12,
                      color: "#111827",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <FiFileText size={16} style={{ color: "#374151" }} />
                    <span>CSV</span>
                  </button>
                  <button
                    onClick={() => {
                      exportToXLSX();
                      setExportOpen(false);
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      background: "#ffffff",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      fontSize: 12,
                      color: "#111827",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <FiFile size={16} style={{ color: "#16a34a" }} />
                    <span>XLSX</span>
                  </button>
                  <button
                    onClick={() => {
                      exportToPDF();
                      setExportOpen(false);
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      background: "#ffffff",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      fontSize: 12,
                      color: "#111827",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <FaFilePdf size={16} style={{ color: "#dc2626" }} />
                    <span>PDF</span>
                  </button>
                </div>
              )}
            </div>
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

        {/* Controls row below title */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* search first */}
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{
                  position: "absolute",
                  left: "8px",
                  color: "#6b7280",
                  zIndex: 1,
                }}
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                style={{
                  padding: "8px 12px 8px 28px",
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  fontSize: 12,
                  outline: "none",
                  height: 17,
                  width: "200px",
                }}
              />
            </div>
            {/* Filter button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                padding: "8px 12px",
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                backgroundColor: "#f8fafc",
                color: "#374151",
                cursor: "pointer",
                fontSize: 13,
                height: 33,
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3" />
              </svg>
              {showFilters ? "Hide Filters" : "Filter"}
            </button>
          </div>
          <div />
        </div>

        {/* Filter controls - shown when showFilters is true */}
        {showFilters && (
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{
                  position: "absolute",
                  left: "8px",
                  color: "#6b7280",
                  zIndex: 1,
                }}
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <input
                type="date"
                value={selectedDate}
                max={todayStrModal}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{
                  padding: "6px 10px 6px 28px",
                  border: "1px solid #e5e7eb",
                  borderRadius: 6,
                  backgroundColor: "#ffffff",
                  color: "#111827",
                  fontSize: 13,
                  outline: "none",
                  height: 19,
                }}
              />
            </div>
            {(isOnTimeToday || isLateToday || isAbsent) && (
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: 6,
                  backgroundColor: "#ffffff",
                  color: "#111827",
                  minWidth: 180,
                  height: 33,
                  boxShadow: "0 2px 8px rgba(2,6,23,0.05)",
                  appearance: "none",
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg width='12' height='8' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236b7280' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 12px center",
                  paddingRight: 36,
                  fontSize: 13,
                }}
              >
                {departmentOptions.map((dep) => (
                  <option key={dep} value={dep}>
                    {dep}
                  </option>
                ))}
              </select>
            )}
            {isAbsent && (
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: 6,
                  backgroundColor: "#ffffff",
                  color: "#111827",
                  minWidth: 180,
                  height: 33,
                  boxShadow: "0 2px 8px rgba(2,6,23,0.05)",
                  appearance: "none",
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg width='12' height='8' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236b7280' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 12px center",
                  paddingRight: 36,
                  fontSize: 13,
                }}
                title="Filter by absent reason"
              >
                <option value="All">All reasons</option>
                <option value="OnLeave">On Leave</option>
                <option value="OnSickLeave">Sick Leave</option>
                <option value="Absent">Unexcused Absence</option>
              </select>
            )}
            {isLateToday && (
              <select
                value={lateThreshold}
                onChange={(e) => setLateThreshold(e.target.value)}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: 6,
                  backgroundColor: "#ffffff",
                  color: "#111827",
                  minWidth: 120,
                  height: 33,
                  boxShadow: "0 2px 8px rgba(2,6,23,0.05)",
                  appearance: "none",
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg width='12' height='8' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236b7280' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 12px center",
                  paddingRight: 36,
                  fontSize: 13,
                  outline: "none",
                }}
              >
                <option value="08:00">08:00</option>
                <option value="08:15">08:15</option>
                <option value="08:30">08:30</option>
                <option value="08:45">08:45</option>
                <option value="09:00">09:00</option>
                <option value="09:15">09:15</option>
                <option value="09:30">09:30</option>
              </select>
            )}
            <button
              onClick={() => {
                setSelectedDate(todayStrModal);
                setSelectedDept("All");
                setSelectedReason("All");
                setLateThreshold("08:30");
                setSearch("");
              }}
              style={{
                padding: "6px 10px",
                border: "1px solid #fecaca",
                borderRadius: 5,
                backgroundColor: "#fee2e2",
                color: "#991b1b",
                cursor: "pointer",
                height: 28,
                marginLeft: 6,
                width: 34,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Reset filters"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </button>
          </div>
        )}

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
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {(() => {
                    const lr =
                      leaveIndex && leaveIndex.get
                        ? leaveIndex.get(person.per_id)
                        : null;
                    const isLeaveStatus =
                      person.per_status === "OnLeave" ||
                      person.per_status === "OnSickLeave";
                    const color = lr || isLeaveStatus ? "#FFEB3B" : "#c62116ff";
                    return (
                      <span
                        style={{
                          display: "inline-block",
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          backgroundColor: color,
                        }}
                        title={lr ? `${lr.request_type || "Leave"}` : ""}
                      />
                    );
                  })()}
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
  // removed row hover background behavior
  const [modal, setModal] = useState({ open: false, title: "", items: [] });
  const [avgModalOpen, setAvgModalOpen] = useState(false);
  const [avgTimeframe, setAvgTimeframe] = useState("weekly");
  const [weeklyChartData, setWeeklyChartData] = useState([]);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef(null);
  const [exportOnTimeOpen, setExportOnTimeOpen] = useState(false);
  const [exportLateOpen, setExportLateOpen] = useState(false);
  const [exportAbsentOpen, setExportAbsentOpen] = useState(false);
  const exportOnTimeRef = useRef(null);
  const exportLateRef = useRef(null);
  const exportAbsentRef = useRef(null);

  // Ensure any export dropdown is closed when modal context changes
  useEffect(() => {
    setExportOpen(false);
    setExportOnTimeOpen(false);
    setExportLateOpen(false);
    setExportAbsentOpen(false);
  }, [modal.open, modal.title, avgModalOpen]);

  // Close export menu on outside click or ESC
  useEffect(() => {
    const handleClick = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setExportOpen(false);
      }
      if (
        exportOnTimeRef.current &&
        !exportOnTimeRef.current.contains(e.target)
      ) {
        setExportOnTimeOpen(false);
      }
      if (exportLateRef.current && !exportLateRef.current.contains(e.target)) {
        setExportLateOpen(false);
      }
      if (
        exportAbsentRef.current &&
        !exportAbsentRef.current.contains(e.target)
      ) {
        setExportAbsentOpen(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === "Escape") {
        setExportOpen(false);
        setExportOnTimeOpen(false);
        setExportLateOpen(false);
        setExportAbsentOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [exportOpen, exportOnTimeOpen, exportLateOpen, exportAbsentOpen]);
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

  // Prepare weekly chart data from existing records (last 7 days)
  const past7Dates = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - idx));
    return d;
  });

  const weeklyData = past7Dates.map((d) => {
    const dayStr = d.toISOString().slice(0, 10);
    const dayRecords = records.filter(
      (r) => r.pdks_date?.slice(0, 10) === dayStr
    );
    const mins = dayRecords
      .filter((r) => r.pdks_checkInTime && r.pdks_checkInTime !== "00:00:00")
      .map((r) => {
        const [h, m] = r.pdks_checkInTime.split(":").map(Number);
        return h * 60 + m;
      });
    const avg = mins.length
      ? Math.round(mins.reduce((a, b) => a + b, 0) / mins.length)
      : 0;
    return {
      name: d.toLocaleDateString(undefined, { weekday: "short" }),
      value: avg ? Math.max(0, avg - 480) : 0,
      fill: "#10b981",
    };
  });

  // Prepare monthly (last 30 days) chart structure
  const past30Dates = Array.from({ length: 30 }).map((_, idx) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (29 - idx));
    return d;
  });

  // Monthly: group by week (4-5 bars instead of 30). Using ISO week index within month
  const monthlyData = (() => {
    const byWeek = new Map();
    past30Dates.forEach((d) => {
      const dayStr = d.toISOString().slice(0, 10);
      const recordsForDay = records.filter(
        (r) => r.pdks_date?.slice(0, 10) === dayStr
      );
      const dayMins = recordsForDay
        .filter((r) => r.pdks_checkInTime && r.pdks_checkInTime !== "00:00:00")
        .map((r) => {
          const [h, m] = r.pdks_checkInTime.split(":").map(Number);
          return h * 60 + m;
        });
      const avg = dayMins.length
        ? Math.round(dayMins.reduce((a, b) => a + b, 0) / dayMins.length)
        : 0;
      // Week key within month (1..5)
      const firstOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
      const weekIndex =
        Math.floor((d.getDate() + firstOfMonth.getDay() - 1) / 7) + 1;
      const key = `W${weekIndex}`;
      if (!byWeek.has(key)) byWeek.set(key, []);
      byWeek.get(key).push(avg);
    });
    const bars = Array.from(byWeek.entries()).map(([key, arr]) => {
      const avg = arr.length
        ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
        : 0;
      return {
        name: key,
        value: avg ? Math.max(0, avg - 480) : 0,
        fill: "#10b981",
      };
    });
    return bars;
  })();

  // Chart data source and simple availability check
  const chartBase = avgTimeframe === "monthly" ? monthlyData : weeklyData;
  const chartData =
    weeklyChartData && weeklyChartData.length ? weeklyChartData : chartBase;
  const nonZeroDays = chartData.filter((d) => (d?.value || 0) > 0).length;
  const yMax = useMemo(() => {
    const maxVal = chartData.reduce((m, d) => Math.max(m, d?.value || 0), 0);
    const rounded = Math.ceil(maxVal / 10) * 10;
    return Math.max(60, rounded || 60);
  }, [chartData]);

  // Fetch historical average data (includes yesterday etc.) when modal opens or timeframe changes
  useEffect(() => {
    if (!avgModalOpen) return;

    const toDate = new Date();
    const fromDate = new Date();
    if (avgTimeframe === "monthly") {
      fromDate.setDate(toDate.getDate() - 29);
    } else {
      fromDate.setDate(toDate.getDate() - 6);
    }

    const toStr = toDate.toISOString().slice(0, 10);
    const fromStr = fromDate.toISOString().slice(0, 10);

    axios
      .get("http://localhost:5050/api/pdks/average-checkin", {
        params: { from: fromStr, to: toStr },
      })
      .then((res) => {
        const rows = Array.isArray(res.data) ? res.data : [];
        const dateToAvgMin = new Map(
          rows.map((r) => [
            String(r.date).slice(0, 10),
            Number(r.avgMinutes) || 0,
          ])
        );

        if (avgTimeframe === "monthly") {
          // Build past 30 days values
          const days = Array.from({ length: 30 }).map((_, idx) => {
            const d = new Date(toDate);
            d.setDate(toDate.getDate() - (29 - idx));
            const key = d.toISOString().slice(0, 10);
            const avgAbsMin = dateToAvgMin.get(key) || 0; // minutes since 00:00
            const lateMin = avgAbsMin ? Math.max(0, avgAbsMin - 480) : 0;
            return { date: new Date(d), lateMin };
          });

          // Group by week within month (same approach as existing local calc)
          const byWeek = new Map();
          days.forEach(({ date, lateMin }) => {
            const firstOfMonth = new Date(
              date.getFullYear(),
              date.getMonth(),
              1
            );
            const weekIndex =
              Math.floor((date.getDate() + firstOfMonth.getDay() - 1) / 7) + 1;
            const key = `W${weekIndex}`;
            if (!byWeek.has(key)) byWeek.set(key, []);
            byWeek.get(key).push(lateMin + 480); // store back absolute minutes to avg later consistently
          });
          const bars = Array.from(byWeek.entries()).map(([key, arr]) => {
            const avgAbs = arr.length
              ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
              : 0;
            return {
              name: key,
              value: avgAbs ? Math.max(0, avgAbs - 480) : 0,
              fill: "#10b981",
            };
          });
          setWeeklyChartData(bars);
        } else {
          // Weekly: 7 days bars, label by weekday
          const days = Array.from({ length: 7 }).map((_, idx) => {
            const d = new Date(toDate);
            d.setDate(toDate.getDate() - (6 - idx));
            const key = d.toISOString().slice(0, 10);
            const avgAbsMin = dateToAvgMin.get(key) || 0; // minutes since 00:00
            const lateMin = avgAbsMin ? Math.max(0, avgAbsMin - 480) : 0;
            return {
              name: d.toLocaleDateString(undefined, { weekday: "short" }),
              value: lateMin,
              fill: "#10b981",
            };
          });
          setWeeklyChartData(days);
        }
      })
      .catch((err) => {
        console.error("Failed to load average-checkin range:", err);
        setWeeklyChartData([]);
      });
  }, [avgModalOpen, avgTimeframe]);

  const exportAvgCsv = useCallback(() => {
    const headers = ["Label", "Avg Late (m)"];
    const rows = chartData.map((d) => [String(d.name), String(d.value)]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    a.download = `avg-checkin_${avgTimeframe}_${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [chartData, avgTimeframe]);

  const exportAvgXlsx = useCallback(() => {
    const aoa = [
      ["Label", "Avg Late (m)"],
      ...chartData.map((d) => [String(d.name), Number(d.value)]),
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(
      wb,
      ws,
      avgTimeframe === "monthly" ? "Monthly" : "Weekly"
    );
    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `avg-checkin_${avgTimeframe}_${dateStr}.xlsx`);
  }, [chartData, avgTimeframe]);

  const exportAvgPdf = useCallback(() => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(
      `${avgTimeframe === "monthly" ? "Monthly" : "Weekly"} Average Check-in`,
      14,
      16
    );
    doc.setFontSize(11);
    let y = 26;
    doc.text("Label / Avg Late (m)", 14, y);
    y += 6;
    chartData.forEach((d) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(`${String(d.name)}  -  ${String(d.value)}`, 14, y);
      y += 6;
    });
    const dateStr = new Date().toISOString().slice(0, 10);
    doc.save(`avg-checkin_${avgTimeframe}_${dateStr}.pdf`);
  }, [chartData, avgTimeframe]);

  // Generic personnel list exports (used by cards)
  const makePersonnelAoa = useCallback((list) => {
    const headers = [
      "Name",
      "Department",
      "Role",
      "Status",
      "Check-in",
      "Check-out",
    ];
    const rows = (list || []).map((p) => {
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
      if (checkIn !== "-") {
        const [h, m] = (p.pdks_checkInTime || "00:00:00")
          .split(":")
          .map(Number);
        status = h > 8 || (h === 8 && m > 30) ? "Late" : "On Time";
      }
      return [name, dept, role, status, checkIn, checkOut];
    });
    return [headers, ...rows];
  }, []);

  const exportPersonnelCsv = useCallback(
    (list, base) => {
      const aoa = makePersonnelAoa(list);
      const csv = aoa
        .map((r) =>
          r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
        )
        .join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const dateStr = new Date().toISOString().slice(0, 10);
      a.download = `${base}_${dateStr}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [makePersonnelAoa]
  );

  const exportPersonnelXlsx = useCallback(
    (list, base) => {
      const aoa = makePersonnelAoa(list);
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      XLSX.utils.book_append_sheet(wb, ws, "Data");
      const dateStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `${base}_${dateStr}.xlsx`);
    },
    [makePersonnelAoa]
  );

  const exportPersonnelPdf = useCallback((list, base) => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(base.replace(/_/g, " "), 14, 16);
    doc.setFontSize(10);
    let y = 24;
    doc.text("Name | Department | Role | Status | Check-in | Check-out", 14, y);
    y += 6;
    (list || []).forEach((p) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
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
      if (checkIn !== "-") {
        const [h, m] = (p.pdks_checkInTime || "00:00:00")
          .split(":")
          .map(Number);
        status = h > 8 || (h === 8 && m > 30) ? "Late" : "On Time";
      }
      doc.text(
        `${name} | ${dept} | ${role} | ${status} | ${checkIn} | ${checkOut}`,
        14,
        y
      );
      y += 6;
    });
    const dateStr = new Date().toISOString().slice(0, 10);
    doc.save(`${base}_${dateStr}.pdf`);
  }, []);

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
                      cursor: "pointer",
                      backgroundColor: "white",
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
                cursor: "pointer",
              }}
              onClick={() => setAvgModalOpen(true)}
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
      {avgModalOpen && (
        <div
          onClick={() => setAvgModalOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 16,
              width: 720,
              maxWidth: "90vw",
              padding: 24,
              boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
              border: "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 0,
              }}
            >
              <h3 style={{ margin: 0, color: "#111827" }}>
                {avgTimeframe === "monthly" ? "Monthly" : "Weekly"} Average
                Check-in
              </h3>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div ref={exportRef} style={{ position: "relative" }}>
                  <button
                    onClick={() => setExportOpen((v) => !v)}
                    style={{
                      padding: "8px 12px",
                      border: "1px solid #e5e7eb",
                      borderRadius: 10,
                      background: "linear-gradient(180deg,#ffffff,#f8fafc)",
                      color: "#111827",
                      cursor: "pointer",
                      fontSize: 12,
                      minWidth: 96,
                      boxShadow: exportOpen
                        ? "inset 0 1px 3px rgba(0,0,0,0.06)"
                        : "0 1px 2px rgba(0,0,0,0.04)",
                    }}
                    title="Export"
                  >
                    Export ▾
                  </button>
                  {exportOpen && (
                    <div
                      style={{
                        position: "absolute",
                        right: 0,
                        top: "calc(100% + 8px)",
                        background: "#ffffff",
                        border: "1px solid #e5e7eb",
                        borderRadius: 12,
                        boxShadow: "0 12px 28px rgba(0,0,0,0.12)",
                        zIndex: 10,
                        overflow: "hidden",
                        minWidth: 180,
                        backdropFilter: "blur(6px)",
                        padding: 6,
                      }}
                    >
                      <button
                        onClick={() => {
                          exportAvgCsv();
                          setExportOpen(false);
                        }}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          background: "#ffffff",
                          border: "none",
                          cursor: "pointer",
                          textAlign: "left",
                          fontSize: 12,
                          color: "#111827",
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <FiFileText size={16} style={{ color: "#374151" }} />
                        <span>CSV</span>
                      </button>
                      <button
                        onClick={() => {
                          exportAvgXlsx();
                          setExportOpen(false);
                        }}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          background: "#ffffff",
                          border: "none",
                          cursor: "pointer",
                          textAlign: "left",
                          fontSize: 12,
                          color: "#111827",
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <FiFile size={16} style={{ color: "#16a34a" }} />
                        <span>XLSX</span>
                      </button>
                      <button
                        onClick={() => {
                          exportAvgPdf();
                          setExportOpen(false);
                        }}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          background: "#ffffff",
                          border: "none",
                          cursor: "pointer",
                          textAlign: "left",
                          fontSize: 12,
                          color: "#111827",
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <FaFilePdf size={16} style={{ color: "#dc2626" }} />
                        <span>PDF</span>
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setAvgModalOpen(false)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: 22,
                    cursor: "pointer",
                    color: "#64748b",
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
            <div style={{ height: 260, paddingBottom: 20 }}>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginBottom: 2,
                  paddingBottom: 6,
                }}
              >
                <button
                  onClick={() => setAvgTimeframe("weekly")}
                  style={{
                    padding: "6px 10px",
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    background: avgTimeframe === "weekly" ? "#111827" : "#fff",
                    color: avgTimeframe === "weekly" ? "#fff" : "#111827",
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setAvgTimeframe("monthly")}
                  style={{
                    padding: "6px 10px",
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    background: avgTimeframe === "monthly" ? "#111827" : "#fff",
                    color: avgTimeframe === "monthly" ? "#fff" : "#111827",
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                >
                  Month
                </button>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 4, right: 18, left: 4, bottom: 16 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    padding={{ left: 8, right: 8 }}
                    interval={0}
                  />
                  <YAxis
                    domain={[0, yMax]}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <ReTooltip
                    cursor={false}
                    formatter={(v) => [`${v}m late`, "Avg after 08:00"]}
                  />
                  <Bar
                    dataKey="value"
                    radius={[6, 6, 0, 0]}
                    fill="#10b981"
                    opacity={0.85}
                  >
                    <LabelList
                      dataKey="value"
                      position="top"
                      formatter={(v) => `${v}m`}
                      style={{ fill: "#64748b", fontSize: 12 }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Entries;
