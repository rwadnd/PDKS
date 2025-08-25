// backend/controllers/reportingController.js
const path = require("path");
const db = require("../db/connection");
const { Parser } = require("json2csv");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");

// Path to a Unicode font that supports Turkish (place .ttf in /fonts)
const FONT_PATH = path.join(__dirname, "../fonts/DejaVuSans.ttf");

// --- Report catalog (derived from tables: personnel, pdks_entry, leave_request, departments) ---
const REPORTS = [
  {
    id: "daily_attendance",
    title: "Daily Attendance (by date range)",
    description: "Raw check-in/out rows for each person in range.",
    params: ["dateRange", "department", "personnel"],
    sql: async ({ dateFrom, dateTo, department, perId }) => {
      const args = [];
      let where = "WHERE e.pdks_date BETWEEN ? AND ?";
      args.push(dateFrom, dateTo);

      if (department) { where += " AND p.per_department = ?"; args.push(department); }
      if (perId) { where += " AND p.per_id = ?"; args.push(perId); }

      const [rows] = await db.query(
        `
        SELECT e.pdks_date, e.pdks_checkInTime, e.pdks_checkOutTime,
               p.per_id, p.per_name, p.per_lname, p.per_department, p.per_role
        FROM pdks_entry e
        JOIN personnel p ON p.per_id = e.personnel_per_id
        ${where}
        ORDER BY e.pdks_date, p.per_id
        `,
        args
      );
      return rows;
    },
  },
  {
    id: "hours_per_employee",
    title: "Total Hours per Employee (date range)",
    description: "Aggregated total hours per person in range.",
    params: ["dateRange", "department", "personnel"],
    sql: async ({ dateFrom, dateTo, department, perId }) => {
      const args = [dateFrom, dateTo];
      let extra = "";
      if (department) { extra += " AND p.per_department = ?"; args.push(department); }
      if (perId) { extra += " AND p.per_id = ?"; args.push(perId); }

      const [rows] = await db.query(
        `
        SELECT p.per_id, p.per_name, p.per_lname, p.per_department,
               ROUND(SUM(TIMESTAMPDIFF(MINUTE,
                       TIMESTAMP(e.pdks_date, e.pdks_checkInTime),
                       TIMESTAMP(e.pdks_date, e.pdks_checkOutTime)
               ))/60, 2) AS total_hours
        FROM pdks_entry e
        JOIN personnel p ON p.per_id = e.personnel_per_id
        WHERE e.pdks_date BETWEEN ? AND ?
        ${extra}
        GROUP BY p.per_id, p.per_name, p.per_lname, p.per_department
        ORDER BY total_hours DESC
        `,
        args
      );
      return rows;
    },
  },
  {
    id: "hours_per_department",
    title: "Total Hours per Department (date range)",
    description: "Sum of worked hours grouped by department.",
    params: ["dateRange", "department"],
    sql: async ({ dateFrom, dateTo, department }) => {
      const args = [dateFrom, dateTo];
      let extra = "";
      if (department) { extra += " AND p.per_department = ?"; args.push(department); }

      const [rows] = await db.query(
        `
        SELECT p.per_department AS department,
               ROUND(SUM(TIMESTAMPDIFF(MINUTE,
                     TIMESTAMP(e.pdks_date, e.pdks_checkInTime),
                     TIMESTAMP(e.pdks_date, e.pdks_checkOutTime)
               ))/60, 2) AS total_hours
        FROM pdks_entry e
        JOIN personnel p ON p.per_id = e.personnel_per_id
        WHERE e.pdks_date BETWEEN ? AND ?
        ${extra}
        GROUP BY p.per_department
        ORDER BY total_hours DESC
        `,
        args
      );
      return rows;
    },
  },
  {
    id: "present_vs_absent",
    title: "Present vs Absent (single date)",
    description: "Presence determined by existence of a check-in record.",
    params: ["singleDate", "department"],
    sql: async ({ date, department }) => {
      const args = [date];
      let deptFilter = "";
      if (department) { deptFilter = "WHERE per_department = ?"; args.push(department); }

      const [rows] = await db.query(
        `
        SELECT p.per_id, p.per_name, p.per_lname, p.per_department,
               CASE WHEN EXISTS (
                 SELECT 1 FROM pdks_entry e
                 WHERE e.personnel_per_id = p.per_id AND e.pdks_date = ?
               ) THEN 'Present' ELSE 'Absent' END AS status
        FROM personnel p
        ${deptFilter}
        ORDER BY p.per_department, p.per_id
        `,
        args
      );
      return rows;
    },
  },
  {
    id: "leave_requests",
    title: "Leave Requests Summary (date range)",
    description: "Leaves in range with optional status/type filters.",
    params: ["dateRange", "leaveStatus", "leaveType", "department", "personnel"],
    sql: async ({ dateFrom, dateTo, leaveStatus, leaveType, department, perId }) => {
      const args = [dateTo, dateFrom];
      let where = "WHERE lr.request_start_date <= ? AND lr.request_end_date >= ?";

      if (leaveStatus) { where += " AND lr.status = ?"; args.push(leaveStatus); }
      if (leaveType)  { where += " AND lr.request_type = ?"; args.push(leaveType); }
      if (department) { where += " AND p.per_department = ?"; args.push(department); }
      if (perId)      { where += " AND p.per_id = ?"; args.push(Number(perId)); }

      const [rows] = await db.query(
        `
        SELECT lr.request_id, p.per_id, p.per_name, p.per_lname, p.per_department,
               lr.request_type, lr.status, lr.request_start_date, lr.request_end_date, lr.request_date
        FROM leave_request lr
        JOIN personnel p ON p.per_id = lr.personnel_per_id
        ${where}
        ORDER BY lr.request_start_date DESC, lr.request_id DESC
        `,
        args
      );
      return rows;
    },
  },
  {
    id: "personnel_roster",
    title: "Personnel Roster",
    description: "List personnel with department, role, status.",
    params: ["department"],
    sql: async ({ department }) => {
      const args = [];
      let where = "";
      if (department) { where = "WHERE per_department = ?"; args.push(department); }
      const [rows] = await db.query(
        `
        SELECT per_id, per_name, per_lname, per_department, per_role, per_status
        FROM personnel
        ${where}
        ORDER BY per_department, per_id
        `,
        args
      );
      return rows;
    },
  },
];

