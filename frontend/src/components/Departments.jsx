import React, { useEffect,useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import {
  FaUsers,
  FaClock,
  FaChartBar,
  FaBuilding,
  FaArrowUp,
  FaArrowDown,
} from "react-icons/fa";
import "../App.css";
import axios from "axios";


const Departments = ({ searchTerm }) => {
  const [departments, setDepartments] = useState([]);
  const [hoveredCard, setHoveredCard] = useState(null);


  useEffect(() => {
    axios.get("http://localhost:5000/api/department/").then((res) => setDepartments(res.data));
  }, []);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "12px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          }}
        >
          <p style={{ margin: 0, fontWeight: "600", color: "#374151" }}>
            {label}: {payload[0].value}h
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      style={{
        padding: "24px",
        backgroundColor: "#f8fafc",
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: "32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "700",
              color: "#1e293b",
              margin: "0 0 8px 0",
            }}
          >
            Departments Overview
          </h1>
          <p
            style={{
              fontSize: "16px",
              color: "#64748b",
              margin: 0,
            }}
          >
            Monitor performance and productivity across all departments
          </p>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px 20px",
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          }}
        >
          <FaChartBar style={{ color: "#64748b" }} />
          <span
            style={{ fontSize: "14px", fontWeight: "500", color: "#374151" }}
          >
            {departments.length} Departments
          </span>
        </div>
      </div>

      {/* Departments Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
          gap: "24px",
          marginBottom: "32px",
        }}
      >
        {departments
          .filter((dep) => {
            if (!searchTerm) return true;
            const searchLower = searchTerm.toLowerCase();
            return (
              dep.name.toLowerCase().includes(searchLower) ||
              dep.shortName.toLowerCase().includes(searchLower)
            );
          })
          .map((dep) => {
            const data = dep.chart.map((val, i) => ({
              name: `Week ${i + 1}`,
              value: val,
              fill: dep.color,
            }));

            return (
              <div
                key={dep.id}
                style={{
                  background: "#ffffff",
                  borderRadius: "20px",
                  padding: "28px",
                  boxShadow:
                    hoveredCard === dep.id
                      ? "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                      : "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                  border: "1px solid #f1f5f9",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  transform:
                    hoveredCard === dep.id
                      ? "translateY(-4px)"
                      : "translateY(0)",
                }}
                onMouseEnter={() => setHoveredCard(dep.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {/* Department Header */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "24px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "20px",
                        fontWeight: "700",
                        color: "#1e293b",
                        marginBottom: "4px",
                      }}
                    >
                      {dep.name}
                    </div>
                    <div
                      style={{
                        fontSize: "14px",
                        color: "#64748b",
                        fontWeight: "500",
                      }}
                    >
                      {dep.shortName} Department
                    </div>
                  </div>
                  <div
                    style={{
                      background: dep.gradient,
                      borderRadius: "12px",
                      padding: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FaBuilding
                      style={{ color: "#ffffff", fontSize: "18px" }}
                    />
                  </div>
                </div>

                {/* Stats Row */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "20px",
                    marginBottom: "28px",
                  }}
                >
                  {/* People Count */}
                  <div
                    style={{
                      padding: "16px",
                      backgroundColor: "#f8fafc",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "8px",
                      }}
                    >
                      <FaUsers style={{ color: dep.color, fontSize: "16px" }} />
                      <span
                        style={{
                          fontSize: "14px",
                          color: "#64748b",
                          fontWeight: "500",
                        }}
                      >
                        Personnel
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "24px",
                        fontWeight: "700",
                        color: "#1e293b",
                      }}
                    >
                      {dep.people}
                    </div>
                  </div>

                  {/* Hours */}
                  <div
                    style={{
                      padding: "16px",
                      backgroundColor: "#f8fafc",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "8px",
                      }}
                    >
                      <FaClock style={{ color: dep.color, fontSize: "16px" }} />
                      <span
                        style={{
                          fontSize: "14px",
                          color: "#64748b",
                          fontWeight: "500",
                        }}
                      >
                        Hours
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "24px",
                        fontWeight: "700",
                        color: "#1e293b",
                      }}
                    >
                      {dep.hours}h
                    </div>
                  </div>
                </div>

               

                {/* Chart */}
                <div style={{ height: "200px", marginTop: "16px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data}
                      margin={{ top: 30, right: 10, left: 10, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 50]}
                        ticks={[0, 10, 20, 30, 40, 50]}
                        fontSize={12}
                        tick={{ fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="value"
                        radius={[6, 6, 0, 0]}
                        fill={dep.color}
                        opacity={0.8}
                      >
                        <LabelList
                          dataKey="value"
                          position="top"
                          fontSize={12}
                          fontWeight="600"
                          fill="#64748b"
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}
      </div>

     
    </div>
  );
};

export default Departments;
