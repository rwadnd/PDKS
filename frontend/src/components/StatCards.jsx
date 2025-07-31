import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaUsers, FaBuilding, FaClock } from "react-icons/fa";
import { FiLogIn } from "react-icons/fi";
import "../App.css";

const StatCards = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/pdks/dashboard/stats") // ✅ Adjust if your backend URL differs
      .then((res) => setStats(res.data))
      .catch((err) => console.error("Failed to fetch dashboard stats:", err));
  }, []);

  if (!stats) return <div>Loading...</div>;

  const statCards = [
    {
      title: "Total Personnel",
      value: stats.totalPersonnel,
      change: "+0%",
      trend: "neutral",
      icon: <FaUsers size={24} />,
      color: "#667eea",
    },
    {
      title: "Total Departments",
      value: stats.totalDepartments,
      change: "+0%",
      trend: "neutral",
      icon: <FaBuilding size={24} />,
      color: "#06b6d4",
    },
    {
      title: "Today's Entries",
      value: stats.todaysEntries,
      change: "+0%",
      trend: "up",
      icon: <FiLogIn size={24} />,
      color: "#10b981",
    },
    {
      title: "Last Entry",
      value: stats.lastEntryTime,
      change: "-0%",
      trend: "neutral",
      icon: <FaClock size={24} />,
      color: "#f59e0b",
    },
  ];

  return (
    <div style={{ marginBottom: "16px" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "16px",
        }}
      >
        {statCards.map((stat, i) => (
          <div
            key={i}
            style={{
              background: "#fff",
              borderRadius: "20px",
              padding: "16px",
              border: "1px solid rgba(255, 255, 255, 0.8)",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
              transition: "all 0.3s ease",
              cursor: "pointer",
              position: "relative",
              overflow: "hidden",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow =
                "0 8px 30px rgba(0, 0, 0, 0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 4px 20px rgba(0, 0, 0, 0.08)";
            }}
          >
            <div style={{ position: "relative", zIndex: 1 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "12px",
                    background: "#f3f4f6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: stat.color,
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                  }}
                >
                  {stat.icon}
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "4px 8px",
                    borderRadius: "8px",
                    background: "#fff",
                    color:
                      stat.trend === "up"
                        ? "#10b981"
                        : stat.trend === "down"
                        ? "#ef4444"
                        : "#6b7280",
                    fontSize: "12px",
                    fontWeight: "600",
                    border: "1px solid #f1f5f9",
                  }}
                >
                  <span
                    style={{
                      fontSize: "10px",
                      transform:
                        stat.trend === "down" ? "rotate(180deg)" : "none",
                    }}
                  >
                    ▲
                  </span>
                  {stat.change}
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "#64748b",
                    fontWeight: "500",
                    marginBottom: "6px",
                  }}
                >
                  {stat.title}
                </div>
                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: "700",
                    color: "#1e293b",
                    marginBottom: "4px",
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#94a3b8",
                    fontWeight: "400",
                  }}
                >
                  {stat.trend === "up"
                    ? "↗ Increased from yesterday"
                    : stat.trend === "down"
                    ? "↘ Decreased from yesterday"
                    : "→ No change from yesterday"}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatCards;
