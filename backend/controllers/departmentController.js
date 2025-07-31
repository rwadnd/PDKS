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
    const startOfThisWeek = new Date(now);
    startOfThisWeek.setDate(startOfThisWeek.getDate() - startOfThisWeek.getDay() + 1); // Monday
    startOfThisWeek.setHours(0, 0, 0, 0);

    const weekStartDates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfThisWeek);
      d.setDate(d.getDate() - (6 - i) * 7);
      return d;
    });

    const result = [];

    for (const [department, ids] of Object.entries(deptMap)) {
      const placeholders = ids.map(() => "?").join(",");
      const [entries] = await db.query(
        `SELECT personnel_per_id, pdks_checkInTime, pdks_checkOutTime
         FROM pdks_entry
         WHERE personnel_per_id IN (${placeholders})`,
        ids
      );

      let totalMinutesLastWeek = 0;
      const weeklyTotals = Array(7).fill(0);

      for (const entry of entries) {
        const checkIn = new Date(entry.pdks_checkInTime);
        const checkOut = new Date(entry.pdks_checkOutTime);
        if (!isNaN(checkIn) && !isNaN(checkOut)) {
          const duration = (checkOut - checkIn) / (1000 * 60); // in minutes

          for (let i = 0; i < 7; i++) {
            const weekStart = new Date(weekStartDates[i]);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 7);

            if (checkIn >= weekStart && checkIn < weekEnd) {
              weeklyTotals[i] += duration;

              if (i === 6) {
                totalMinutesLastWeek += duration;
              }

              break;
            }
          }
        }
      }

      const peopleCount = ids.length;
      const avgHours = peopleCount > 0 ? Math.round((totalMinutesLastWeek / 60) / 5 / peopleCount) : 0;

      const chart = weeklyTotals.map((mins) => Math.round(mins / 60));

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
        color: color,
        gradient: color,
      });
    }

    res.json(result);
  } catch (err) {
    console.error("Error fetching department overview:", err);
    res.status(500).json({ error: "Database error" });
  }
};
