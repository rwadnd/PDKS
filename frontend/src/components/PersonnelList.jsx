import { useEffect, useState } from "react";
import axios from "axios";
import {
  FiPlus,
  FiUsers,
  FiLayers,
  FiBriefcase,
  FiX,
  FiClock,
} from "react-icons/fi";
import { FaBuilding } from "react-icons/fa";

const FALLBACK_AVATAR =
  "https://ui-avatars.com/api/?name=User&background=E5E7EB&color=111827";

const PersonnelList = ({ searchTerm, filtersOpen }) => {
  const [personnel, setPersonnel] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    department: "",
    role: "",
  });
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [todayMap, setTodayMap] = useState({});
  const [onLeaveMap, setOnLeaveMap] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchPersonnel();
    fetchDepartments();
    fetchToday();
    fetchLeavesToday();
  }, []);

  // Auto refresh every 60s; pause when modal is open or tab hidden
  useEffect(() => {
    let timer;
    const tick = () => {
      if (document.hidden || showModal) return; // pause if tab hidden or modal open
      refreshSilently();
    };
    timer = setInterval(tick, 60000);
    return () => clearInterval(timer);
  }, [showModal]);

  // After we know today's check-ins, make sure anyone who checked-in is not marked as onLeave
  useEffect(() => {
    if (!todayMap) return;
    setOnLeaveMap((prev) => {
      const next = { ...prev };
      Object.keys(todayMap).forEach((id) => {
        if (todayMap[id]?.in) delete next[id];
      });
      return next;
    });
  }, [todayMap]);

  const fetchPersonnel = async (quiet = false) => {
    try {
      if (!quiet) setLoading(true);
      const res = await axios.get("http://localhost:5050/api/personnel");
      console.log("Fetched personnel:", res.data);
      // Show all personnel
      setPersonnel(res.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching personnel:", err);
      setError("Personel listesi yüklenirken hata oluştu");
    } finally {
      if (!quiet) setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await axios.get("http://localhost:5050/api/department/list");
      console.log("Fetched departments:", res.data);
      setDepartments(res.data);
    } catch (err) {
      console.error("Error fetching departments:", err);
    }
  };

  // helper: refresh silently in background
  const refreshSilently = async () => {
    try {
      await Promise.all([
        fetchPersonnel(true),
        fetchToday(),
        fetchLeavesToday(),
      ]);
      setLastUpdated(new Date());
    } catch (e) {
      // ignore background errors
    }
  };

  // Fetch today's check-in/check-out per user
  const getLocalDateString = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`; // YYYY-MM-DD local
  };

  const fetchToday = async () => {
    try {
      const today = getLocalDateString();
      const res = await axios.get(
        `http://localhost:5050/api/pdks/by-date/${today}`
      );
      // Build map: per_id -> { checkIn, checkOut }
      const map = {};
      (res.data || []).forEach((r) => {
        map[r.per_id] = {
          in: r.pdks_checkInTime,
          out: r.pdks_checkOutTime,
        };
      });
      setTodayMap(map);
    } catch (e) {
      // ignore
    }
  };

  // Fetch approved leave intervals and mark who is on leave today
  const fetchLeavesToday = async () => {
    try {
      const res = await axios.get("http://localhost:5050/api/leave");
      const rows = res.data || [];
      const todayStr = getLocalDateString();
      const map = {};
      for (const r of rows) {
        if (r.status !== "Approved") continue;
        if (!r.request_start_date || !r.request_end_date) continue;
        const startStr = String(r.request_start_date).slice(0, 10); // YYYY-MM-DD
        const endStr = String(r.request_end_date).slice(0, 10);
        if (startStr <= todayStr && todayStr <= endStr) {
          map[r.personnel_per_id] = true;
        }
      }
      setOnLeaveMap(map);
    } catch (e) {
      // ignore
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      // Generate automatic ID (max ID + 1)
      const maxId =
        personnel.length > 0
          ? Math.max(...personnel.map((p) => parseInt(p.per_id) || 0))
          : 0;
      const newId = (maxId + 1).toString();

      const formDataToSend = new FormData();
      formDataToSend.append("firstName", formData.firstName);
      formDataToSend.append("lastName", formData.lastName);
      formDataToSend.append("perId", newId);
      formDataToSend.append("department", formData.department);
      formDataToSend.append("role", formData.role);

      // IMPORTANT: backend expects "avatar"
      if (selectedImage) {
        formDataToSend.append("avatar", selectedImage);
      }

      await axios.post("http://localhost:5050/api/personnel", formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // reset
      setFormData({
        firstName: "",
        lastName: "",
        department: "",
        role: "",
      });
      setSelectedImage(null);
      setImagePreview(null);
      setShowModal(false);
      setError(null);

      // refresh list
      fetchPersonnel();
    } catch (err) {
      console.error("Error adding personnel:", err);
      setError("Yeni personel eklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setShowModal(false);
    setFormData({
      firstName: "",
      lastName: "",
      department: "",
      role: "",
    });
    setSelectedImage(null);
    setImagePreview(null);
    setError(null);
  };

  const handleDeletePersonnel = async (personId, personName) => {
    console.log("=== DELETE DEBUG ===");
    console.log("Person ID:", personId);
    console.log("Person Name:", personName);

    if (window.confirm(`Are you sure you want to deactivate ${personName}?`)) {
      console.log("User confirmed deletion");
      try {
        const response = await axios.delete(
          `http://localhost:5050/api/personnel/${personId}`
        );
        console.log("Response:", response.data);
        fetchPersonnel(); // Refresh the list
      } catch (err) {
        console.error("Error deactivating personnel:", err);
        setError("Personnel deactivation failed");
      }
    } else {
      console.log("User cancelled deletion");
    }
  };

  const normalizeAvatar = (avatar_url, person) => {
    if (!avatar_url) {
      // basic initials avatar
      const name =
        (person?.per_name ? person.per_name[0] : "") +
        (person?.per_lname ? person.per_lname[0] : "");
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(
        name || "User"
      )}&background=E5E7EB&color=111827`;
    }
    if (avatar_url.startsWith("http")) return avatar_url;
    // ensure leading slash so it works with the static /uploads mount
    return `${avatar_url.startsWith("/") ? "" : "/"}${avatar_url}`;
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Top Bar: Department Filter + Add Button */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 8,
          marginBottom: "16px",
          padding: "0 8px",
        }}
      >
        <select
          value={selectedDepartment || ""}
          onChange={(e) => setSelectedDepartment(e.target.value || null)}
          style={{
            padding: "12px 16px",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            backgroundColor: "#ffffff",
            color: "#111827",
            minWidth: 240,
            height: "40px",
            boxShadow: "0 2px 8px rgba(2, 6, 23, 0.05)",
            appearance: "none",
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='12' height='8' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236b7280' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 14px center",
            paddingRight: "40px",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "#cbd5e1";
            e.target.style.boxShadow = "0 3px 10px rgba(2, 6, 23, 0.08)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#e5e7eb";
            e.target.style.boxShadow = "0 2px 8px rgba(2, 6, 23, 0.05)";
          }}
        >
          <option value="">All Departments</option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
        {selectedDepartment && (
          <button
            onClick={() => setSelectedDepartment(null)}
            style={{
              padding: "8px 12px",
              background: "#f3f4f6",
              color: "#374151",
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Clear
          </button>
        )}
        <button
          onClick={() => {
            setShowModal(true);
            if (selectedDepartment) {
              setFormData((prev) => ({
                ...prev,
                department: selectedDepartment,
              }));
            }
          }}
          style={{
            padding: "8px 16px",
            background: "transparent",
            color: "#6b7280",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#f3f4f6";
            e.currentTarget.style.color = "#374151";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "#6b7280";
          }}
        >
          <FiPlus size={18} />
          Add New
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#dc2626",
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          {error}
        </div>
      )}

      {/* Last updated */}
      {lastUpdated && (
        <div
          style={{
            textAlign: "right",
            color: "#9ca3af",
            fontSize: 12,
            marginBottom: 6,
            paddingRight: 8,
          }}
        >
          Last updated:{" "}
          {lastUpdated.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      )}

      {/* Loading State */}
      {loading && !showModal && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "40px",
            color: "#6b7280",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "20px",
                height: "20px",
                border: "2px solid #e5e7eb",
                borderTop: "2px solid #3b82f6",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            ></div>
            Loading...
          </div>
        </div>
      )}

      {/* Personnel Grid with Department filter */}
      {!loading && (
        <div>
          {filtersOpen && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 0",
                marginBottom: 8,
              }}
            >
              {/* Placeholder for future personnel page filters */}
              <div
                style={{
                  padding: "10px 14px",
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  backgroundColor: "#ffffff",
                  color: "#111827",
                  fontSize: 13,
                }}
              >
                Filters coming soon
              </div>
            </div>
          )}
          <div className="personnel-grid">
            {personnel
              .filter((entry) =>
                selectedDepartment
                  ? entry.per_department === selectedDepartment
                  : true
              )
              .filter((entry) => {
                if (!searchTerm) return true;
                const searchLower = searchTerm.toLowerCase();
                return (
                  entry.per_name?.toLowerCase().includes(searchLower) ||
                  entry.per_lname?.toLowerCase().includes(searchLower) ||
                  entry.per_department?.toLowerCase().includes(searchLower) ||
                  entry.per_role?.toLowerCase().includes(searchLower)
                );
              })
              .map((person) => {
                const avatarSrc = normalizeAvatar(person.avatar_url, person);
                return (
                  <div key={person.per_id} style={{ position: "relative" }}>
                    <div
                      className="personnel-card person-card"
                      style={{
                        cursor: "pointer",
                        position: "relative",
                        gap: 16,
                      }}
                      onClick={() => {
                        window.history.pushState(
                          null,
                          "",
                          `/personnel/${person.per_id}`
                        );
                        window.dispatchEvent(new PopStateEvent("popstate"));
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          window.history.pushState(
                            null,
                            "",
                            `/personnel/${person.per_id}`
                          );
                          window.dispatchEvent(new PopStateEvent("popstate"));
                        }
                      }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleDeletePersonnel(
                            person.per_id,
                            `${person.per_name} ${person.per_lname}`
                          );
                        }}
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          background: "transparent",
                          color: "#6b7280",
                          border: "none",
                          borderRadius: "50%",
                          width: 32,
                          height: 32,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 16,
                          zIndex: 1000,
                          transition: "all 0.2s ease",
                          opacity: 0,
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.opacity = "1";
                          e.target.style.backgroundColor = "#f3f4f6";
                          e.target.style.color = "#374151";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.opacity = "0";
                          e.target.style.backgroundColor = "transparent";
                          e.target.style.color = "#6b7280";
                        }}
                        title="Deactivate Personnel"
                      >
                        <FiX size={16} />
                      </button>

                      <div>
                        <img
                          className="personnel-avatar"
                          src={avatarSrc}
                          alt={`${person.per_name} ${person.per_lname}`}
                          onError={(e) => {
                            e.currentTarget.src = FALLBACK_AVATAR;
                          }}
                        />
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          flex: 1,
                        }}
                      >
                        <div className="personnel-name">
                          {person.per_name} {person.per_lname}
                        </div>
                        <div className="personnel-role">
                          {person.per_department} / {person.per_role}
                        </div>
                        <div className="meta-row">
                          {onLeaveMap[person.per_id] ? (
                            <span className="chip status-chip status-onleave">
                              OnLeave
                            </span>
                          ) : todayMap[person.per_id]?.in ? (
                            <span className="chip status-chip status-active">
                              Active
                            </span>
                          ) : (
                            <span className="chip status-chip status-absent">
                              Absent
                            </span>
                          )}
                          {todayMap[person.per_id]?.in && (
                            <span className="chip time-chip">
                              <FiClock size={12} />
                              {new Date(
                                `${new Date().toISOString().split("T")[0]}T${
                                  todayMap[person.per_id].in
                                }`
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Add Personnel Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "32px",
              width: "90%",
              maxWidth: "600px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
              position: "relative",
            }}
          >
            {/* Close Button */}
            <button
              onClick={handleBack}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "none",
                border: "none",
                fontSize: "24px",
                cursor: "pointer",
                color: "#6b7280",
                padding: "4px",
              }}
            >
              ×
            </button>

            <h3
              style={{
                margin: "0 0 24px 0",
                fontSize: "20px",
                fontWeight: "600",
                color: "#1f2937",
              }}
            >
              Add New Personnel
            </h3>

            <form onSubmit={handleSubmit}>
              {/* Photo Upload */}
              <div style={{ marginBottom: "24px", textAlign: "center" }}>
                <div
                  style={{
                    width: "120px",
                    height: "120px",
                    borderRadius: "50%",
                    border: "2px dashed #d1d5db",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px auto",
                    background: imagePreview ? "none" : "#f9fafb",
                    backgroundImage: imagePreview
                      ? `url(${imagePreview})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onClick={() =>
                    document.getElementById("photo-upload").click()
                  }
                >
                  {!imagePreview && (
                    <div style={{ textAlign: "center" }}>
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#9ca3af"
                        strokeWidth="2"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7,10 12,15 17,10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#9ca3af",
                          marginTop: "4px",
                        }}
                      >
                        Upload Photo
                      </div>
                    </div>
                  )}
                </div>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: "none" }}
                />
                <button
                  type="button"
                  onClick={() =>
                    document.getElementById("photo-upload").click()
                  }
                  style={{
                    padding: "8px 16px",
                    background: "#f3f4f6",
                    color: "#374151",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "500",
                  }}
                >
                  {imagePreview ? "Change Photo" : "Choose Photo"}
                </button>
                {imagePreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImage(null);
                      setImagePreview(null);
                    }}
                    style={{
                      padding: "8px 16px",
                      background: "#fef2f2",
                      color: "#dc2626",
                      border: "1px solid #fecaca",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "500",
                      marginLeft: "8px",
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>

              <div
                style={{ display: "flex", gap: "40px", marginBottom: "16px" }}
              >
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "6px",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#374151",
                    }}
                  >
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    style={{
                      width: "93%",
                      padding: "12px 16px",
                      border: "2px solid #e2e8f0",
                      borderRadius: "8px",
                      fontSize: "14px",
                      outline: "none",
                      transition: "border-color 0.2s ease",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                    onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "6px",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#374151",
                    }}
                  >
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    style={{
                      width: "90%",
                      padding: "12px 16px",
                      border: "2px solid #e2e8f0",
                      borderRadius: "8px",
                      fontSize: "14px",
                      outline: "none",
                      transition: "border-color 0.2s ease",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                    onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                  />
                </div>
              </div>

              <div
                style={{ display: "flex", gap: "40px", marginBottom: "32px" }}
              >
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "6px",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#374151",
                    }}
                  >
                    Department *
                  </label>
                  <div style={{ position: "relative", width: "103%" }}>
                    <select
                      required
                      value={formData.department}
                      onChange={(e) =>
                        handleInputChange("department", e.target.value)
                      }
                      style={{
                        width: "103%",
                        padding: "12px 16px",
                        border: "2px solid #e2e8f0",
                        borderRadius: "8px",
                        fontSize: "14px",
                        outline: "none",
                        transition: "all 0.2s ease",
                        backgroundColor: "white",
                        cursor: "pointer",
                        appearance: "none",
                        backgroundImage:
                          'url(\'data:image/svg+xml;charset=US-ASCII,<svg width="12" height="8" xmlns="http://www.w3.org/2000/svg"><path d="M1 1l5 5 5-5" stroke="%236b7280" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>\')',
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 12px center",
                        paddingRight: "40px",
                      }}
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "6px",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#374151",
                    }}
                  >
                    Role *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.role}
                    onChange={(e) => handleInputChange("role", e.target.value)}
                    style={{
                      width: "90%",
                      padding: "12px 16px",
                      border: "2px solid #e2e8f0",
                      borderRadius: "8px",
                      fontSize: "14px",
                      outline: "none",
                      transition: "border-color 0.2s ease",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                    onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                  />
                </div>
              </div>

              {/* Modal Error */}
              {error && (
                <div
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#dc2626",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    marginBottom: "20px",
                    fontSize: "14px",
                  }}
                >
                  {error}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "flex-end",
                  marginTop: "8px",
                }}
              >
                <button
                  type="button"
                  onClick={handleBack}
                  style={{
                    padding: "12px 24px",
                    background: "#f3f4f6",
                    color: "#374151",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                    transition: "all 0.2s ease",
                    width: "100px",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#e5e7eb")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "#f3f4f6")
                  }
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: "12px 24px",
                    background: loading
                      ? "#9ca3af"
                      : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: loading ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    width: "100px",
                  }}
                  onMouseEnter={(e) => {
                    if (!loading)
                      e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    if (!loading)
                      e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {loading ? (
                    <>
                      <div
                        style={{
                          width: "16px",
                          height: "16px",
                          border: "2px solid transparent",
                          borderTop: "2px solid white",
                          borderRadius: "50%",
                          animation: "spin 1s linear infinite",
                        }}
                      />
                      Adding...
                    </>
                  ) : (
                    "Save"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSS Animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PersonnelList;
