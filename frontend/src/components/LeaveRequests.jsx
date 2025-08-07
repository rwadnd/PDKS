import React, { useState, useEffect } from "react";
import {
  FaCheck,
  FaTimes,
  FaClock,
  FaUser,
  FaCalendarAlt,
} from "react-icons/fa";
import axios from "axios";

const LeaveRequests = ({
  searchTerm = "",
  leaveRequests,
  setLeaveRequests,
}) => {
  const [filter, setFilter] = useState("Pending"); // all, pending, approved, rejected
  const [loading, setLoading] = useState(false);

  const approveRequest = async (id) => {
    try {
      const approvedRequest = leaveRequests.find(
        (request) => request.request_id === id
      );

      setLeaveRequests((prev) => {
        const filtered = prev.filter((request) => request.request_id !== id);
        return [{ ...approvedRequest, status: "Approved" }, ...filtered];
      });

      await axios.put(`http://localhost:5050/api/leave/${id}`, {
        status: "Approved",
      });
    } catch (error) {
      console.error("Failed to approve leave request:", error);
      // Optionally show error to user
    }
  };

  const rejectRequest = async (id) => {
    try {
      const rejectedRequest = leaveRequests.find(
        (request) => request.request_id === id
      );

      setLeaveRequests((prev) => {
        const filtered = prev.filter((request) => request.request_id !== id);
        return [{ ...rejectedRequest, status: "Rejected" }, ...filtered];
      });

      await axios.put(`http://localhost:5050/api/leave/${id}`, {
        status: "Rejected",
      });
    } catch (error) {
      console.error("Failed to reject leave request:", error);
      // Optionally show error to user
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "#f59e0b";
      case "Approved":
        return "#10b981";
      case "Rejected":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Pending":
        return <FaClock style={{ color: "#f59e0b" }} />;
      case "Approved":
        return <FaCheck style={{ color: "#10b981" }} />;
      case "Rejected":
        return <FaTimes style={{ color: "#ef4444" }} />;
      default:
        return <FaClock style={{ color: "#6b7280" }} />;
    }
  };

  const filteredRequests = leaveRequests.filter((request) => {
    // Status filter
    if (filter === "Pending" && request.status !== "Pending") return false;
    if (filter === "Approved" && request.status !== "Approved") return false;
    if (filter === "Rejected" && request.status !== "Rejected") return false;

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        (request.per_name &&
          String(request.per_name).toLowerCase().includes(searchLower)) ||
        (request.personnel_per_id &&
          String(request.personnel_per_id)
            .toLowerCase()
            .includes(searchLower)) ||
        (request.department &&
          String(request.department).toLowerCase().includes(searchLower)) ||
        (request.request_type &&
          String(request.request_type).toLowerCase().includes(searchLower))
      );
    }

    return true;
  });

  const pendingCount = leaveRequests.filter(
    (request) => request.status === "Pending"
  ).length;
  const approvedCount = leaveRequests.filter(
    (request) => request.status === "Approved"
  ).length;
  const rejectedCount = leaveRequests.filter(
    (request) => request.status === "Rejected"
  ).length;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "400px",
        }}
      >
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "16px",
        width: "100%",
        maxWidth: "100vw",
        overflowX: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "700",
              color: "#111827",
              margin: "0 0 8px 0",
            }}
          >
            Leave Requests
          </h1>
        </div>
      </div>

      {/* Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "12px",
          marginBottom: "32px",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "16px",
            padding: "24px",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "0",
              left: "0",
              width: "100%",
              height: "4px",
              background: "linear-gradient(90deg, #f59e0b, #fbbf24)",
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "800",
                  color: "#f59e0b",
                  marginBottom: "4px",
                }}
              >
                {pendingCount}
              </div>
              <div
                style={{
                  fontSize: "16px",
                  color: "#6b7280",
                  fontWeight: "500",
                }}
              >
                Pending Requests
              </div>
            </div>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                backgroundColor: "#fef3c7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FaClock style={{ fontSize: "20px", color: "#f59e0b" }} />
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "16px",
            padding: "24px",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "0",
              left: "0",
              width: "100%",
              height: "4px",
              background: "linear-gradient(90deg, #10b981, #34d399)",
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "800",
                  color: "#10b981",
                  marginBottom: "4px",
                }}
              >
                {approvedCount}
              </div>
              <div
                style={{
                  fontSize: "16px",
                  color: "#6b7280",
                  fontWeight: "500",
                }}
              >
                Approved Requests
              </div>
            </div>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                backgroundColor: "#d1fae5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FaCheck style={{ fontSize: "20px", color: "#10b981" }} />
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "16px",
            padding: "24px",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "0",
              left: "0",
              width: "100%",
              height: "4px",
              background: "linear-gradient(90deg, #ef4444, #f87171)",
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "800",
                  color: "#ef4444",
                  marginBottom: "4px",
                }}
              >
                {rejectedCount}
              </div>
              <div
                style={{
                  fontSize: "16px",
                  color: "#6b7280",
                  fontWeight: "500",
                }}
              >
                Rejected Requests
              </div>
            </div>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                backgroundColor: "#fee2e2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FaTimes style={{ fontSize: "20px", color: "#ef4444" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "32px",
          borderBottom: "1px solid #e5e7eb",
          paddingBottom: "20px",
          flexWrap: "wrap",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <button
          onClick={() => setFilter("all")}
          style={{
            padding: "6px 12px",
            backgroundColor: filter === "all" ? "#3b82f6" : "#f3f4f6",
            color: filter === "all" ? "white" : "#374151",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: "500",
            transition: "all 0.2s ease",
          }}
        >
          All ({leaveRequests.length})
        </button>
        <button
          onClick={() => setFilter("Pending")}
          style={{
            padding: "6px 12px",
            backgroundColor: filter === "Pending" ? "#f59e0b" : "#f3f4f6",
            color: filter === "Pending" ? "white" : "#374151",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: "500",
            transition: "all 0.2s ease",
          }}
        >
          Pending ({pendingCount})
        </button>
        <button
          onClick={() => setFilter("Approved")}
          style={{
            padding: "6px 12px",
            backgroundColor: filter === "Approved" ? "#10b981" : "#f3f4f6",
            color: filter === "Approved" ? "white" : "#374151",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: "500",
            transition: "all 0.2s ease",
          }}
        >
          Approved ({approvedCount})
        </button>
        <button
          onClick={() => setFilter("Rejected")}
          style={{
            padding: "6px 12px",
            backgroundColor: filter === "Rejected" ? "#ef4444" : "#f3f4f6",
            color: filter === "Rejected" ? "white" : "#374151",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: "500",
            transition: "all 0.2s ease",
          }}
        >
          Rejected ({rejectedCount})
        </button>
      </div>

      {/* Leave Requests List */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          width: "100%",
        }}
      >
        {filteredRequests.length === 0 || leaveRequests.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "48px",
              color: "#6b7280",
            }}
          >
            <FaCalendarAlt
              style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.5 }}
            />
            <h3
              style={{
                fontSize: "20px",
                fontWeight: "600",
                marginBottom: "8px",
                color: "#374151",
              }}
            >
              No leave requests found
            </h3>
            <p style={{ fontSize: "14px", marginBottom: "4px" }}>
              There are currently no leave requests in the system.
            </p>
          </div>
        ) : (
          filteredRequests.map((request) => (
            <div
              key={request.request_id}
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "24px",
                position: "relative",
                boxShadow: "none",
              }}
            >
              {/* Status Badge */}
              <div
                style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 8px",
                  backgroundColor: getStatusColor(request.status) + "20",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: "500",
                  color: getStatusColor(request.status),
                }}
              >
                {getStatusIcon(request.status)}
                {request.status.charAt(0).toUpperCase() +
                  request.status.slice(1)}
              </div>

              {/* Employee Info */}
              <div style={{ marginBottom: "16px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "8px",
                  }}
                >
                  <FaUser style={{ color: "#6b7280", fontSize: "16px" }} />
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: "600",
                      color: "#111827",
                      margin: "0",
                    }}
                  >
                    {request.per_name + " " + request.per_lname}
                  </h3>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "16px",
                    fontSize: "14px",
                    color: "#6b7280",
                  }}
                >
                  <span>ID: {request.personnel_per_id}</span>
                  <span>Department: {request.per_department}</span>
                </div>
              </div>

              {/* Leave Details */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "12px",
                  marginBottom: "16px",
                  width: "100%",
                }}
              >
                <div style={{ flex: "1 1 120px", minWidth: "120px" }}>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#6b7280",
                      marginBottom: "4px",
                    }}
                  >
                    Leave Type
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#111827",
                    }}
                  >
                    {request.request_type}
                  </div>
                </div>
                <div style={{ flex: "1 1 120px", minWidth: "120px" }}>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#6b7280",
                      marginBottom: "4px",
                    }}
                  >
                    Duration
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#111827",
                    }}
                  >
                    {formatDate(request.request_start_date)} -{" "}
                    {formatDate(request.request_end_date)}
                  </div>
                </div>
                <div style={{ flex: "1 1 80px", minWidth: "80px" }}>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#6b7280",
                      marginBottom: "4px",
                    }}
                  >
                    Days
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#111827",
                    }}
                  >
                    {(() => {
                      const start = new Date(request.request_start_date);
                      const end = new Date(request.request_end_date);
                      const days = Math.ceil(
                        (end - start) / (1000 * 60 * 60 * 24)
                      );
                      return `${days} day${days !== 1 ? "s" : ""}`;
                    })()}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#6b7280",
                      marginBottom: "4px",
                    }}
                  >
                    Submitted
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#111827",
                    }}
                  >
                    {formatDate(request.request_date)}
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div style={{ marginBottom: "16px" }}>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    marginBottom: "4px",
                  }}
                >
                  Reason
                </div>
                <div style={{ fontSize: "14px", color: "#374151" }}>
                  {request.request_other}
                </div>
              </div>

              {/* Action Buttons */}
              {request.status === "Pending" && (
                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    onClick={() => approveRequest(request.request_id)}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#10b981",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <FaCheck />
                    Approve
                  </button>
                  <button
                    onClick={() => rejectRequest(request.request_id)}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#ef4444",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <FaTimes />
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LeaveRequests;
