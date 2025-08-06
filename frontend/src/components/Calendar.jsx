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
    const url = `https://date.nager.at/api/v3/PublicHolidays/${sel.year}/TR`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        const obj = {};
        data.forEach((h) => {
          const dt = new Date(h.date);
          const key = `${dt.getMonth() + 1}-${dt.getDate()}`;
          obj[key] = h.localName;
        });
        setHolidays(obj);
      })
      .catch(console.error);
  }, [sel.year]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await axios.get("http://localhost:5050/api/personnel");
        const deptCounts = {};
        res.data.forEach((p) => {
          deptCounts[p.per_department] =
            (deptCounts[p.per_department] || 0) + 1;
        });
        const total = res.data.length;
        const formatted = Object.entries(deptCounts).map(([name, count]) => ({
          name,
          count,
          color: getDeptColor(name),
          percentage: ((count / total) * 100).toFixed(2) + "%",
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
      "Yılbaşı Tatili": { bg: "transparent", border: "transparent" },
      "Ramazan Bayramı": { bg: "transparent", border: "transparent" },
      "Ulusal Egemenlik ve Çocuk Bayramı": {
        bg: "transparent",
        border: "transparent",
      },
      "İşçi Bayramı": { bg: "transparent", border: "transparent" },
      "Atatürk'ü Anma, Gençlik ve Spor Bayramı": {
        bg: "transparent",
        border: "transparent",
      },
      "Kurban Bayramı": { bg: "transparent", border: "transparent" },
      "Demokrasi ve Milli Birlik Günü": {
        bg: "transparent",
        border: "transparent",
      },
      "Zafer Bayramı": { bg: "transparent", border: "transparent" },
      "Cumhuriyet Bayramı": { bg: "transparent", border: "transparent" },
    };
    return colors[holidayName] || { bg: "transparent", border: "transparent" };
  };

  const cellStyle = (d) => {
    const key = `${sel.month + 1}-${d}`;
    const hol = holidays[key];
    if (isToday(d))
      return {
        backgroundColor: "#E2CFFF",
        color: "#fff",
        borderRadius: "12px",
        fontWeight: "600",
        boxShadow: "0 4px 12px rgba(185, 186, 190, 0.4)",
        transform: "scale(1.05)",
      };
    if (hol)
      return {
        backgroundColor: "#E3EBFF",
        color: "#d97706",
        borderRadius: "12px",
        fontWeight: "500",
        border: "1px solid rgb(234, 234, 234)",
      };
    return {};
  };

  return (
    <div style={{ height: "calc(100vh - 120px)", overflow: "hidden"}}>
      {/* Ana container - 75% Calendar + 25% Side Card */}
      <div style={{ display: "flex", gap: "20px", minHeight: "100%", boxSizing: "border-box" }}>
        {/* Calendar - 75% width */}
        <div
          style={{
            flex: "0 0 75%",
            display: "flex",
            flexDirection: "column",
            minHeight: "100%",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              border: "1px solid #e2e8f0",
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Modern header - Fixed */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: "16px 24px",
                background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                borderBottom: "1px solid #e2e8f0",
                position: "relative",
                flexShrink: 0,
                borderTopLeftRadius: '20px',
                borderTopRightRadius: '20px'
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  justifyContent: "center",
                }}
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
                    borderRadius: "20px",
                    textAlign: "center",
                    transition: "all 0.2s ease",
                    background: "rgba(255, 255, 255, 0.8)",
                    minWidth: "200px",
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
                  position: "absolute",
                  right: "24px",
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

            {/* Modern calendar grid - No scroll */}
            <div
              style={{
                padding: "16px",
                flex: 1,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Day headers */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: "8px",
                  marginBottom: "10px",
                  flexShrink: 0,
                }}
              >
                {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((d) => (
                  <div
                    key={d}
                    style={{
                      height: "32px",
                      padding: "6px 4px",
                      background: "transparent",
                      fontWeight: "600",
                      fontSize: "12px",
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
              {/* Calendar weeks - Scrollable content */}
              <div style={{ flex: 1 }}>
                {weeks.map((week, weekIndex) => (
                  <div
                    key={weekIndex}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(7, 1fr)",
                      gap: "8px",
                      marginBottom: "8px",
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
                            minHeight: "60px",
                            padding: "6px",
                            fontSize: "12px",
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
                            }
                          }}
                          onMouseOut={(e) => {
                            if (isCurrentMonth && !isToday(d) && !hol) {
                              e.target.style.backgroundColor = "#ffffff";
                              e.target.style.borderColor = "#e2e8f0";
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
                                  fontSize: "13px",
                                  marginBottom: "4px",
                                }}
                              >
                                {d}
                              </div>
                              {hol && (
                                <div
                                  style={{
                                    position: "absolute",
                                    bottom: "4px",
                                    left: "4px",
                                    right: "4px",
                                    minHeight: "16px",
                                    borderRadius: "4px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "8px",
                                    fontWeight: "600",
                                    color: "#1d062E",
                                    boxShadow: "none",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                    textAlign: "center",
                                    lineHeight: "1.2",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                  title={hol}
                                  onMouseOver={(e) => {
                                    e.target.style.transform = "translateY(-1px)";
                                  }}
                                  onMouseOut={(e) => {
                                    e.target.style.transform = "translateY(0)";
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
        </div>

        {/* Side Card - 25% width */}
        <div style={{ flex: "0 0 23.6%" }}>
          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              border: "1px solid #e2e8f0",
              padding: "20px 8px 20px 20px",
    
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Department Distribution Section */}
            <div style={{ marginBottom: "24px", height: "100%" }}>
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: "700",
                  color: "#1e293b",
                  margin: "0 0 8px 0",
                  textAlign: "center",
                }}
              >
                Department Distribution
              </h3>
              <p
                style={{
                  fontSize: "14px",
                  color: "#64748b",
                  margin: "0 0 24px 0",
                  textAlign: "center",
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
                  marginBottom: "32px",
                  padding: "16px",
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
                    border: "4px solid #f8fafc",
                  }}
                >
                  <div
                    style={{
                      width: "90px",
                      height: "90px",
                      borderRadius: "50%",
                      background: "#ffffff",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "2px solid #f1f5f9",
                    }}
                  ></div>
                </div>
              </div>

              {/* Legend */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {departmentData.map((dept, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      fontSize: "14px",
                      padding: "12px 16px",
                      borderRadius: "12px",
                      transition: "all 0.2s ease",
                    }}
                    onMouseOver={(e) => {
                      e.target.style.backgroundColor = "#f8fafc";
                      e.target.style.transform = "translateY(-1px)";
                    }}
                    onMouseOut={(e) => {
                      e.target.style.backgroundColor = "transparent";
                      e.target.style.transform = "translateY(0)";
                    }}
                  >
                    <div
                      style={{
                        width: "16px",
                        height: "16px",
                        borderRadius: "50%",
                        background: dept.color,
                      }}
                    />
                    <span
                      style={{
                        fontWeight: "600",
                        color: "#1e293b",
                        minWidth: "40px",
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;