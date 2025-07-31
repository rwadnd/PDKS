import React, { useState, useEffect } from "react";
import { FaCalendarAlt, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import axios from "axios";
import { useMemo } from "react";


const Calendar = () => {
  const today = new Date();
  const [sel, setSel] = useState({
    day: today.getDate(),
    month: today.getMonth(),
    year: today.getFullYear(),
  });
  const [holidays, setHolidays] = useState({});
  const [showPicker, setShowPicker] = useState(false);
  const [departmentData, setDepartmentData] = useState([]);

  useEffect(() => {
    // Türkiye resmi tatilleri 2025
    const turkishHolidays = {
      "1-1": "Yılbaşı Tatili",
      "3-30": "Ramazan Bayramı",
      "3-31": "Ramazan Bayramı",
      "4-1": "Ramazan Bayramı",
      "4-23": "Ulusal Egemenlik ve Çocuk Bayramı",
      "5-1": "İşçi Bayramı",
      "5-19": "Atatürk'ü Anma, Gençlik ve Spor Bayramı",
      "6-6": "Kurban Bayramı",
      "6-7": "Kurban Bayramı",
      "6-8": "Kurban Bayramı",
      "6-9": "Kurban Bayramı",
      "7-15": "Demokrasi ve Milli Birlik Günü",
      "8-30": "Zafer Bayramı",
      "10-29": "Cumhuriyet Bayramı",
      "10-30": "Cumhuriyet Bayramı", // Yarım gün + tam gün
    };
    setHolidays(turkishHolidays);
  }, [sel.year]);


    useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/personnel");
        const deptCounts = {};
        res.data.forEach(p => {
          deptCounts[p.per_department] = (deptCounts[p.per_department] || 0) + 1;
        });
        const total = res.data.length;
        const formatted = Object.entries(deptCounts).map(([name, count]) => ({
          name,
          count,
          color: getDeptColor(name),
          percentage: ((count / total) * 100).toFixed(2) + "%"
        }));
        setDepartmentData(formatted);
      } catch (error) {
        console.error("Failed to load department data", error);
      }
    };
    fetchDepartments();
  }, []);


  const pieGradient = useMemo(() => {
  let currentAngle = 0;
  return (
    "conic-gradient(" +
    departmentData
      .map((dept) => {
        const percent = parseFloat(dept.percentage);
        const slice = (360 * percent) / 100;
        const start = currentAngle;
        const end = currentAngle + slice;
        currentAngle = end;
        return `${dept.color} ${start}deg ${end}deg`;
      })
      .join(", ") +
    ")"
  );
}, [departmentData]);


  const daysInMonth = new Date(sel.year, sel.month + 1, 0).getDate();
  const offset = (new Date(sel.year, sel.month, 1).getDay() + 6) % 7;
  const weeks = [];
  for (let d = 1 - offset; d <= daysInMonth; ) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      week.push(d > 0 && d <= daysInMonth ? d++ : (d++, null));
    }
    weeks.push(week);
  }


  const getDeptColor = (name) => {
    const colorMap = {
      IT: "#667eea",
      QA: "#06b6d4",
      Finance: "#f59e0b",
    };
    return colorMap[name] || "#8b5cf6";
  };

  const isToday = (d) =>
    d === today.getDate() &&
    sel.month === today.getMonth() &&
    sel.year === today.getFullYear();

  const getHolidayColor = (holidayName) => {
    const colors = {
      "Yılbaşı Tatili": { bg: "#8b5cf6", border: "#7c3aed" }, // Mor
      "Ramazan Bayramı": { bg: "#ec4899", border: "#db2777" }, // Pembe
      "Ulusal Egemenlik ve Çocuk Bayramı": { bg: "#06b6d4", border: "#0891b2" }, // Cyan
      "İşçi Bayramı": { bg: "#f59e0b", border: "#d97706" }, // Turuncu
      "Atatürk'ü Anma, Gençlik ve Spor Bayramı": {
        bg: "#10b981",
        border: "#059669",
      }, // Yeşil
      "Kurban Bayramı": { bg: "#ef4444", border: "#dc2626" }, // Kırmızı
      "Demokrasi ve Milli Birlik Günü": {
        bg: "#8b5cf6",
        border: "#7c3aed",
      }, // Mor
      "Zafer Bayramı": { bg: "#06b6d4", border: "#0891b2" }, // Cyan
      "Cumhuriyet Bayramı": { bg: "#f59e0b", border: "#d97706" }, // Turuncu
    };
    return colors[holidayName] || { bg: "#8b5cf6", border: "#7c3aed" };
  };

  const cellStyle = (d) => {
    const key = `${sel.month + 1}-${d}`;
    const hol = holidays[key];
    if (isToday(d))
      return {
        backgroundColor: "#667eea",
        color: "#fff",
        borderRadius: "12px",
        fontWeight: "600",
        boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)",
        transform: "scale(1.05)",
      };
    if (hol)
      return {
        backgroundColor: "#fef5e7",
        color: "#d97706",
        borderRadius: "12px",
        fontWeight: "500",
        border: "1px solid #fed7aa",
      };
    return {};
  };

  return (
    <div style={{ marginBottom: "0px" }}>
      {/* Header kısmını tamamen kaldırdım */}

      {/* Ana container - 75% Calendar + 25% Side Card */}
      <div style={{ display: "flex", gap: "20px", height: "100%" }}>
        {/* Calendar - 75% width */}
        <div style={{ flex: "0 0 75%" }}>
          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.8)",
              overflow: "hidden",
              height: "100%",
            }}
          >
            {/* Modern header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 24px",
                background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                borderBottom: "1px solid #e2e8f0",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "16px", width:"40%" }}
              >
                <button
                  onClick={() =>
                    setSel((p) => ({
                      ...p,
                      month: p.month - 1 < 0 ? 11 : p.month - 1,
                      year: p.month - 1 < 0 ? p.year - 1 : p.year,
                    }))
                  }
                  style={{
                    border: "none",
                    background: "#ffffff",
                    fontSize: "14px",
                    cursor: "pointer",
                    padding: "10px",
                    borderRadius: "10px",
                    color: "#64748b",
                    fontWeight: "500",
                    transition: "all 0.2s ease",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "36px",
                    height: "36px",
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = "#f1f5f9";
                    e.target.style.color = "#374151";
                    e.target.style.transform = "translateY(-1px)";
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = "#ffffff";
                    e.target.style.color = "#64748b";
                    e.target.style.transform = "translateY(0)";
                  }}
                >
                  <FaChevronLeft />
                </button>
                <span
                  style={{
                    cursor: "pointer",
                    fontWeight: "700",
                    fontSize: "20px",
                    color: "#1e293b",
                    padding: "8px 16px",
                    borderRadius: "10px",
                    width: "90%",
                    textAlign: "center",
                    transition: "all 0.2s ease",
                    background: "rgba(255, 255, 255, 0.8)",
                  }}
                  onClick={() => setShowPicker(!showPicker)}
                  onMouseOver={(e) => {
                    e.target.style.background = "#ffffff";
                    e.target.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)";
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = "rgba(255, 255, 255, 0.8)";
                    e.target.style.boxShadow = "none";
                  }}
                >
                  {new Date(sel.year, sel.month).toLocaleString("default", {
                    month: "long",
                  })}{" "}
                  {sel.year}
                </span>
                <button
                  onClick={() =>
                    setSel((p) => ({
                      ...p,
                      month: p.month + 1 > 11 ? 0 : p.month + 1,
                      year: p.month + 1 > 11 ? p.year + 1 : p.year,
                    }))
                  }
                  style={{
                    border: "none",
                    background: "#ffffff",
                    fontSize: "14px",
                    cursor: "pointer",
                    padding: "10px",
                    borderRadius: "10px",
                    color: "#64748b",
                    fontWeight: "500",
                    transition: "all 0.2s ease",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "36px",
                    height: "36px",
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = "#f1f5f9";
                    e.target.style.color = "#374151";
                    e.target.style.transform = "translateY(-1px)";
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = "#ffffff";
                    e.target.style.color = "#64748b";
                    e.target.style.transform = "translateY(0)";
                  }}
                >
                  <FaChevronRight />
                </button>
              </div>

              {/* Quick Stats */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                }}
              >
                <div
                  style={{
                    padding: "8px 16px",
                    background: "rgba(255, 255, 255, 0.8)",
                    borderRadius: "10px",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#64748b",
                  }}
                >
                  {
                    Object.keys(holidays).filter((key) => {
                      const [month, day] = key.split("-");
                      return parseInt(month) === sel.month + 1;
                    }).length
                  }{" "}
                  Events
                </div>
              </div>
            </div>

            {/* Modern calendar grid */}
            <div style={{ padding: "16px" }}>
              {" "}
              {/* 20px'den 16px'e düşürdüm */} {/* 12px'den 20px'e büyüttüm */}
              {/* Day headers */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: "8px", // 10px'den 8px'e düşürdüm
                  marginBottom: "10px", // 12px'den 10px'e düşürdüm
                }}
              >
                {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((d) => (
                  <div
                    key={d}
                    style={{
                      height: "32px", // 36px'den 32px'e düşürdüm
                      padding: "6px 4px",
                      background: "transparent",
                      fontWeight: "600",
                      fontSize: "12px", // 13px'den 12px'e düşürdüm
                      color: "#64748b",
                      textAlign: "center",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {d}
                  </div>
                ))}
              </div>
              {/* Calendar weeks */}
              {weeks.map((week, weekIndex) => (
                <div
                  key={weekIndex}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, 1fr)",
                    gap: "8px", // 10px'den 8px'e düşürdüm
                    marginBottom: "8px", // 10px'den 8px'e düşürdüm
                  }}
                >
                  {week.map((d, dayIndex) => {
                    const key = `${sel.month + 1}-${d}`;
                    const hol = holidays[key];
                    const isCurrentMonth = d && d > 0 && d <= daysInMonth;
                    const isOtherMonth = d && (d <= 0 || d > daysInMonth);

                    return (
                      <div
                        key={dayIndex}
                        style={{
                          minHeight: "70px", // 80px'den 70px'e düşürdüm
                          padding: "8px", // 10px'den 8px'e düşürdüm
                          fontSize: "13px", // 14px'den 13px'e düşürdüm
                          backgroundColor: isCurrentMonth
                            ? "#ffffff"
                            : isOtherMonth
                            ? "#f9fafb"
                            : "transparent",
                          borderRadius: "12px",
                          border: isCurrentMonth
                            ? "1px solid #e2e8f0"
                            : isOtherMonth
                            ? "1px solid #f1f5f9"
                            : "none",
                          transition: "all 0.2s ease",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "flex-start",
                          alignItems: "flex-start",
                          boxSizing: "border-box",
                          position: "relative",
                          ...cellStyle(d),
                        }}
                        onMouseOver={(e) => {
                          if (isCurrentMonth && !isToday(d) && !hol) {
                            e.target.style.backgroundColor = "#f8fafc";
                            e.target.style.borderColor = "#cbd5e1";
                            e.target.style.transform = "translateY(-2px)";
                            e.target.style.boxShadow =
                              "0 4px 12px rgba(0, 0, 0, 0.08)";
                          }
                        }}
                        onMouseOut={(e) => {
                          if (isCurrentMonth && !isToday(d) && !hol) {
                            e.target.style.backgroundColor = "#ffffff";
                            e.target.style.borderColor = "#e2e8f0";
                            e.target.style.transform = "translateY(0)";
                            e.target.style.boxShadow = "none";
                          }
                        }}
                      >
                        {d && (
                          <>
                            <div
                              style={{
                                textAlign: "left",
                                fontWeight: "600",
                                color: isCurrentMonth ? "#374151" : "#9ca3af",
                                fontSize: "14px", // 15px'den 14px'e düşürdüm
                                marginBottom: "6px",
                              }}
                            >
                              {d}
                            </div>
                            {hol && (
                              <div
                                style={{
                                  position: "absolute",
                                  bottom: "6px",
                                  left: "6px",
                                  right: "6px",
                                  minHeight: "20px", // 22px'den 20px'e düşürdüm
                                  backgroundColor: getHolidayColor(hol).bg,
                                  borderRadius: "6px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "9px", // 10px'den 9px'e düşürdüm
                                  fontWeight: "600",
                                  color: "#ffffff",
                                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.15)",
                                  cursor: "pointer",
                                  transition: "all 0.2s ease",
                                  padding: "3px 5px", // 4px 6px'den 3px 5px'e düşürdüm
                                  textAlign: "center",
                                  lineHeight: "1.2",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                                title={hol}
                                onMouseOver={(e) => {
                                  e.target.style.transform = "translateY(-2px)";
                                  e.target.style.boxShadow =
                                    "0 4px 8px rgba(0, 0, 0, 0.2)";
                                }}
                                onMouseOut={(e) => {
                                  e.target.style.transform = "translateY(0)";
                                  e.target.style.boxShadow =
                                    "0 2px 4px rgba(0, 0, 0, 0.15)";
                                }}
                              >
                                {hol.length > 10
                                  ? hol.substring(0, 10) + "..."
                                  : hol}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Side Card - 25% width */}
        <div style={{ flex: "0 0 23.6%" }}>
          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.8)",
              padding: "24px 8px 24px 24px", // Sağ padding'i 16px'den 8px'e düşürdüm
              height: "91%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Department Distribution Section */}
            <div style={{ marginBottom: "32px", height: "100%" }}>
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: "700",
                  color: "#1e293b",
                  margin: "10px 12px 15px 12px  ", //dist basligi
                }}
              >
                Department Distribution
              </h3>
              <p
                style={{
                  fontSize: "16px",
                  color: "#64748b",
                  margin: "20px 30px 38px ",
                }}
              >
                Personnel by Department
              </p>

              {/* Pie Chart */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: "24px",
                }}
              >
                <div
                  style={{
                    width: "140px",
                    height: "140px",
                    borderRadius: "50%",
                    background: pieGradient,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      width: "100px",
                      height: "100px",
                      borderRadius: "50%",
                      background: "#ffffff",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  ></div>
                </div>
              </div>

              {/* Legend */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {departmentData.map((dept, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      fontSize: "14px",
                      padding: "8px",
                      borderRadius: "8px",
                      transition: "background-color 0.2s ease",
                    }}
                    onMouseOver={(e) =>
                      (e.target.style.backgroundColor = "#f8fafc")
                    }
                    onMouseOut={(e) =>
                      (e.target.style.backgroundColor = "transparent")
                    }
                  >
                    <div
                      style={{
                        width: "16px", // 12px'den 16px'e büyüttüm
                        height: "16px", // 12px'den 16px'e büyüttüm
                        borderRadius: "50%",
                        background: dept.color,
                      }}
                    />
                    <span
                      style={{
                        fontWeight: "600",
                        color: "#1e293b",
                        minWidth: "40px", // 30px'den 40px'e büyüttüm
                      }}
                    >
                      {dept.name}
                    </span>
                    <span style={{ color: "#64748b", marginLeft: "auto" }}>
                      {dept.count} ({dept.percentage})
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Side card artık sadece Department Distribution içeriyor */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
