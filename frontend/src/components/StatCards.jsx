import { useEffect, useState } from "react";
import axios from "axios";
import { FaUsers, FaBuilding, FaClock } from "react-icons/fa";
import { FiLogIn } from "react-icons/fi";
import "../App.css";

const StatCards = ({ onChangePage }) => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    axios
      .get("http://localhost:5050/api/pdks/dashboard/stats") // ✅ Adjust if your backend URL differs
      .then((res) => setStats(res.data))
      .catch((err) => console.error("Failed to fetch dashboard stats:", err));
  }, []);

  if (!stats) return <div>Loading...</div>;

  const statCards = [
    {
      title: "Total Personnel",
      value: stats.totalPersonnel,
      trend: "neutral",
      icon: <FaUsers size={24} />,
      color: "#667eea",
      onClick: () => onChangePage("personnel"),
    },
    {
      title: "Total Departments",
      value: stats.totalDepartments,
      trend: "neutral",
      icon: <FaBuilding size={24} />,
      color: "#06b6d4",
      onClick: () => onChangePage("departments"),
    },
    {
      title: "Today's Entries",
      value: stats.todaysEntries,
      trend: "up",
      icon: <FiLogIn size={24} />,
      color: "#10b981",
      onClick: () => onChangePage("entries"),
    },
    {
      title: "Last Entry",
      value: stats.lastEntryTime,
      trend: "neutral",
      icon: <FaClock size={24} />,
      color: "#f59e0b",
      onClick: () => onChangePage("entries"),
    },
  ];

  return (
    <div style={{ marginBottom: "20px" }}>
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
            onClick={stat.onClick}
            style={{
              background: "#fff",
              borderRadius: "20px",
              padding: "20px",
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
            <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center", // changed from flex-start to center
  }}
>
  {/* Left Side: Text */}
  <div style={{ flex: 1 }}>
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
  </div>

  {/* Right Side: Icon */}
  <div
    style={{
      width: "56px",
      height: "56px",
      borderRadius: "16px",
      background: "#f3f4f6",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: stat.color,
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
      flexShrink: 0,
    }}
  >
    <span style={{ fontSize: "24px" }}>{stat.icon}</span>
  </div>
</div>

          </div>
        ))}
      </div>
    </div>
  );
};

export default StatCards;
