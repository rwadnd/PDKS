import "../App.css";
import { FaSearch, FaCog, FaBell, FaBars } from "react-icons/fa";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { format } from "date-fns";

const Topbar = ({
  activePage,
  searchTerm,
  onSearchChange,
  hideSearch,
  currentUser,
  onLogout,
  onToggleSidebar,
  sidebarOpen,
  onChangePage,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const dropdownContainer = document.getElementById(
        "user-dropdown-container"
      );
      const notificationsContainer = document.getElementById(
        "notifications-container"
      );
      const settingsContainer = document.getElementById("settings-container");

      if (dropdownContainer && !dropdownContainer.contains(event.target)) {
        setShowDropdown(false);
      }

      if (
        notificationsContainer &&
        !notificationsContainer.contains(event.target)
      ) {
        setShowNotifications(false);
      }

      if (settingsContainer && !settingsContainer.contains(event.target)) {
        // Settings dropdown varsa buraya eklenebilir
      }
    };

    if (showDropdown || showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown, showNotifications]);

  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch leave requests
  useEffect(() => {
    axios
      .get("http://localhost:5050/api/leave")
      .then((res) => {
        setLeaveRequests(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch leave requests:", err);
        setLoading(false);
      });
  }, []);

  // Approve request
  const approveRequest = async (id) => {
    try {
      setLeaveRequests((prev) =>
        prev.map((req) =>
          req.request_id === id ? { ...req, status: "Approved" } : req
        )
      );
      await axios.put(`http://localhost:5050/api/leave/${id}`, {
        status: "Approved",
      });
    } catch (error) {
      console.error("Failed to approve request:", error);
    }
  };

  // Reject request
  const rejectRequest = async (id) => {
    try {
      setLeaveRequests((prev) =>
        prev.map((req) =>
          req.request_id === id ? { ...req, status: "Rejected" } : req
        )
      );
      await axios.put(`http://localhost:5050/api/leave/${id}`, {
        status: "Rejected",
      });
    } catch (error) {
      console.error("Failed to reject request:", error);
    }
  };

  // Format date
  const formatDate = (dateString) =>
    format(new Date(dateString), "dd MMM yyyy");

  if (loading) {
    return <div style={{ padding: "20px" }}>Loading leave requests...</div>;
  }

  const handleLogout = () => {
    onLogout();
    setShowDropdown(false);
  };

  return (
    <header className="topbar">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 0px",
          width: "100%",
          background: "transparent",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        {/* Left side - Dashboard Text */}
        <div
          style={{
            fontSize: "28px",
            fontWeight: "700",
            color: "#1e3a8a",
            cursor: "pointer",
            padding: "6px 0px",
            borderRadius: "12px",
            transition: "all 0.2s ease",
            letterSpacing: "-0.5px",
          }}
          onClick={onToggleSidebar}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "#f1f5f9";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "transparent";
          }}
        >
          Dashboard
        </div>

        {/* Center - Search Input */}
        {!hideSearch && (
          <div
            style={{
              position: "relative",
              width: "450px",
              margin: "0 auto",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: "20px",
                top: "54%",
                transform: "translateY(-50%)",
                color: "lightgray",
                fontSize: "14px",
              }}
            >
              <FaSearch />
            </div>
            <input
              type="text"
              placeholder="Search for something"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{
                width: "100%",
                padding: "14px 16px 14px 44px",
                border: "1px solid #e2e8f0",
                borderRadius: "24px",
                fontSize: "15px",
                color: "#374151",
                backgroundColor: "#f8fafc",
                outline: "none",
                transition: "all 0.2s ease",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#3b82f6";
                e.target.style.backgroundColor = "#ffffff";
                e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e2e8f0";
                e.target.style.backgroundColor = "#f8fafc";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>
        )}
        {/* Right side - Icons and User */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginLeft: "auto",
            marginRight: "20px",
          }}
        >
          {/* Settings Icon */}
          <div
            id="settings-container"
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              backgroundColor: "#f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s ease",
              color: "#3b82f6",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#e0e7ff";
              e.target.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#f1f5f9";
              e.target.style.transform = "scale(1)";
            }}
          >
            <FaCog />
          </div>

          {/* Notifications Icon */}
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              backgroundColor: "#f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s ease",
              color: "#ef4444",
              position: "relative",
            }}
            onClick={() => {
              console.log("Notifications clicked!", showNotifications);
              setShowNotifications(!showNotifications);
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#fee2e2";
              e.target.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#f1f5f9";
              e.target.style.transform = "scale(1)";
            }}
          >
            <FaBell />
            {/* Notification Badge */}
            <div
              style={{
                position: "absolute",
                top: "6px",
                right: "6px",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#ef4444",
              }}
            />
          </div>
        </div>
        {/* Notifications Dropdown - Outside the icons container */}
        {showNotifications && (
          <div
            id="notifications-container"
            style={{
              position: "fixed",
              top: "80px",
              right: "24px",
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
              minWidth: "320px",
              zIndex: 1001,
              maxHeight: "400px",
              overflow: "auto",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #f3f4f6",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#1e293b",
                  margin: "0",
                }}
              >
                Leave Requests
              </h3>
              <button
                onClick={() => {
                  onChangePage("leave-requests");
                  setShowNotifications(false);
                }}
                style={{
                  fontSize: "11px",
                  color: "#3b82f6",
                  backgroundColor: "transparent",
                  border: "1px solid #3b82f6",
                  cursor: "pointer",
                  fontWeight: "500",
                  padding: "3px 8px",
                  borderRadius: "6px",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#3b82f6";
                  e.target.style.color = "#ffffff";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "transparent";
                  e.target.style.color = "#3b82f6";
                }}
              >
                View All
              </button>
            </div>

            {/* Notifications List (Dynamic Leave Requests) */}
            <div style={{ padding: "8px 0" }}>
              {leaveRequests.filter((r) => r.status === "Pending").length ===
              0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "20px",
                    color: "#6b7280",
                  }}
                >
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      marginBottom: "4px",
                    }}
                  >
                    No pending requests
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      opacity: 0.7,
                    }}
                  >
                    There are currently no leave requests in the system.
                  </div>
                </div>
              ) : (
                leaveRequests
                  .filter((r) => r.status === "Pending") // Only show pending requests as notifications
                  .map((request) => {
                    const start = new Date(request.request_start_date);
                    const end = new Date(request.request_end_date);
                    const days =
                      Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
                    return (
                      <div
                        key={request.request_id}
                        style={{
                          padding: "12px 20px",
                          borderBottom: "1px solid #f9fafb",
                          cursor: "pointer",
                          transition: "background-color 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#f8fafc";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginBottom: "8px",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: "500",
                              color: "#1e293b",
                            }}
                          >
                            {request.per_name + " " + request.per_lname}
                          </div>
                          <span
                            style={{
                              fontSize: "11px",
                              color: "#6b7280",
                              backgroundColor: "#fef3c7",
                              padding: "2px 6px",
                              borderRadius: "8px",
                            }}
                          >
                            Leave Request
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#6b7280",
                            marginBottom: "8px",
                          }}
                        >
                          {formatDate(request.request_start_date)} -{" "}
                          {formatDate(request.request_end_date)} • {days}{" "}
                          {days === 1 ? "day" : "days"}
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            style={{
                              padding: "6px 12px",
                              fontSize: "12px",
                              fontWeight: "500",
                              backgroundColor: "#10b981",
                              color: "#ffffff",
                              border: "none",
                              borderRadius: "24px",
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                            }}
                            onClick={() => approveRequest(request.request_id)}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = "#059669";
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = "#10b981";
                            }}
                          >
                            Approve
                          </button>
                          <button
                            style={{
                              padding: "6px 12px",
                              fontSize: "12px",
                              fontWeight: "500",
                              backgroundColor: "#ef4444",
                              color: "#ffffff",
                              border: "none",
                              borderRadius: "24px",
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                            }}
                            onClick={() => rejectRequest(request.request_id)}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = "#dc2626";
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = "#ef4444";
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        )}
        {/* User Info with Dropdown */}
        <div
          id="user-dropdown-container"
          style={{
            position: "relative",
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
              cursor: "pointer",
              padding: "10px 16px",
              borderRadius: "20px",
              backgroundColor: "transparent",
              transition: "all 0.2s ease",
              boxShadow: "none",
            }}
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <img
              src="https://randomuser.me/api/portraits/women/44.jpg"
              alt="User"
              style={{
                width: "45px",
                height: "45px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid #e5e7eb",
              }}
            />
            <div>
              <div
                style={{
                  fontWeight: "600",
                  fontSize: "14px",
                  color: "#111827",
                  lineHeight: "1.2",
                }}
              >
                {currentUser?.full_name ||
                  currentUser?.username ||
                  "Admin User"}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  lineHeight: "1.2",
                }}
              >
                {currentUser?.role || "Admin"}
              </div>
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "#6b7280",
                transition: "transform 0.2s ease",
                transform: showDropdown ? "rotate(180deg)" : "rotate(0deg)",
              }}
            >
              ▼
            </div>
          </div>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: "0",
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "16px",
                boxShadow:
                  "0 8px 25px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.06)",
                minWidth: "150px",
                zIndex: 1000,
                marginTop: "8px",
              }}
            >
              <div
                style={{
                  padding: "8px 16px",
                  fontSize: "14px",
                  color: "#374151",
                  borderBottom: "1px solid #f3f4f6",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "background-color 0.2s ease",
                }}
                onClick={() => {
                  onChangePage("profile");
                  setShowDropdown(false);
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#f8fafc";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "transparent";
                }}
              >
                Profile
              </div>

              <div
                style={{
                  padding: "8px 16px",
                  fontSize: "14px",
                  color: "#dc2626",
                  cursor: "pointer",
                  fontWeight: "500",
                  transition: "background-color 0.2s ease",
                }}
                onClick={handleLogout}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#fef2f2";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "transparent";
                }}
              >
                Logout
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
