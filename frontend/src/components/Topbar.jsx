import "../App.css";
import "./Topbar.css";
import { FaSearch, FaBell, FaFilter } from "react-icons/fa";
import { useEffect, useState } from "react";
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
  onChangePage,
  leaveRequests,
  setLeaveRequests,
  showFilterButton,
  filtersOpen,
  onToggleFilters,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [user, setUser] = useState({});

  // Fetch user once (or when currentUser changes)
  useEffect(() => {
    if (!currentUser?.id) return;
    axios
      .get(`http://localhost:5050/api/profile/${currentUser.id}`)
      .then((res) => setUser(res.data.user))
      .catch((err) => console.error("Failed to load profile:", err));
  }, [currentUser?.id]);

  // Close dropdowns when clicking outside
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
        // reserved for settings dropdown if added later
      }
    };

    if (showDropdown || showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown, showNotifications]);

  const DEFAULT_AVATAR = "https://randomuser.me/api/portraits/women/44.jpg";
  const avatarSrc = user?.avatar_url
    ? user.avatar_url.startsWith("http")
      ? user.avatar_url
      : `${user.avatar_url.startsWith("/") ? "" : "/"}${user.avatar_url}`
    : DEFAULT_AVATAR;

  // Approve/Reject leave requests (optimistic update)
  const approveRequest = async (id) => {
    try {
      const approvedRequest = leaveRequests.find((r) => r.request_id === id);
      setLeaveRequests((prev) => {
        const filtered = prev.filter((r) => r.request_id !== id);
        return [{ ...approvedRequest, status: "Approved" }, ...filtered];
      });
      await axios.put(`http://localhost:5050/api/leave/${id}`, {
        status: "Approved",
      });
    } catch (error) {
      console.error("Failed to approve request:", error);
    }
  };

  const rejectRequest = async (id) => {
    try {
      const rejectedRequest = leaveRequests.find((r) => r.request_id === id);
      setLeaveRequests((prev) => {
        const filtered = prev.filter((r) => r.request_id !== id);
        return [{ ...rejectedRequest, status: "Rejected" }, ...filtered];
      });
      await axios.put(`http://localhost:5050/api/leave/${id}`, {
        status: "Rejected",
      });
    } catch (error) {
      console.error("Failed to reject request:", error);
    }
  };

  const formatDate = (dateString) =>
    format(new Date(dateString), "dd MMM yyyy");

  const handleLogout = () => {
    onLogout();
    setShowDropdown(false);
  };

  const pendingCount = leaveRequests.filter(
    (r) => r.status === "Pending"
  ).length;

  return (
    <header className="topbar">
      <div className="topbar__inner">
        {/* Left - Dashboard */}
        <div
          className="topbar__title"
          onClick={onToggleSidebar}
          style={{ marginRight: 100 }}
        >
          {activePage ? activePage.charAt(0).toUpperCase() + activePage.slice(1) : "Dashboard"}
        </div>

        {/* Center - Search + Filter */}
        {!hideSearch && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 75,
              marginLeft: 20,
            }}
          >
            <div className="topbar__searchWrap">
              <div className="topbar__searchIcon">
                <FaSearch />
              </div>
              <input
                className="topbar__searchInput"
                type="text"
                placeholder="Search for something"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  style={{
                    position: "absolute",
                    right: "-40px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#9ca3af",
                    fontSize: "14px",
                    padding: "4px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
            {showFilterButton && (
              <button
                type="button"
                className="notifBtn"
                onClick={onToggleFilters}
                aria-label="Toggle filters"
                title={filtersOpen ? "Hide filters" : "Show filters"}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: filtersOpen ? "#2563eb" : "#ef4444",
                  background: "#f8fafc",
                  outline: "none",
                  boxShadow: "none",
                  marginLeft: -8,
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.outline = "none";
                  e.currentTarget.style.boxShadow = "none";
                }}
                onFocus={(e) => {
                  e.currentTarget.style.outline = "none";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <FaFilter />
              </button>
            )}
          </div>
        )}

        {/* Right - Icons + User */}
        <div className="topbar__right">
          {/* Notifications button */}
          <button
            type="button"
            className="notifBtn"
            onClick={() => setShowNotifications((s) => !s)}
            aria-label="Notifications"
            style={{ marginLeft: 120 }}
          >
            <FaBell />
            {pendingCount > 0 && <span className="notifBtn__badge" />}
          </button>
        </div>

        {/* Notifications Dropdown */}
        {showNotifications && (
          <div id="notifications-container" className="notifs">
            <div className="notifs__header">
              <h3 className="notifs__title">Leave Requests</h3>
              <button
                type="button"
                className="notifs__viewAll"
                onClick={() => {
                  onChangePage("leave-requests");
                  setShowNotifications(false);
                }}
              >
                View All
              </button>
            </div>

            <div className="notifs__list">
              {pendingCount === 0 ? (
                <div className="notifs__empty">
                  <div className="notifs__emptyTitle">No pending requests</div>
                  <div className="notifs__emptyText">
                    There are currently no leave requests in the system.
                  </div>
                </div>
              ) : (
                [...leaveRequests]
                  .filter((r) => r.status === "Pending")
                  .sort(
                    (a, b) =>
                      new Date(b.request_date) - new Date(a.request_date)
                  )
                  .map((request) => {
                    const start = new Date(request.request_start_date);
                    const end = new Date(request.request_end_date);
                    const days =
                      Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
                    return (
                      <div key={request.request_id} className="notifItem">
                        <div className="notifItem__row">
                          <div className="notifItem__name">
                            {request.per_name} {request.per_lname}
                          </div>
                          <span className="notifItem__type">Leave Request</span>
                        </div>
                        <div className="notifItem__meta">
                          {formatDate(request.request_start_date)} -{" "}
                          {formatDate(request.request_end_date)} • {days}{" "}
                          {days === 1 ? "day" : "days"}
                        </div>
                        <div className="notifItem__actions">
                          <button
                            type="button"
                            className="btn btn--approve"
                            onClick={() => approveRequest(request.request_id)}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="btn btn--reject"
                            onClick={() => rejectRequest(request.request_id)}
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

        {/* User + Dropdown */}
        <div id="user-dropdown-container" className="userDropdown">
          <button
            type="button"
            className={`user ${showDropdown ? "is-open" : ""}`}
            onClick={() => setShowDropdown((s) => !s)}
          >
            <img className="user__img" src={avatarSrc} alt="User" />
            <div className="user__info">
              <div className="user__name">
                {user ? user.full_name : "Loading..."}
              </div>
              <div className="user__role">{user?.role || "Admin"}</div>
            </div>
            <div className="user__caret">▼</div>
          </button>

          {showDropdown && (
            <div className="menu">
              <button
                type="button"
                className="menuItem"
                onClick={() => {
                  onChangePage("profile");
                  setShowDropdown(false);
                }}
              >
                Profile
              </button>

              <button
                type="button"
                className="menuItem menuItem--danger"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
