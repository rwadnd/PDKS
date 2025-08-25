import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FiFileText, FiFile, FiTrash2, FiDownload } from "react-icons/fi";
import { FaFilePdf } from "react-icons/fa";

const FilterBar = ({
  selectedDept,
  setSelectedDept,
  selectedRole,
  setSelectedRole,
  selectedStatus,
  setSelectedStatus,
  lateThreshold,
  setLateThreshold,
  selectedDate,
  setSelectedDate,
  graceMinutes,
  setGraceMinutes,
  deptThresholds,
  setDeptThresholds,
}) => {
  const [departmentOptions, setDepartmentOptions] = useState(["All"]);
  const [roleOptions, setRoleOptions] = useState(["All"]);
  const [exportOpen, setExportOpen] = useState(false);
  // removed per-department thresholds UI

  useEffect(() => {
    // load departments
    axios
      .get("/api/department/list")
      .then((res) => {
        const arr = Array.isArray(res.data) ? res.data : [];
        const options = ["All", ...arr];
        setDepartmentOptions(options);
      })
      .catch(() => setDepartmentOptions(["All"]));

    // load roles from personnel
    axios
      .get("/api/personnel")
      .then((res) => {
        const rows = Array.isArray(res.data) ? res.data : [];
        const set = new Set();
        rows.forEach((r) => {
          if (r && r.per_role) set.add(r.per_role);
        });
        const options = ["All", ...Array.from(set).sort()];
        setRoleOptions(options);
      })
      .catch(() => setRoleOptions(["All"]));
  }, []);

  const showThreshold =
    selectedStatus === "Late" || selectedStatus === "On Time";
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        alignItems: "center",
        padding: "10px 6px",
        borderBottom: "1px solid #e5e7eb",
        background: "#f6f8fb",
        position: "sticky",
        top: 10,
        zIndex: 5,
      }}
    >
      <input
        type="date"
        value={selectedDate}
        max={todayStr}
        onChange={(e) => setSelectedDate(e.target.value)}
        style={{
          padding: "10px 14px 10px 40px",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          backgroundColor: "#ffffff",
          color: "#111827",
          minWidth: 150,
          height: 21,
          fontSize: 14,
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='3' y='4' width='18' height='18' rx='2' ry='2' stroke='%236b7280' stroke-width='2'/%3E%3Cline x1='16' y1='2' x2='16' y2='6' stroke='%236b7280' stroke-width='2'/%3E%3Cline x1='8' y1='2' x2='8' y2='6' stroke='%236b7280' stroke-width='2'/%3E%3Cline x1='3' y1='10' x2='21' y2='10' stroke='%236b7280' stroke-width='2'/%3E%3C/svg%3E\")",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "12px center",
        }}
        title="Select date"
      />
      <select
        value={selectedDept}
        onChange={(e) => setSelectedDept(e.target.value)}
        style={{
          padding: "10px 14px",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          backgroundColor: "#ffffff",
          color: "#111827",
          minWidth: 200,
          height: 44,
          fontSize: 14,
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          appearance: "none",
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6 9l6 6 6-6' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 12px center",
          paddingRight: 40,
        }}
        title="Filter by department"
      >
        <option value="All">All Departments</option>
        {departmentOptions
          .filter((d) => d !== "All")
          .map((dep) => (
            <option key={dep} value={dep}>
              {dep}
            </option>
          ))}
      </select>
      {/* Work type dropdown removed from Entries filter bar */}
      {/* Export moved to far right below */}
      <select
        value={selectedRole}
        onChange={(e) => setSelectedRole(e.target.value)}
        style={{
          padding: "10px 14px",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          backgroundColor: "#ffffff",
          color: "#111827",
          minWidth: 160,
          height: 44,
          fontSize: 14,
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          appearance: "none",
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6 9l6 6 6-6' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 12px center",
          paddingRight: 40,
        }}
        title="Filter by role"
      >
        {roleOptions.map((role) => (
          <option key={role} value={role}>
            {role}
          </option>
        ))}
      </select>
      <select
        value={selectedStatus}
        onChange={(e) => setSelectedStatus(e.target.value)}
        style={{
          padding: "10px 14px",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          backgroundColor: "#ffffff",
          color: "#111827",
          minWidth: 180,
          height: 44,
          fontSize: 14,
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          appearance: "none",
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6 9l6 6 6-6' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 12px center",
          paddingRight: 40,
        }}
        title="Filter by status"
      >
        <option value="All">All Statuses</option>
        <option value="On Time">On Time</option>
        <option value="Late">Late</option>
        <option value="Absent">Absent</option>
        <option value="On Leave">On Leave</option>
      </select>
      {showThreshold && (
        <select
          value={lateThreshold}
          onChange={(e) => setLateThreshold(e.target.value)}
          style={{
            padding: "10px 14px",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            backgroundColor: "#ffffff",
            color: "#111827",
            minWidth: 150,
            height: 44,
            fontSize: 14,
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            appearance: "none",
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6 9l6 6 6-6' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 12px center",
            paddingRight: 40,
          }}
          title="Late threshold"
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
      {/* Reset button - same design as hours modal */}
      <button
        onClick={() => {
          setSelectedDept("All");
          setSelectedRole("All");
          setSelectedStatus("All");
          setLateThreshold("08:30");
          setSelectedDate(todayStr);
          setGraceMinutes(0);
          setDeptThresholds({});
        }}
        style={{
          background: "transparent",
          border: "none",
          padding: 0,
          outline: "none",
          boxShadow: "none",
          WebkitTapHighlightColor: "transparent",
          color: "#dc2626",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          marginLeft: 8,
        }}
        title="Reset filters"
        onFocus={(e) => {
          e.currentTarget.style.outline = "none";
          e.currentTarget.style.boxShadow = "none";
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.outline = "none";
          e.currentTarget.style.boxShadow = "none";
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.outline = "none";
          e.currentTarget.style.boxShadow = "none";
        }}
        aria-label="Reset filters"
      >
        <FiTrash2 size={16} color="#dc2626" />
      </button>

      {/* Export at far right */}
      <div style={{ marginLeft: "auto", position: "relative" }}>
        <button
          type="button"
          onClick={() => setExportOpen((v) => !v)}
          style={{
            padding: "10px 12px",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            background: "#ffffff",
            color: "#111827",
            height: 44,
            fontSize: 13,
            cursor: "pointer",
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            minWidth: 110,
          }}
          title="Export"
        >
          <span
            style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
          >
            <FiDownload size={16} style={{ color: "#374151" }} />
            <span>Export</span>
          </span>
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
              zIndex: 0,
              overflow: "hidden",
              minWidth: 180,
              padding: 6,
            }}
          >
            <button
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent("entriesExport", {
                    detail: { format: "csv" },
                  })
                );
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
                window.dispatchEvent(
                  new CustomEvent("entriesExport", {
                    detail: { format: "xlsx" },
                  })
                );
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
                window.dispatchEvent(
                  new CustomEvent("entriesExport", {
                    detail: { format: "pdf" },
                  })
                );
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
    </div>
  );
};

export default FilterBar;
