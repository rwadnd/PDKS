import React, { useState, useEffect } from "react";

const Calendar = () => {
  const today = new Date();
  const [sel, setSel] = useState({ day: today.getDate(), month: today.getMonth(), year: today.getFullYear() });
  const [holidays, setHolidays] = useState({}); 
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    const url = `https://date.nager.at/api/v3/PublicHolidays/${sel.year}/TR`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        const obj = {};
        data.forEach(h => {
          const dt = new Date(h.date);
          const key = `${dt.getMonth() + 1}-${dt.getDate()}`;
          obj[key] = h.localName;
        });
        setHolidays(obj);
      })
      .catch(console.error);
  }, [sel.year]);

  const daysInMonth = new Date(sel.year, sel.month + 1, 0).getDate();
  const offset = ((new Date(sel.year, sel.month, 1).getDay() + 6) % 7);
  const weeks = [];
  for (let d = 1 - offset; d <= daysInMonth;) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      week.push(d > 0 && d <= daysInMonth ? d++ : (d++, null));
    }
    weeks.push(week);
  }

  const isToday = (d) =>
    d === today.getDate() && sel.month === today.getMonth() && sel.year === today.getFullYear();

  const cellStyle = (d) => {
    const key = `${sel.month + 1}-${d}`;
    const hol = holidays[key];
    if (isToday(d)) return { backgroundColor: "#1bc35eff", color: "#fff", borderRadius: "8px", fontWeight: "bold" };
    if (hol) return { backgroundColor: "#ffeeba", color: "#856404", borderRadius: "8px", fontWeight: "bold" };
    return {};
  };

  return (
    <div style={{ 
      maxWidth: "1100px",
      margin: "auto",
      padding: "10px",
      fontFamily: "sans-serif",
      position: "relative",
      backgroundColor: "#fff", // Changed to white background
      borderRadius: "5px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",// Added subtle shadow for better visibility

  overflowY: "auto",
    }}>
      {/* Top navigation bar - kept exactly as you requested */}
      <div style={{ 
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "10px",
        padding: "5px 10px",
        background: "#f5f5f5",
        borderRadius: "3px"
      }}>
        <button 
          onClick={() => setSel(p => ({ ...p, month: p.month - 1 < 0 ? 11 : p.month - 1, year: p.month - 1 < 0 ? p.year - 1 : p.year }))}
          style={{ 
            border: "none",
            background: "none",
            fontSize: "16px",
            cursor: "pointer",
            padding: "5px 10px"
          }}
        >
          {"<"}
        </button>
        <span
          style={{ 
            margin: "0 10px", 
            cursor: "pointer", 
            fontWeight: "bold",
            fontSize: "16px"
          }}
          onClick={() => setShowPicker(!showPicker)}
        >
          {new Date(sel.year, sel.month).toLocaleString("default", { month: "long" })} {sel.year}
        </span>
        <button 
          onClick={() => setSel(p => ({ ...p, month: p.month + 1 > 11 ? 0 : p.month + 1, year: p.month + 1 > 11 ? p.year + 1 : p.year }))}
          style={{ 
            border: "none",
            background: "none",
            fontSize: "16px",
            cursor: "pointer",
            padding: "5px 10px"
          }}
        >
          {">"}
        </button>
      </div>

      {showPicker && (
        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          gap: "10px", 
          margin: "10px 0",
          padding: "10px",
          background: "#f9f9f9",
          borderRadius: "3px"
        }}>
          <select 
            name="day" 
            value={sel.day} 
            onChange={e => setSel({ ...sel, day: +e.target.value })}
            style={{ padding: "5px" }}
          >
            {[...Array(31)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
          </select>
          <select 
            name="month" 
            value={sel.month} 
            onChange={e => setSel({ ...sel, month: +e.target.value })}
            style={{ padding: "5px" }}
          >
            {Array.from({ length: 12 }).map((_, i) => <option key={i} value={i}>{new Date(0,i).toLocaleString("default",{month:"long"})}</option>)}
          </select>
          <select 
            name="year" 
            value={sel.year} 
            onChange={e => setSel({ ...sel, year: +e.target.value })}
            style={{ padding: "5px" }}
          >
            {Array.from({ length: 126 }).map((_, i) => 1900 + i).map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      )}

      {/* Calendar table with white background */}
      <table style={{ 
        width: "100%", 
        borderCollapse: "collapse", 
        textAlign: "center",
        tableLayout: "fixed",
        backgroundColor: "#fff" // Ensured white background
      }}>
        <thead>
          <tr>
            {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map(d => (
              <th 
                key={d} 
                style={{ 
                  padding: "8px", 
                  background: "#f0f0f0",
                  fontWeight: "normal",
                  fontSize: "14px"
                }}
              >
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, i) => (
            <tr key={i}>
              {week.map((d, j) => {
                const key = `${sel.month + 1}-${d}`;
                const hol = holidays[key];
                return (
                  <td 
                    key={j} 
                    style={{ 
                      width: "14.28%",
                      height: "80px",
                      border: "1px solid #e0e0e0", // Lighter border color
                      verticalAlign: "top",
                      padding: "4px",
                      fontSize: "14px",
                      backgroundColor: "#fff", // White cell background
                      ...cellStyle(d)
                    }}
                  >
                    {d && (
                      <>
                        <div style={{ textAlign: "right" }}>{d}</div>
                        {hol && <div style={{ fontSize: "10px", marginTop: "4px", color: "#a94442" }}>{hol}</div>}
                      </>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Calendar;