import React, { useState, useEffect } from "react";
import {
  FaCheck,
  FaTimes,
  FaClock,
  FaUser,
  FaCalendarAlt,
} from "react-icons/fa";

const LeaveRequests = ({ searchTerm = "" }) => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [filter, setFilter] = useState("all"); // all, pending, approved, rejected
  const [loading, setLoading] = useState(true);

  // Mock leave requests data - real app would fetch from API
  useEffect(() => {
    const mockRequests = [
      {
        id: 1,
        employeeName: "Ahmet Yılmaz",
        employeeId: "EMP001",
        department: "IT",
        leaveType: "Annual Leave",
        startDate: "2024-01-20",
        endDate: "2024-01-25",
        days: 5,
        reason: "Family vacation",
        status: "pending",
        submittedDate: "2024-01-10",
        priority: "normal",
      },
      {
        id: 2,
        employeeName: "Ayşe Demir",
        employeeId: "EMP002",
        department: "HR",
        leaveType: "Sick Leave",
        startDate: "2024-01-18",
        endDate: "2024-01-19",
        days: 2,
        reason: "Medical appointment",
        status: "approved",
        submittedDate: "2024-01-15",
        priority: "high",
      },
      {
        id: 3,
        employeeName: "Mehmet Koç",
        employeeId: "EMP003",
        department: "Sales",
        leaveType: "Personal Leave",
        startDate: "2024-01-22",
        endDate: "2024-01-22",
        days: 1,
        reason: "Personal matters",
        status: "rejected",
        submittedDate: "2024-01-12",
        priority: "normal",
      },
      {
        id: 4,
        employeeName: "Burak Aslan",
        employeeId: "EMP004",
        department: "Marketing",
        leaveType: "Annual Leave",
        startDate: "2024-02-01",
        endDate: "2024-02-05",
        days: 4,
        reason: "Holiday trip",
        status: "pending",
        submittedDate: "2024-01-14",
        priority: "normal",
      },
      {
        id: 5,
        employeeName: "Can Arslan",
        employeeId: "EMP005",
        department: "Finance",
        leaveType: "Sick Leave",
        startDate: "2024-01-16",
        endDate: "2024-01-17",
        days: 2,
        reason: "Not feeling well",
        status: "pending",
        submittedDate: "2024-01-15",
        priority: "high",
      },
    ];

    setLeaveRequests(mockRequests);
    setLoading(false);
  }, []);

  const approveRequest = (id) => {
    setLeaveRequests((prev) =>
      prev.map((request) =>
        request.id === id ? { ...request, status: "approved" } : request
      )
    );
  };

  const rejectRequest = (id) => {
    setLeaveRequests((prev) =>
      prev.map((request) =>
        request.id === id ? { ...request, status: "rejected" } : request
      )
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#f59e0b";
      case "approved":
        return "#10b981";
      case "rejected":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <FaClock style={{ color: "#f59e0b" }} />;
      case "approved":
        return <FaCheck style={{ color: "#10b981" }} />;
      case "rejected":
        return <FaTimes style={{ color: "#ef4444" }} />;
      default:
        return <FaClock style={{ color: "#6b7280" }} />;
    }
  };

  const filteredRequests = leaveRequests.filter((request) => {
    // Status filter
    if (filter === "pending" && request.status !== "pending") return false;
    if (filter === "approved" && request.status !== "approved") return false;
    if (filter === "rejected" && request.status !== "rejected") return false;

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        request.employeeName.toLowerCase().includes(searchLower) ||
        request.employeeId.toLowerCase().includes(searchLower) ||
        request.department.toLowerCase().includes(searchLower) ||
        request.leaveType.toLowerCase().includes(searchLower) ||
        request.reason.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  const pendingCount = leaveRequests.filter(
    (request) => request.status === "pending"
  ).length;
  const approvedCount = leaveRequests.filter(
    (request) => request.status === "approved"
  ).length;
  const rejectedCount = leaveRequests.filter(
    (request) => request.status === "rejected"
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
          <p
            style={{
              fontSize: "16px",
              color: "#6b7280",
              margin: "0",
            }}
          >
            Manage employee leave requests
          </p>
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
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.target.style.boxShadow = "0 8px 25px rgba(0, 0, 0, 0.1)";
          }}
          onMouseLeave={(e) => {
            e.target.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.05)";
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
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.target.style.boxShadow = "0 8px 25px rgba(0, 0, 0, 0.1)";
          }}
          onMouseLeave={(e) => {
            e.target.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.05)";
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
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.target.style.boxShadow = "0 8px 25px rgba(0, 0, 0, 0.1)";
          }}
          onMouseLeave={(e) => {
            e.target.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.05)";
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
          onClick={() => setFilter("pending")}
          style={{
            padding: "6px 12px",
            backgroundColor: filter === "pending" ? "#f59e0b" : "#f3f4f6",
            color: filter === "pending" ? "white" : "#374151",
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
          onClick={() => setFilter("approved")}
          style={{
            padding: "6px 12px",
            backgroundColor: filter === "approved" ? "#10b981" : "#f3f4f6",
            color: filter === "approved" ? "white" : "#374151",
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
          onClick={() => setFilter("rejected")}
          style={{
            padding: "6px 12px",
            backgroundColor: filter === "rejected" ? "#ef4444" : "#f3f4f6",
            color: filter === "rejected" ? "white" : "#374151",
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
        {filteredRequests.length === 0 ? (
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
            <p>No leave requests found</p>
          </div>
        ) : (
          filteredRequests.map((request) => (
            <div
              key={request.id}
              style={{
                backgroundColor: "transparent",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "24px",
                transition: "all 0.2s ease",
                position: "relative",
                boxShadow: "none",
              }}
              onMouseEnter={(e) => {
                e.target.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.target.style.boxShadow = "none";
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
                    {request.employeeName}
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
                  <span>ID: {request.employeeId}</span>
                  <span>Department: {request.department}</span>
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
                    {request.leaveType}
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
                    {formatDate(request.startDate)} -{" "}
                    {formatDate(request.endDate)}
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
                    {request.days} day{request.days > 1 ? "s" : ""}
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
                    {formatDate(request.submittedDate)}
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
                  {request.reason}
                </div>
              </div>

              {/* Action Buttons */}
              {request.status === "pending" && (
                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    onClick={() => approveRequest(request.id)}
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
                    onClick={() => rejectRequest(request.id)}
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
