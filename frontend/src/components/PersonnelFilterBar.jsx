import { useEffect, useState } from "react";
import axios from "axios";
import { FiFileText, FiFile, FiDownload } from "react-icons/fi";
import { FaFilePdf } from "react-icons/fa";

const PersonnelFilterBar = ({
  selectedDept,
  setSelectedDept,
  selectedRole,
  setSelectedRole,
  selectedStatus,
  setSelectedStatus,
  selectedEmployment,
  setSelectedEmployment,
}) => {
  const [departmentOptions, setDepartmentOptions] = useState(["All"]);
  const [roleOptions, setRoleOptions] = useState(["All"]);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    // load departments
    axios
      .get("http://localhost:5050/api/department/list")
      .then((res) => {
        const arr = Array.isArray(res.data) ? res.data : [];
        const options = ["All", ...arr];
        setDepartmentOptions(options);
      })
      .catch(() => setDepartmentOptions(["All"]));

    // load roles from personnel
    axios
      .get("http://localhost:5050/api/personnel")
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

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        alignItems: "center",
        padding: "10px 6px",
        paddingBottom: 20,
        borderBottom: "1px solid #e5e7eb",
        background: "#f6f8fb",
        position: "sticky",
        top: 10,
        zIndex: 5,
      }}
    >
      <select
        value={selectedDept}
        onChange={(e) => setSelectedDept(e.target.value)}
        style={{
          padding: "10px 14px",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          backgroundColor: "#ffffff",
          color: "#111827",
          width: 180,
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

      <select
        value={selectedEmployment}
        onChange={(e) => setSelectedEmployment(e.target.value)}
        style={{
          padding: "10px 14px",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          backgroundColor: "#ffffff",
          color: "#111827",
          width: 200,
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
        title="Employment status"
      >
        <option value="All">All Employees</option>
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
      </select>

      <select
        value={selectedRole}
        onChange={(e) => setSelectedRole(e.target.value)}
        style={{
          padding: "10px 14px",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          backgroundColor: "#ffffff",
          color: "#111827",
          width: 200,
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
          width: 200,
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
        <option value="Active">Active</option>
        <option value="Absent">Absent</option>
        <option value="On Leave">On Leave</option>
      </select>

      <button
        onClick={() => {
          setSelectedDept("All");
          setSelectedRole("All");
          setSelectedStatus("All");
        }}
        style={{
          padding: "8px 12px",

          borderRadius: 12,

          color: "#991b1b",
          cursor: "pointer",
          height: 33,
          display: "flex",
          alignItems: "center",
          gap: 8,
          outline: "none",
          boxShadow: "none",
          transition: "none",
        }}
        // title="Reset filters"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M3 6h18" stroke="#991b1b" strokeWidth="2" />
          <path
            d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"
            stroke="#991b1b"
            strokeWidth="2"
          />
          <path
            d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
            stroke="#991b1b"
            strokeWidth="2"
          />
          <line
            x1="10"
            y1="11"
            x2="10"
            y2="17"
            stroke="#991b1b"
            strokeWidth="2"
          />
          <line
            x1="14"
            y1="11"
            x2="14"
            y2="17"
            stroke="#991b1b"
            strokeWidth="2"
          />
        </svg>
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
                  new CustomEvent("personnelExport", {
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
                  new CustomEvent("personnelExport", {
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
                  new CustomEvent("personnelExport", {
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

export default PersonnelFilterBar;