exports.getMetadata = async (req, res) => {
  const meta = {
    reports: REPORTS.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      params: r.params,
    })),
  };
  res.json(meta);
};

exports.exportReport = async (req, res) => {
  try {
    const { reportId, params = {}, fileType = "csv" } = req.body || {};
    const r = REPORTS.find((x) => x.id === reportId);
    if (!r) return res.status(400).json({ error: "Unknown reportId" });

    const today = new Date().toISOString().slice(0, 10);
    if (r.params?.includes("dateRange")) {
      params.dateFrom = params.dateFrom || today;
      params.dateTo = params.dateTo || today;
    }
    if (r.params?.includes("singleDate")) {
      params.date = params.date || today;
    }

    const rows = await r.sql(params);
    const filename = `${reportId}_${today}.${fileType}`;

    // CSV
    if (fileType === "csv") {
      const parser = new Parser({ withBOM: true });
      const csv = parser.parse(rows);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      return res.send(csv);
    }

    // XLSX
    if (fileType === "xlsx") {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet(r.title);
      if (rows.length > 0) {
        ws.columns = Object.keys(rows[0]).map((k) => ({ header: k, key: k }));
        rows.forEach((row) => ws.addRow(row));
        ws.columns.forEach((col) => (col.width = Math.max(12, String(col.header).length + 2)));
      }
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      await wb.xlsx.write(res);
      return res.end();
    }

    // PDF
    if (fileType === "pdf") {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

      const doc = new PDFDocument({ margin: 40, size: "A4" });
      doc.registerFont("DejaVu", FONT_PATH);
      doc.font("DejaVu").fontSize(12);
      doc.pipe(res);

      doc.fontSize(16).text(r.title, { align: "center", underline: true });
      doc.moveDown(1);

      if (rows.length === 0) {
        doc.text("No data available.", { align: "center" });
        doc.end();
        return;
      }

      const headers = Object.keys(rows[0]);
      const colWidths = headers.map((h) =>
        h.toLowerCase().includes("id") ? 40 : (doc.page.width - 80) / headers.length
      );
      let y = doc.y;

      // --- Table Header ---
      doc.fontSize(10).fillColor("white");
      headers.forEach((h, i) => {
        doc.rect(
          40 + colWidths.slice(0, i).reduce((a, b) => a + b, 0),
          y,
          colWidths[i],
          20
        ).fill("#3f51b5");
        doc
          .fillColor("white")
          .text(h, 45 + colWidths.slice(0, i).reduce((a, b) => a + b, 0), y + 5, {
            width: colWidths[i] - 10,
            align: "center",
          });
      });

      y += 20;
      doc.fontSize(9).fillColor("black");

      // --- Table Rows ---
      rows.forEach((row) => {
        // determine row height based on wrapped text
        let rowHeight = 0;
        headers.forEach((h, i) => {
          const text = String(row[h] ?? "");
          const height = doc.heightOfString(text, { width: colWidths[i] - 10 });
          rowHeight = Math.max(rowHeight, height + 10);
        });

        // draw cells
        headers.forEach((h, i) => {
          const x = 40 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
          const text = String(row[h] ?? "");
          doc.rect(x, y, colWidths[i], rowHeight).stroke();
          doc.text(text, x + 5, y + 5, {
            width: colWidths[i] - 10,
            align: "center",
          });
        });

        y += rowHeight;

        // New page check
        if (y > doc.page.height - 60) {
          doc.addPage();
          y = 40;
        }
      });

      doc.end();
      return;
    }

    return res.status(400).json({ error: "Unsupported fileType" });
  } catch (err) {
    console.error("exportReport error:", err);
    res.status(500).json({ error: "Export failed" });
  }
};
