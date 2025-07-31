import React, { useState } from "react";
import "../App.css";

const Topbar = ({
  activePage,
  searchTerm,
  onSearchChange,
  hideSearch,
  currentUser,
  onLogout,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    onLogout();
    setShowDropdown(false);
  };

  return (
    <header className="topbar">
      <div
        style={{
          display: "flex",
          justifyContent:
            activePage === "dashboard"
              ? "flex-end"
              : hideSearch
              ? "flex-end"
              : "space-between",
          alignItems: "center",
          padding: "2px 12px",
          width: "100%",
        }}
      >
        {/* Search Input - Dashboard'da gösterme ve Personnel Detail'da gizle */}
        {activePage !== "dashboard" && !hideSearch && (
          <div
            style={{
              position: "relative",
              width: "350px",
            }}
          >
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "1px solid rgb(195, 210, 231)",
                borderRadius: "10px",
                fontSize: "14px",
                color: "#374151",
                backgroundColor: "#ffffff",
                outline: "none",
                transition: "border-color 0.2s ease",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#3b82f6";
                e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#d1d5db";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>
        )}
        {/* User Info with Dropdown */}
        <div
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
              padding: "8px",
              borderRadius: "8px",
              transition: "background-color 0.2s ease",
            }}
            onClick={() => setShowDropdown(!showDropdown)}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#f3f4f6";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "transparent";
            }}
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
                borderRadius: "8px",
                boxShadow:
                  "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                minWidth: "150px",
                zIndex: 1000,
                marginTop: "4px",
              }}
            >
              <div
                style={{
                  padding: "8px 16px",
                  fontSize: "14px",
                  color: "#374151",
                  borderBottom: "1px solid #f3f4f6",
                  fontWeight: "500",
                }}
              >
                Profile
              </div>
              <div
                style={{
                  padding: "8px 16px",
                  fontSize: "14px",
                  color: "#374151",
                  borderBottom: "1px solid #f3f4f6",
                  fontWeight: "500",
                }}
              >
                Settings
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
