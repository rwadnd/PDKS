import React, { useEffect, useState } from "react";
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
  FaEdit,
} from "react-icons/fa";
import "../App.css";
import axios from "axios";

const Departments = ({ searchTerm }) => {
  const [departments, setDepartments] = useState([]);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    shortName: "",
    color: "#ffffff",
    gradient: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
  });

  useEffect(() => {
    // Check if we have departments in localStorage
    const savedDepartments = localStorage.getItem("departments");
    if (savedDepartments) {
      setDepartments(JSON.parse(savedDepartments));
    }

    // Always fetch from API to get latest data
    axios.get("http://localhost:5050/api/department/").then((res) => {
      setDepartments(res.data);
      localStorage.setItem("departments", JSON.stringify(res.data));
    });
  }, []);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:5050/api/department/",
        formData
      );
      if (response.status === 201) {
        const newDepartments = [...departments, response.data];
        setDepartments(newDepartments);
        localStorage.setItem("departments", JSON.stringify(newDepartments));
        setShowModal(false);
        setFormData({
          name: "",
          shortName: "",
          color: "#3b82f6",
          gradient: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
        });
      }
    } catch (error) {
      console.error("Error adding department:", error);
      alert("Error adding department");
    }
  };

  const handleDeleteDepartment = async (departmentId, departmentName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${departmentName}" department?`
      )
    ) {
      return;
    }

    try {
      const response = await axios.delete(
        `http://localhost:5050/api/department/${departmentId}`
      );
      if (response.status === 200) {
        const updatedDepartments = departments.filter(
          (dept) => dept.id !== departmentId
        );
        setDepartments(updatedDepartments);
        localStorage.setItem("departments", JSON.stringify(updatedDepartments));
      }
    } catch (error) {
      console.error("Error deleting department:", error);
      if (error.response?.data?.error) {
        alert(error.response.data.error);
      } else {
        alert("Error deleting department");
      }
    }
  };

  const handleEditDepartment = (department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      shortName: department.shortName,
      color: department.color,
    });
    setShowEditModal(true);
  };

  const handleUpdateDepartment = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(
        `http://localhost:5050/api/department/${editingDepartment.id}`,
        formData
      );
      if (response.status === 200) {
        const updatedDepartments = departments.map((dept) =>
          dept.id === editingDepartment.id
            ? {
                ...dept,
                name: response.data.name,
                shortName: response.data.short_name,
                color: formData.color,
                gradient: formData.color, // Update gradient to match new color
              }
            : dept
        );
        setDepartments(updatedDepartments);
        localStorage.setItem("departments", JSON.stringify(updatedDepartments));
        setShowEditModal(false);
        setEditingDepartment(null);
        setFormData({
          name: "",
          shortName: "",
          color: "#3b82f6",
          gradient: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
        });
      }
    } catch (error) {
      console.error("Error updating department:", error);
      alert("Error updating department");
    }
  };

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
        overflowY: "scroll",
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
          ></p>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
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

          <button
            onClick={() => {
              setFormData({
                name: "",
                shortName: "",
                color: "#ffffff",
                gradient: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
              });
              setShowModal(true);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 20px",
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              color: "#64748b",
              border: "1px solid rgba(0, 0, 0, 0.1)",
              borderRadius: "12px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
              transition: "all 0.2s ease",
            }}
            onMouseOver={(e) => {
              e.target.style.transform = "translateY(-1px)";
              e.target.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.15)";
            }}
            onMouseOut={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1)";
            }}
          >
            <span style={{ fontSize: "16px", backgroundColor: "transparent" }}>
              +
            </span>
            Add New
          </button>
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
                  position: "relative",
                }}
                onMouseEnter={() => setHoveredCard(dep.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {/* Department Header */}
                <div
                  style={{
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    marginBottom: "24px",
                  }}
                >
                  {/* Delete Button - Top Left */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteDepartment(dep.id, dep.name);
                    }}
                    style={{
                      position: "absolute",
                      top: "-8px",
                      left: "-8px",
                      width: "28px",
                      height: "28px",
                      backgroundColor: "transparent",
                      color: "#64748b",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "600",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s ease",
                      opacity: hoveredCard === dep.id ? 1 : 0,
                      transform:
                        hoveredCard === dep.id ? "scale(1)" : "scale(0.8)",
                      zIndex: 10,
                      outline: "none",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.color = "#dc2626";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = "transparent";
                      e.target.style.color = "#64748b";
                    }}
                    onFocus={(e) => {
                      e.target.style.backgroundColor = "transparent";
                      e.target.style.outline = "none";
                    }}
                    onBlur={(e) => {
                      e.target.style.backgroundColor = "transparent";
                    }}
                    onMouseDown={(e) => {
                      e.target.style.backgroundColor = "transparent";
                    }}
                    onMouseUp={(e) => {
                      e.target.style.backgroundColor = "transparent";
                    }}
                  >
                    ✕
                  </button>

                  {/* Edit Button - Top Right */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditDepartment(dep);
                    }}
                    style={{
                      position: "absolute",
                      top: "-8px",
                      right: "-8px",
                      width: "32px",
                      height: "32px",
                      backgroundColor: "transparent",
                      color: "#64748b",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "600",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s ease",
                      opacity: hoveredCard === dep.id ? 1 : 0,
                      transform:
                        hoveredCard === dep.id ? "scale(1)" : "scale(0.8)",
                      zIndex: 10,
                      outline: "none",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.color = "#3b82f6";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = "transparent";
                      e.target.style.color = "#64748b";
                    }}
                    onFocus={(e) => {
                      e.target.style.backgroundColor = "transparent";
                      e.target.style.outline = "none";
                    }}
                    onBlur={(e) => {
                      e.target.style.backgroundColor = "transparent";
                    }}
                    onMouseDown={(e) => {
                      e.target.style.backgroundColor = "transparent";
                    }}
                    onMouseUp={(e) => {
                      e.target.style.backgroundColor = "transparent";
                    }}
                  >
                    ✎
                  </button>

                  {/* Department Icon */}
                  <div
                    style={{
                      background: dep.gradient,
                      borderRadius: "12px",
                      padding: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "12px",
                    }}
                  >
                    <FaBuilding
                      style={{ color: "#ffffff", fontSize: "18px" }}
                    />
                  </div>

                  {/* Department Name and Short Name */}
                  <div style={{ textAlign: "center" }}>
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
                        fontWeight: "500",
                        color: "#64748b",
                      }}
                    >
                      {dep.shortName}
                    </div>
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
                      isAnimationActive={false}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#f1f5f9"
                        isAnimationActive={false}
                      />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                        isAnimationActive={false}
                      />
                      <YAxis
                        domain={[0, 50]}
                        ticks={[0, 10, 20, 30, 40, 50]}
                        fontSize={12}
                        tick={{ fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                        isAnimationActive={false}
                      />
                      <Tooltip
                        content={<CustomTooltip />}
                        isAnimationActive={false}
                      />
                      <Bar
                        isAnimationActive={false}
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
                          isAnimationActive={false}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}
      </div>

      {/* Add New Department Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "20px",
              padding: "32px",
              width: "90%",
              maxWidth: "500px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <h2
                style={{
                  fontSize: "24px",
                  fontWeight: "700",
                  color: "#1e293b",
                  margin: 0,
                }}
              >
                Add New Department
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#64748b",
                  padding: "4px",
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#374151",
                  }}
                >
                  Department Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                  style={{
                    width: "80%",
                    padding: "14px 16px",
                    border: "2px solid #e2e8f0",
                    borderRadius: "12px",
                    fontSize: "16px",
                    outline: "none",
                    backgroundColor: "#ffffff",
                    transition: "all 0.2s ease",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#3b82f6";
                    e.target.style.boxShadow =
                      "0 0 0 4px rgba(59, 130, 246, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e2e8f0";
                    e.target.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.05)";
                  }}
                />
              </div>

              <div
                style={{ marginBottom: "20px", display: "flex", gap: "16px" }}
              >
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                    }}
                  >
                    Short Name
                  </label>
                  <input
                    type="text"
                    value={formData.shortName}
                    onChange={(e) =>
                      handleInputChange("shortName", e.target.value)
                    }
                    required
                    style={{
                      width: "80%",
                      padding: "14px 16px",
                      border: "2px solid #e2e8f0",
                      borderRadius: "12px",
                      fontSize: "16px",
                      outline: "none",
                      backgroundColor: "#ffffff",
                      transition: "all 0.2s ease",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#3b82f6";
                      e.target.style.boxShadow =
                        "0 0 0 4px rgba(59, 130, 246, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e2e8f0";
                      e.target.style.boxShadow =
                        "0 2px 4px rgba(0, 0, 0, 0.05)";
                    }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                    }}
                  >
                    Color
                  </label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => handleInputChange("color", e.target.value)}
                    style={{
                      width: "74%",
                      height: "50px",
                      padding: "14px 16px",
                      border: "2px solid #e2e8f0",
                      borderRadius: "12px",
                      cursor: "pointer",
                      outline: "none",
                      backgroundColor: "#ffffff",
                      transition: "all 0.2s ease",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                    }}
                    onMouseEnter={(e) => {
                      e.target.click();
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "center",
                  marginTop: "24px",
                }}
              >
                <button
                  type="submit"
                  style={{
                    width: "140px",
                    padding: "12px 0",
                    background:
                      "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                    transition: "all 0.2s ease",
                    textAlign: "center",
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow =
                      "0 6px 16px rgba(16, 185, 129, 0.4)";
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow =
                      "0 4px 12px rgba(16, 185, 129, 0.3)";
                  }}
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    width: "140px",
                    padding: "12px 0",
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    color: "#64748b",
                    border: "1px solid rgba(0, 0, 0, 0.1)",
                    borderRadius: "12px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                    transition: "all 0.2s ease",
                    textAlign: "center",
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Department Modal */}
      {showEditModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowEditModal(false)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "20px",
              padding: "32px",
              width: "90%",
              maxWidth: "500px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <h2
                style={{
                  fontSize: "24px",
                  fontWeight: "700",
                  color: "#1e293b",
                  margin: 0,
                }}
              >
                Edit Department
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#64748b",
                  padding: "4px",
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateDepartment}>
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#374151",
                  }}
                >
                  Department Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                  style={{
                    width: "80%",
                    padding: "14px 16px",
                    border: "2px solid #e2e8f0",
                    borderRadius: "12px",
                    fontSize: "16px",
                    outline: "none",
                    backgroundColor: "#ffffff",
                    transition: "all 0.2s ease",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#3b82f6";
                    e.target.style.boxShadow =
                      "0 0 0 4px rgba(59, 130, 246, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e2e8f0";
                    e.target.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.05)";
                  }}
                />
              </div>

              <div
                style={{ marginBottom: "20px", display: "flex", gap: "16px" }}
              >
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                    }}
                  >
                    Short Name
                  </label>
                  <input
                    type="text"
                    value={formData.shortName}
                    onChange={(e) =>
                      handleInputChange("shortName", e.target.value)
                    }
                    required
                    style={{
                      width: "80%",
                      padding: "14px 16px",
                      border: "2px solid #e2e8f0",
                      borderRadius: "12px",
                      fontSize: "16px",
                      outline: "none",
                      backgroundColor: "#ffffff",
                      transition: "all 0.2s ease",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#3b82f6";
                      e.target.style.boxShadow =
                        "0 0 0 4px rgba(59, 130, 246, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e2e8f0";
                      e.target.style.boxShadow =
                        "0 2px 4px rgba(0, 0, 0, 0.05)";
                    }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                    }}
                  >
                    Color
                  </label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => handleInputChange("color", e.target.value)}
                    style={{
                      width: "74%",
                      height: "50px",
                      padding: "14px 16px",
                      border: "2px solid #e2e8f0",
                      borderRadius: "12px",
                      cursor: "pointer",
                      outline: "none",
                      backgroundColor: "#ffffff",
                      transition: "all 0.2s ease",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "center",
                  marginTop: "24px",
                }}
              >
                <button
                  type="submit"
                  style={{
                    width: "140px",
                    padding: "12px 0",
                    background:
                      "linear-gradient(135deg, #10b981 0%, #059669 100%",
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3 )",
                    transition: "all 0.2s ease",
                    textAlign: "center",
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow =
                      "0 6px 16px rgba(16, 185, 129, 0.3)";
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow =
                      "0 4px 12px rgba(16, 185, 129, 0.3)";
                  }}
                >
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={{
                    width: "140px",
                    padding: "12px 0",
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    color: "#64748b",
                    border: "1px solid rgba(0, 0, 0, 0.1)",
                    borderRadius: "12px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                    transition: "all 0.2s ease",
                    textAlign: "center",
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;
