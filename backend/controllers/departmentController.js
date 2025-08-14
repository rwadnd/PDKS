const db = require("../db/connection");

exports.overview = async (req, res) => {
  try {
    // Get departments from departments table
    const [departmentRows] = await db.query(`
      SELECT id, name, short_name, color
      FROM departments
      ORDER BY name
    `);

    // Get personnel count per department
    const [personnelRows] = await db.query(`
      SELECT per_department, per_id
      FROM Personnel
    `);

    const deptMap = {};
    for (const row of personnelRows) {
      if (!deptMap[row.per_department]) deptMap[row.per_department] = [];
      deptMap[row.per_department].push(row.per_id);
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStartDates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - d.getDay() + 1 - (6 - i) * 7); // Monday start of week
      d.setHours(0, 0, 0, 0);
      return d;
    });

    const earliestDateStr = weekStartDates[0].toISOString().split("T")[0];

    // Fetch entries only once
    const [entries] = await db.query(
      `
      SELECT personnel_per_id, pdks_date, pdks_checkInTime, pdks_checkOutTime
      FROM pdks_entry
      WHERE pdks_date >= ?
    `,
      [earliestDateStr]
    );

    const result = [];

    for (const deptRow of departmentRows) {
      const department = deptRow.name;
      const ids = deptMap[department] || [];
      const deptEntries = entries.filter((e) =>
        ids.includes(e.personnel_per_id)
      );
      let totalMinutesLastWeek = 0;
      const weeklyTotals = Array(7).fill(0);

      for (const entry of deptEntries) {
        const dateStr = entry.pdks_date;
        const date = new Date(dateStr);
        const inTimeStr = entry.pdks_checkInTime;
        const outTimeStr = entry.pdks_checkOutTime;

        if (
          !inTimeStr ||
          !outTimeStr ||
          inTimeStr === "00:00:00" ||
          outTimeStr === "00:00:00"
        )
          continue;

        const checkIn = new Date(`${dateStr}T${inTimeStr}`);
        const checkOut = new Date(`${dateStr}T${outTimeStr}`);
        if (isNaN(checkIn) || isNaN(checkOut) || checkOut <= checkIn) continue;

        const durationMin = (checkOut - checkIn) / (1000 * 60);

        for (let i = 0; i < 7; i++) {
          const start = weekStartDates[i];
          const end = new Date(start);
          end.setDate(end.getDate() + 7);
          if (date >= start && date < end) {
            weeklyTotals[i] += durationMin;
            if (i === 6) totalMinutesLastWeek += durationMin;
            break;
          }
        }
      }

      const peopleCount = ids.length;
      const avgHours =
        peopleCount > 0
          ? Math.round(totalMinutesLastWeek / 60 / 5 / peopleCount)
          : 0;
      const chart = weeklyTotals.map((min) => Math.round(min / 60));

      result.push({
        id: deptRow.id,
        name: deptRow.name,
        shortName: deptRow.short_name,
        people: peopleCount,
        hours: avgHours,
        change: "+0%",
        trend: "neutral",
        chart,
        color: deptRow.color,
        gradient: deptRow.color,
      });
    }

    res.json(result);
  } catch (err) {
    console.error("Error fetching department overview:", err);
    res.status(500).json({ error: "Database error" });
  }
};

// GET all departments
exports.getAllDepartments = async (req, res) => {
  try {
    const [departments] = await db.query(`
      SELECT name 
      FROM departments 
      ORDER BY name
    `);

    const departmentList = departments.map((dept) => dept.name);
    res.json(departmentList);
  } catch (err) {
    console.error("Error fetching departments:", err);
    res.status(500).json({ error: "Database error" });
  }
};

// POST create new department
exports.createDepartment = async (req, res) => {
  try {
    const { name, shortName, color } = req.body;

    if (!name || !shortName) {
      return res.status(400).json({ error: "Name and shortName are required" });
    }

    // Insert into departments table
    const [result] = await db.query(
      "INSERT INTO departments (name, short_name, color) VALUES (?, ?, ?)",
      [name, shortName, color || "#3b82f6"]
    );

    const newDepartment = {
      id: result.insertId,
      name: name,
      shortName: shortName,
      people: 0,
      hours: 0,
      change: "+0%",
      trend: "neutral",
      chart: [0, 0, 0, 0, 0, 0, 0],
      color: color || "#3b82f6",
      gradient: color || "#3b82f6",
    };

    res.status(201).json(newDepartment);
  } catch (err) {
    console.error("Error creating department:", err);
    res.status(500).json({ error: "Database error" });
  }
};

// DELETE department
exports.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if department has personnel
    const [personnel] = await db.query(
      "SELECT COUNT(*) as count FROM Personnel WHERE per_department = (SELECT name FROM departments WHERE id = ?)",
      [id]
    );

    if (personnel[0].count > 0) {
      return res.status(400).json({
        error: "Cannot delete department. It has personnel assigned to it.",
      });
    }

    // Delete department
    const [result] = await db.query("DELETE FROM departments WHERE id = ?", [
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Department not found" });
    }

    res.json({ message: "Department deleted successfully" });
  } catch (err) {
    console.error("Error deleting department:", err);
    res.status(500).json({ error: "Database error" });
  }
};

// PUT update department
exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, shortName, color } = req.body;

    if (!name || !shortName) {
      return res.status(400).json({ error: "Name and shortName are required" });
    }

    // Update department
    const [result] = await db.query(
      "UPDATE departments SET name = ?, short_name = ?, color = ? WHERE id = ?",
      [name, shortName, color || "#3b82f6", id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Department not found" });
    }

    // Get updated department
    const [updatedDept] = await db.query(
      "SELECT * FROM departments WHERE id = ?",
      [id]
    );

    res.json(updatedDept[0]);
  } catch (err) {
    console.error("Error updating department:", err);
    res.status(500).json({ error: "Database error" });
  }
};
