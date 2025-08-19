// src/pages/Reporting.jsx
import { useEffect, useState,useMemo } from "react";
import axios from "axios";

const pill = (active) => ({
  padding: "10px 14px",
  borderRadius: 12,
  border: `1px solid ${active ? "#3b82f6" : "#e5e7eb"}`,
  background: active ? "#eef2ff" : "#fff",
  color: active ? "#1e40af" : "#111827",
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 600,
});

const chip = {
  padding: "8px 12px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  background: "#fff",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 600,
};

const Label = ({ children }) => (
  <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>
    {children}
  </div>
);

const Reporting = () => {
  const [meta, setMeta] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [personnel, setPersonnel] = useState([]);
  const [selected, setSelected] = useState(null);
  const [fileType, setFileType] = useState("csv");
  const [params, setParams] = useState({
    dateFrom: "",
    dateTo: "",
    department: "",
    perId: "",
    leaveStatus: "",
    leaveType: "",
    date: "",
  });
  const [busy, setBusy] = useState(false);



  const filteredPersonnel = useMemo(() => {
  if (!params.department) return personnel;
  return (personnel || []).filter(
    (p) => String(p.per_department) === String(params.department)
  );
}, [personnel, params.department]);

// 2) If current perId is not in the filtered set, clear it when department changes
useEffect(() => {
  if (!params.perId) return;
  const stillValid = filteredPersonnel.some(
    (p) => String(p.per_id) === String(params.perId)
  );
  if (!stillValid) {
    setParams((prev) => ({ ...prev, perId: "" }));
  }
}, [params.department, filteredPersonnel]); 


  useEffect(() => {
    // Load metadata (available reports + parameter schema)
    axios.get("/api/reporting/metadata").then((r) => setMeta(r.data));

    // Support pickers
    axios.get("http://localhost:5050/api/department/list")
      .then((r) => setDepartments(r.data || []))
      .catch(() => {});
    axios.get("http://localhost:5050/api/personnel")
      .then((r) => setPersonnel(r.data || []))
      .catch(() => {});
  }, []);

  const handleExport = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      const res = await axios.post(
        "/api/reporting/export",
        { reportId: selected.id, params, fileType },
        { responseType: "blob" }
      );

      // filename from header or fallback
      const cd = res.headers["content-disposition"] || "";
      const match = cd.match(/filename="?([^"]+)"?/i);
      const filename =
        (match && match[1]) ||
        `${selected.id}_${new Date().toISOString().slice(0, 10)}.${fileType}`;

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert("Export failed. Check the server logs.");
    } finally {
      setBusy(false);
    }
  };

  const showParam = (key) => selected?.params?.includes(key);

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Reporting</h1>
      <p style={{ color: "#6b7280", marginTop: 0 }}>
        Choose a report, pick an export format, adjust filters, then click <b>Export</b>.
      </p>

      {/* 1) Report Buttons */}
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", margin: "16px 0 24px" }}>
        {(meta?.reports || []).map((r) => (
          <button
            key={r.id}
            onClick={() => setSelected(r)}
            style={pill(selected?.id === r.id)}
            title={r.description}
          >
            {r.title}
          </button>
        ))}
      </div>

      {/* 2) Format + Filters */}
      {selected && (
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            padding: 20,
            background: "#fff",
            boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
            marginBottom: 16,
          }}
        >
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
            {/* File Type */}
            <div>
              <Label>Export format</Label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["csv", "xlsx", "pdf"].map((ft) => (
                  <button
                    key={ft}
                    style={{ ...chip, borderColor: fileType === ft ? "#3b82f6" : "#e5e7eb", background: fileType === ft ? "#eef2ff" : "#fff" }}
                    onClick={() => setFileType(ft)}
                  >
                    {ft.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Date range */}
            {showParam("dateRange") && (
              <>
                <div>
                  <Label>Date from</Label>
                  <input
                    type="date"
                    value={params.dateFrom}
                    onChange={(e) => setParams((p) => ({ ...p, dateFrom: e.target.value }))}
                    style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}
                  />
                </div>
                <div>
                  <Label>Date to</Label>
                  <input
                    type="date"
                    value={params.dateTo}
                    onChange={(e) => setParams((p) => ({ ...p, dateTo: e.target.value }))}
                    style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}
                  />
                </div>
              </>
            )}

            {/* Single date (present vs absent) */}
            {showParam("singleDate") && (
              <div>
                <Label>Date</Label>
                <input
                  type="date"
                  value={params.date}
                  onChange={(e) => setParams((p) => ({ ...p, date: e.target.value }))}
                  style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}
                />
              </div>
            )}

            {/* Department */}
            {showParam("department") && (
              <div>
                <Label>Department</Label>
                <select
                  value={params.department}
                  onChange={(e) => setParams((p) => ({ ...p, department: e.target.value }))}
                  style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}
                >
                  <option value="">All</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Personnel */}
            {showParam("personnel") && (
  <div>
    <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>Personnel</div>
    <select
      value={params.perId}
      onChange={(e) => setParams((p) => ({ ...p, perId: e.target.value }))}
      style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}
      disabled={filteredPersonnel.length === 0}
    >
      <option value="">All</option>
      {filteredPersonnel.map((p) => (
        <option key={p.per_id} value={p.per_id}>
          {p.per_name} {p.per_lname} (#{p.per_id})
        </option>
      ))}
    </select>
  </div>
)}

            {/* Leave status/type */}
            {showParam("leaveStatus") && (
              <div>
                <Label>Leave status</Label>
                <select
                  value={params.leaveStatus}
                  onChange={(e) => setParams((p) => ({ ...p, leaveStatus: e.target.value }))}
                  style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}
                >
                  <option value="">All</option>
                  {["Pending","Approved","Rejected"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}

            {showParam("leaveType") && (
              <div>
                <Label>Leave type</Label>
                <select
                  value={params.leaveType}
                  onChange={(e) => setParams((p) => ({ ...p, leaveType: e.target.value }))}
                  style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}
                >
                  <option value="">All</option>
                  {["Annual","Sick","Maternity","Paternity","Unpaid","Other"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Export */}
          <div style={{ marginTop: 18 }}>
            <button
              disabled={busy}
              onClick={handleExport}
              style={{
                padding: "12px 18px",
                borderRadius: 12,
                border: "1px solid #3b82f6",
                background: busy ? "#93c5fd" : "#3b82f6",
                color: "#fff",
                fontWeight: 700,
                cursor: busy ? "not-allowed" : "pointer",
              }}
            >
              {busy ? "Exporting..." : `Export ${selected.title}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reporting;
