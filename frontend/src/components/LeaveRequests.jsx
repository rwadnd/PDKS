import { useState } from "react";
import { FaCheck, FaTimes, FaClock, FaUser, FaCalendarAlt } from "react-icons/fa";
import axios from "axios";
import "./LeaveRequests.css";

const LeaveRequests = ({ searchTerm = "", leaveRequests, setLeaveRequests }) => {
  const [filter, setFilter] = useState("Pending"); // "all" | "Pending" | "Approved" | "Rejected"

  const approveRequest = async (id) => {
    try {
      const approvedRequest = leaveRequests.find((r) => r.request_id === id);
      setLeaveRequests((prev) => {
        const filtered = prev.filter((r) => r.request_id !== id);
        return [{ ...approvedRequest, status: "Approved" }, ...filtered];
      });
      await axios.put(`http://localhost:5050/api/leave/${id}`, { status: "Approved" });
    } catch (error) {
      console.error("Failed to approve leave request:", error);
    }
  };

  const rejectRequest = async (id) => {
    try {
      const rejectedRequest = leaveRequests.find((r) => r.request_id === id);
      setLeaveRequests((prev) => {
        const filtered = prev.filter((r) => r.request_id !== id);
        return [{ ...rejectedRequest, status: "Rejected" }, ...filtered];
      });
      await axios.put(`http://localhost:5050/api/leave/${id}`, { status: "Rejected" });
    } catch (error) {
      console.error("Failed to reject leave request:", error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Approved":
        return <FaCheck />;
      case "Rejected":
        return <FaTimes />;
      case "Pending":
      default:
        return <FaClock />;
    }
  };

  const filteredRequests = leaveRequests.filter((request) => {
    if (filter === "Pending" && request.status !== "Pending") return false;
    if (filter === "Approved" && request.status !== "Approved") return false;
    if (filter === "Rejected" && request.status !== "Rejected") return false;

    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      return (
        (request.per_name && String(request.per_name).toLowerCase().includes(s)) ||
        (request.personnel_per_id && String(request.personnel_per_id).toLowerCase().includes(s)) ||
        (request.department && String(request.department).toLowerCase().includes(s)) ||
        (request.request_type && String(request.request_type).toLowerCase().includes(s))
      );
    }
    return true;
  });

  const sortedRequests = [...filteredRequests].sort(
    (a, b) => new Date(b.request_date) - new Date(a.request_date)
  );

  const pendingCount = leaveRequests.filter((r) => r.status === "Pending").length;
  const approvedCount = leaveRequests.filter((r) => r.status === "Approved").length;
  const rejectedCount = leaveRequests.filter((r) => r.status === "Rejected").length;

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  return (
    <div className="lr">
      {/* Header */}
      <div className="lr__header">
        <h1 className="lr__title">Leave Requests</h1>
      </div>

      {/* Stats Cards */}
      <div className="lr__stats">
        <div className="statCard statCard--pending">
          <div className="statCard__bar" />
          <div className="statCard__row">
            <div>
              <div className="statCard__value statCard__value--pending">{pendingCount}</div>
              <div className="statCard__label">Pending Requests</div>
            </div>
            <div className="statCard__icon statCard__icon--pending">
              <FaClock />
            </div>
          </div>
        </div>

        <div className="statCard statCard--approved">
          <div className="statCard__bar" />
          <div className="statCard__row">
            <div>
              <div className="statCard__value statCard__value--approved">{approvedCount}</div>
              <div className="statCard__label">Approved Requests</div>
            </div>
            <div className="statCard__icon statCard__icon--approved">
              <FaCheck />
            </div>
          </div>
        </div>

        <div className="statCard statCard--rejected">
          <div className="statCard__bar" />
          <div className="statCard__row">
            <div>
              <div className="statCard__value statCard__value--rejected">{rejectedCount}</div>
              <div className="statCard__label">Rejected Requests</div>
            </div>
            <div className="statCard__icon statCard__icon--rejected">
              <FaTimes />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="lr__filters">
        <button
          className={`filterBtn filterBtn--all ${filter === "all" ? "is-active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All ({leaveRequests.length})
        </button>
        <button
          className={`filterBtn filterBtn--pending ${filter === "Pending" ? "is-active" : ""}`}
          onClick={() => setFilter("Pending")}
        >
          Pending ({pendingCount})
        </button>
        <button
          className={`filterBtn filterBtn--approved ${filter === "Approved" ? "is-active" : ""}`}
          onClick={() => setFilter("Approved")}
        >
          Approved ({approvedCount})
        </button>
        <button
          className={`filterBtn filterBtn--rejected ${filter === "Rejected" ? "is-active" : ""}`}
          onClick={() => setFilter("Rejected")}
        >
          Rejected ({rejectedCount})
        </button>
      </div>

      {/* List */}
      <div className="lr__list">
        {sortedRequests.length === 0 || leaveRequests.length === 0 ? (
          <div className="empty">
            <FaCalendarAlt className="empty__icon" />
            <h3 className="empty__title">No leave requests found</h3>
            <p className="empty__text">There are currently no leave requests in the system.</p>
          </div>
        ) : (
          sortedRequests.map((request) => {
            const statusClass =
              request.status === "Approved"
                ? "approved"
                : request.status === "Rejected"
                ? "rejected"
                : "pending";

            const start = new Date(request.request_start_date);
            const end = new Date(request.request_end_date);
            const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

            return (
              <div key={request.request_id} className="reqCard">
                {/* Status Badge */}
                <div className={`reqCard__badge reqCard__badge--${statusClass}`}>
                  {getStatusIcon(request.status)}
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </div>

                {/* Employee Info */}
                <div className="reqCard__person">
                  <FaUser className="reqCard__userIcon" />
                  <h3 className="reqCard__name">{request.per_name + " " + request.per_lname}</h3>
                </div>
                <div className="reqCard__meta">
                  <span>ID: {request.personnel_per_id}</span>
                  <span>Department: {request.per_department}</span>
                </div>

                {/* Details */}
                <div className="reqCard__details">
                  <div className="detail">
                    <div className="detail__label">Leave Type</div>
                    <div className="detail__value">{request.request_type}</div>
                  </div>
                  <div className="detail">
                    <div className="detail__label">Duration</div>
                    <div className="detail__value">
                      {formatDate(request.request_start_date)} - {formatDate(request.request_end_date)}
                    </div>
                  </div>
                  <div className="detail">
                    <div className="detail__label">Days</div>
                    <div className="detail__value">
                      {days} day{days !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <div className="detail">
                    <div className="detail__label">Submitted</div>
                    <div className="detail__value">{formatDate(request.request_date)}</div>
                  </div>
                </div>

                {/* Reason */}
                <div className="reqCard__reason">
                  <div className="detail__label">Reason</div>
                  <div className="reqCard__reasonText">{request.request_other}</div>
                </div>

                {/* Actions */}
                {request.status === "Pending" && (
                  <div className="reqCard__actions">
                    <button className="btn btn--approve" onClick={() => approveRequest(request.request_id)}>
                      <FaCheck />
                      <span>Approve</span>
                    </button>
                    <button className="btn btn--reject" onClick={() => rejectRequest(request.request_id)}>
                      <FaTimes />
                      <span>Reject</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LeaveRequests;
