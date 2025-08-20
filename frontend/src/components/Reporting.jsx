// src/pages/Reporting.jsx
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import "./Reporting.css";

const Label = ({ children }) => (
  <div className="label">{children}</div>
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

  // Clear perId if it doesn't belong to the newly selected department
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
    axios.get("/api/reporting/metadata").then((r) => setMeta(r.data));

    axios
      .get("http://localhost:5050/api/department/list")
      .then((r) => setDepartments(r.data || []))
      .catch(() => {});
    axios
      .get("http://localhost:5050/api/personnel")
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
    <div className="reporting-container">
      <h1 className="reporting-title">Reporting</h1>
      <p className="reporting-subtitle">
        Choose a report, pick an export format, adjust filters, then click <b>Export</b>.
      </p>

      {/* 1) Report Buttons */}
      <div className="report-grid">
        {(meta?.reports || []).map((r) => (
          <button
            key={r.id}
            onClick={() => setSelected(r)}
            className={`pill ${selected?.id === r.id ? "is-active" : ""}`}
            title={r.description}
          >
            {r.title}
          </button>
        ))}
      </div>

      {/* 2) Format + Filters */}
      {selected && (
        <div className="card">
          <div className="grid">
            {/* File Type */}
            <div>
              <Label>Export format</Label>
              <div className="chip-group">
                {["csv", "xlsx", "pdf"].map((ft) => (
                  <button
                    key={ft}
                    className={`chip ${fileType === ft ? "is-active" : ""}`}
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
                    onChange={(e) =>
                      setParams((p) => ({ ...p, dateFrom: e.target.value }))
                    }
                    className="input"
                  />
                </div>
                <div>
                  <Label>Date to</Label>
                  <input
                    type="date"
                    value={params.dateTo}
                    onChange={(e) =>
                      setParams((p) => ({ ...p, dateTo: e.target.value }))
                    }
                    className="input"
                  />
                </div>
              </>
            )}

            {/* Single date */}
            {showParam("singleDate") && (
              <div>
                <Label>Date</Label>
                <input
                  type="date"
                  value={params.date}
                  onChange={(e) => setParams((p) => ({ ...p, date: e.target.value }))}
                  className="input"
                />
              </div>
            )}

            {/* Department */}
            {showParam("department") && (
              <div>
                <Label>Department</Label>
                <select
                  value={params.department}
                  onChange={(e) =>
                    setParams((p) => ({ ...p, department: e.target.value }))
                  }
                  className="input"
                >
                  <option value="">All</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Personnel */}
            {showParam("personnel") && (
              <div>
                <div className="label">Personnel</div>
                <select
                  value={params.perId}
                  onChange={(e) => setParams((p) => ({ ...p, perId: e.target.value }))}
                  className="input"
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
                  onChange={(e) =>
                    setParams((p) => ({ ...p, leaveStatus: e.target.value }))
                  }
                  className="input"
                >
                  <option value="">All</option>
                  {["Pending", "Approved", "Rejected"].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {showParam("leaveType") && (
              <div>
                <Label>Leave type</Label>
                <select
                  value={params.leaveType}
                  onChange={(e) =>
                    setParams((p) => ({ ...p, leaveType: e.target.value }))
                  }
                  className="input"
                >
                  <option value="">All</option>
                  {["Annual", "Sick", "Maternity", "Paternity", "Unpaid", "Other"].map(
                    (t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    )
                  )}
                </select>
              </div>
            )}
          </div>

          {/* Export */}
          <div className="export">
            <button
              disabled={busy}
              onClick={handleExport}
              className={`btn-primary ${busy ? "is-busy" : ""}`}
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
