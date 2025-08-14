const db = require('../db/connection');

exports.overview = async (req, res) => {
  try {
    const [departments] = await db.query(`
      SELECT per_department, per_id
      FROM Personnel
    `);

    const deptMap = {};
    for (const row of departments) {
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
    const [entries] = await db.query(`
      SELECT personnel_per_id, pdks_date, pdks_checkInTime, pdks_checkOutTime
      FROM pdks_entry
      WHERE pdks_date >= ?
    `, [earliestDateStr]);

    const result = [];

    for (const [department, ids] of Object.entries(deptMap)) {
      const deptEntries = entries.filter(e => ids.includes(e.personnel_per_id));
      let totalMinutesLastWeek = 0;
      const weeklyTotals = Array(7).fill(0);

      for (const entry of deptEntries) {
        const dateStr = entry.pdks_date;
        const date = new Date(dateStr);
        const inTimeStr = entry.pdks_checkInTime;
        const outTimeStr = entry.pdks_checkOutTime;

        if (!inTimeStr || !outTimeStr || inTimeStr === "00:00:00" || outTimeStr === "00:00:00") continue;

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
      const avgHours = peopleCount > 0 ? Math.round((totalMinutesLastWeek / 60) / 5 / peopleCount) : 0;
      const chart = weeklyTotals.map(min => Math.round(min / 60));

      const color =
        department === "IT"
          ? "#06b6d4"
          : department === "Finance"
          ? "#3dd406ff"
          : department === "QA"
          ? "#ab06d4ff"
          : "#f59e0b";

      result.push({
        id:
          department === "IT"
            ? 1
            : department === "Finance"
            ? 2
            : department === "QA"
            ? 3
            : 4,
        name: department,
        shortName: department.slice(0, 3).toUpperCase(),
        people: peopleCount,
        hours: avgHours,
        change: "+0%",
        trend: "neutral",
        chart,
        color,
        gradient: color,
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
      SELECT DISTINCT per_department 
      FROM Personnel 
      WHERE per_department IS NOT NULL AND per_department != ''
      ORDER BY per_department
    `);
    
    const departmentList = departments.map(dept => dept.per_department);
    res.json(departmentList);
  } catch (err) {
    console.error("Error fetching departments:", err);
    res.status(500).json({ error: "Database error" });
  }
};
