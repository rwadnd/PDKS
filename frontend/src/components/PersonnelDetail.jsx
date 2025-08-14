import { useEffect, useState, useRef } from "react";
import "../App.css";
import axios from "axios";
import { FiClock, FiActivity, FiTrendingUp, FiCalendar, FiChevronLeft } from "react-icons/fi";

const PersonnelDetail = ({ person, onBack, onUpdate }) => {
  if (!person) return null;

  const [avatarUrl, setAvatarUrl] = useState(person.avatar_url || "");
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);   // NEW: for preview
  const fileInputRef = useRef(); // EKLENDİ

  const normalizeAvatar = (url, p) => {
    if (!url) {
      const initials =
        (p?.per_name?.[0] || "") + (p?.per_lname?.[0] || "");
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(
        initials || "?"

      )}&background=E5E7EB&color=111827`;
    }
    // If url is relative (starts with /uploads), prepend server address
    if (url.startsWith("/uploads")) {
      return `http://localhost:5050${url}`;
    }
    if (url.startsWith("http")) return url;
    return `${url.startsWith("/") ? "" : "/"}${url}`; // serve from /uploads/...
  };

  if (!person.avatar_url) {
    axios
      .get(`http://localhost:5050/api/personnel/${person.per_id}`)
      .then((res) => {
        // res.data should include avatar_url
        if (res.data?.avatar_url) setAvatarUrl(res.data.avatar_url);
      })
      .catch((err) => console.error("Failed to fetch personnel details:", err));
  }

  const [records, setRecords] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    per_name: person.per_name || "",
    per_lname: person.per_lname || "",
    per_role: person.per_role || "",
    per_department: person.per_department || "",
    avatar_url: person.avatar_url || "", // EKLENDİ
  });

  const [departments, setDepartments] = useState([]);

  // NEW: handle image selection and preview
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Optimistic preview
    const preview = URL.createObjectURL(file);
    setImagePreview(preview);


    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("userId", person.per_id);

      const res = await fetch(`/api/profile/${person.per_id}/avatar`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();

      if (!res.ok || !data.success) throw new Error(data.message || "Upload failed");

      const display =
        data.url.startsWith("http") ? data.url : `${data.url.startsWith("/") ? "" : "/"}${data.url}`;

      setAvatarUrl(display);
      setImagePreview(display);

      setEditForm((prev) => ({ ...prev, avatar_url: data.url }));
    } catch (e) {
      alert("Failed to upload image.");
      setImagePreview(null);

    } finally {
      setUploading(false);
    }
  };

  // Fetch departments for dropdown
  const fetchDepartments = async () => {
    try {
      const response = await axios.get("http://localhost:5050/api/department/list");
      setDepartments(response.data);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  useEffect(() => {
    fetchDepartments();
    axios
      .get(`http://localhost:5050/api/pdks/${person.per_id}`)
      .then((res) => setRecords(res.data))
      .catch((err) => console.error(err));
  }, [person]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({
      per_name: person.per_name || "",
      per_lname: person.per_lname || "",
      per_role: person.per_role || "",
      per_department: person.per_department || "",
      avatar_url: person.avatar_url || "", // avatarı eski haline döndür!
    });

    setImagePreview(null);
    setAvatarUrl(person.avatar_url || ""); // avatarı eski haline döndür!
  };

  const handleSave = async () => {
    try {
      setUploading(true);
      const payload = {
        firstName: editForm.per_name,
        lastName: editForm.per_lname,
        perId: person.per_id,
        department: editForm.per_department,
        role: editForm.per_role,
        avatar_url: editForm.avatar_url, // Doğrudan editForm'dan al!
      };
      const res = await axios.put(
        `http://localhost:5050/api/personnel/${person.per_id}`,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );
      setIsEditing(false);
      setUploading(false);

      setImagePreview(null);

      // Avatar güncellemesi: Eğer avatar_url boşsa default avatar göster
      if (!editForm.avatar_url) {
        setAvatarUrl(""); // avatarUrl'yi boş yap, böylece default avatar gösterilecek
      } else {
        setAvatarUrl(res.data?.person?.avatar_url || "");
      }

      if (onUpdate) {
        onUpdate({
          ...person,
          ...editForm,
          avatar_url: res.data?.person?.avatar_url || "",
        });
      }
    } catch (error) {
      setUploading(false);
      console.error("Error updating personnel:", error);
      alert("Güncelleme sırasında hata oluştu!");
    }
  };

  const handleInputChange = (field, value) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const todayString = new Date().toISOString().split("T")[0];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayDay = today.getDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6
  const daysSinceMonday = (todayDay + 6) % 7; // converts Sun→6, Mon→0, Tue→1, etc.
  const lastMonday = new Date(today);
  lastMonday.setDate(today.getDate() - daysSinceMonday);
  lastMonday.setHours(0, 0, 0, 0);

  // Get the first day in the heatmap (52 weeks ago from last Monday)
  const startDate = new Date(lastMonday);
  startDate.setDate(startDate.getDate() - 51 * 7);

  const todayRecord = records.find((rec) => {
    const recordDate = rec.pdks_date?.split(" ")[0];
    return recordDate === todayString;
  });
  const formattedCheckIn =
    todayRecord?.pdks_checkInTime && todayRecord.pdks_checkInTime !== "00:00:00"
      ? new Date(
        `${todayRecord.pdks_date}T${todayRecord.pdks_checkInTime}`
      ).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
      : "-";

  const formattedCheckOut =
    todayRecord?.pdks_checkOutTime &&
      todayRecord.pdks_checkOutTime !== "00:00:00"
      ? new Date(
        `${todayRecord.pdks_date}T${todayRecord.pdks_checkOutTime}`
      ).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
      : "-";

  const getTimeAtWork = () => {
    if (
      !todayRecord?.pdks_checkInTime ||
      todayRecord.pdks_checkInTime === "0000-00-00 00:00:00"
    ) {
      return "-"; // No check-in
    }

    const checkIn = new Date(
      `${todayRecord.pdks_date}T${todayRecord.pdks_checkInTime}`
    );
    const checkOutValid =
      todayRecord.pdks_checkOutTime &&
      todayRecord.pdks_checkOutTime !== "0000-00-00 00:00:00";

    const end = checkOutValid
      ? new Date(`${todayRecord.pdks_date}T${todayRecord.pdks_checkOutTime}`)
      : new Date(); // Use now if no check-out
    const diffMs = end - checkIn;

    if (isNaN(diffMs) || diffMs < 0) return "-";

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getProductivityScore = () => {
    const now = new Date();
    const currentDay = now.getDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6

    // Adjust to most recent Monday
    const monday = new Date(now);
    const offset = currentDay === 0 ? -6 : 1 - currentDay;
    monday.setDate(now.getDate() + offset);
    monday.setHours(0, 0, 0, 0);

    // 🔢 Total worked hours (Mon → now)
    const totalWorkedHours = records
      .filter((rec) => {
        const date = new Date(rec.pdks_date);
        return date >= monday && date <= now;
      })
      .reduce((sum, rec) => {
        if (!rec.pdks_checkInTime || rec.pdks_checkInTime === "00:00:00")
          return sum;

        const inTime = new Date(`${rec.pdks_date}T${rec.pdks_checkInTime}`);
        const outTimeValid =
          rec.pdks_checkOutTime && rec.pdks_checkOutTime !== "00:00:00";
        const outTime = outTimeValid
          ? new Date(`${rec.pdks_date}T${rec.pdks_checkOutTime}`)
          : now;

        if (isNaN(inTime) || isNaN(outTime) || outTime < inTime) return sum;
        const diff = (outTime - inTime) / (1000 * 60 * 60); // in hours
        return sum + diff;
      }, 0);

    // ⏳ Required hours = 9h per weekday up to now
    let requiredHours = 0;
    for (let i = 0; i <= 6; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      if (day > now) break; // Don't count future days

      const isWeekday = day.getDay() >= 1 && day.getDay() <= 5;
      if (!isWeekday) continue;

      if (day.toDateString() === now.toDateString()) {
        // If today, only add hours up to current time
        const hoursSoFar = now.getHours() + now.getMinutes() / 60;
        requiredHours += Math.min(hoursSoFar, 9);
      } else {
        requiredHours += 9;
      }
    }

    if (requiredHours === 0) return "0%";

    const percentage = (totalWorkedHours / requiredHours) * 100;
    return `${Math.round(percentage)}%`;
  };

  function toLocalISODate(date) {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`; // "YYYY-MM-DD"
  }

  const getMonthlyAbsenceCount = (records) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed: January = 0

    // Step 1: Build a Set of valid check-in dates
    const presentDates = new Set();

    for (const rec of records) {
      const hasValidCheckIn =
        rec.pdks_checkInTime &&
        rec.pdks_checkInTime !== "00:00:00" &&
        rec.pdks_checkInTime !== "0000-00-00 00:00:00";

      if (hasValidCheckIn && rec.pdks_date) {
        const datePart = rec.pdks_date.split(" ")[0]; // "YYYY-MM-DD"
        presentDates.add(datePart);
      }
    }

    // Step 2: Count expected workdays in current month up to today
    let absenceCount = 0;

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const current = new Date(year, month, day);

      if (current > today) break;

      const dayOfWeek = current.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip Sundays & Saturdays

      const dateStr = current.toISOString().split("T")[0];

      if (!presentDates.has(dateStr)) {
        absenceCount++;
      }
    }

    return absenceCount - 1;
  };

  const checkInDatesSet = new Set(
    records
      .filter(
        (rec) =>
          rec.pdks_checkInTime &&
          rec.pdks_checkInTime !== "00:00:00" &&
          rec.pdks_date
      )
      .map((rec) => rec.pdks_date) // use only the DATE part
  );

  return (
    <div
      style={{
        height: "100vh",
        overflowY: "auto",
        padding: "1px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          background: "transparent",
          borderRadius: "24px",
          padding: "20px 60px",
          marginBottom: "20px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <button
          onClick={onBack}
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            padding: "12px",
            backgroundColor: "transparent",
            color: "#374151",
            border: "none",
            borderRadius: "12px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            transition: "all 0.2s ease",
            zIndex: 10,
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "translateY(-2px)";
            e.target.style.backgroundColor = "rgba(0, 0, 0, 0.05)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.backgroundColor = "transparent";
          }}
        >
          <FiChevronLeft size={20} color="#64748b" />
        </button>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
            flex: "1",
          }}
        >
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "relative" }}>
              <img
                src={
                  isEditing
                    ? imagePreview || normalizeAvatar(avatarUrl)
                    : normalizeAvatar(avatarUrl)
                }
                alt={person.per_name}
                style={{
                  width: "100px",
                  height: "100px",
                  borderRadius: "50%",
                  border: "2px solid rgba(255, 255, 255, 0.9)",
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
                  objectFit: "cover",
                }}
              />
              {/* Edit icon: sadece düzenleme modunda değilken göster */}
              {!isEditing && (
                <div
                  onClick={handleEdit}
                  style={{
                    position: "absolute",
                    bottom: "8px",
                    right: "3px",
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                    transition: "all 0.2s ease",
                    border: "2px solid #ffffff",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.1)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(0, 0, 0, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow =
                      "0 2px 8px rgba(0, 0, 0, 0.2)";
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </div>
              )}
            </div>
          </div>
          {/* Upload button: only show in edit mode, below avatar, above name */}
          {isEditing && (
            <div style={{ marginTop: "8px", marginBottom: "8px", display: "flex", justifyContent: "center", gap: "10px" }}>
              <label
                style={{
                  display: "inline-block",
                  width: "140px",
                  padding: "8px 0",
                  background: "#3b82f6",
                  color: "#fff",
                  borderRadius: "8px",
                  cursor: uploading ? "not-allowed" : "pointer",
                  fontSize: "13px",
                  fontWeight: "600",
                  opacity: uploading ? 0.6 : 1,
                  border: "none",
                  boxSizing: "border-box",
                  height: "40px",
                  lineHeight: "24px",
                  textAlign: "center",
                }}
              >
                {uploading ? "Uploading..." : "Upload Image"}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  disabled={uploading}
                  onChange={handleImageChange}
                />
              </label>
              {/* Eğer mevcutta fotoğraf varsa veya yeni bir fotoğraf seçildiyse remove butonu göster */}
              {(imagePreview || avatarUrl) && (
                <button
                  type="button"
                  style={{
                    width: "140px",
                    padding: "8px 0",
                    background: "#fef2f2",
                    color: "#dc2626",
                    border: "1px solid #fecaca",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: "600",
                    height: "40px",
                    lineHeight: "24px",
                    boxSizing: "border-box",
                    textAlign: "center",
                  }}
                  onClick={() => {
                    setImagePreview(null);                     // clear UI preview

                    setEditForm((prev) => ({ ...prev, avatar_url: null })); // IMPORTANT: null (not "")
                    setAvatarUrl("");                          // show initials avatar in UI
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                >
                  Remove
                </button>
              )}
            </div>
          )}
          <div style={{ textAlign: "center" }}>
            <h2
              style={{
                margin: 0,
                fontSize: "24px",
                fontWeight: "700",
                color: "#000000",
                marginBottom: "8px",
              }}
            >
              {person.per_name} {person.per_lname}
            </h2>
            <div
              style={{
                fontSize: "16px",
                color: "#64748b",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <span style={{ color: "#374151" }}>
                {person.per_department || "IT"}
              </span>
              <span style={{ color: "#94a3b8" }}>/</span>
              <span style={{ color: "#374151" }}>{person.per_role}</span>
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "0px",
          }}
        >
          {isEditing ? (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "17px" }}
            >
              <div style={{ display: "flex", gap: "16px" }}>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      fontSize: "14px",
                      color: "#374151",
                      marginBottom: "8px",
                      display: "block",
                      fontWeight: "600",
                    }}
                  >
                    First Name
                  </label>
                  <input
                    type="text"
                    value={editForm.per_name}
                    onChange={(e) =>
                      handleInputChange("per_name", e.target.value)
                    }
                    style={{
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
                      e.target.style.transform = "translateY(-1px)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e2e8f0";
                      e.target.style.boxShadow =
                        "0 2px 4px rgba(0, 0, 0, 0.05)";
                      e.target.style.transform = "translateY(0)";
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      fontSize: "14px",
                      color: "#374151",
                      marginBottom: "8px",
                      display: "block",
                      fontWeight: "600",
                    }}
                  >
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={editForm.per_lname}
                    onChange={(e) =>
                      handleInputChange("per_lname", e.target.value)
                    }
                    style={{
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
                      e.target.style.transform = "translateY(-1px)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e2e8f0";
                      e.target.style.boxShadow =
                        "0 2px 4px rgba(0, 0, 0, 0.05)";
                      e.target.style.transform = "translateY(0)";
                    }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: "16px" }}>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      fontSize: "14px",
                      color: "#374151",
                      marginBottom: "8px",
                      display: "block",
                      fontWeight: "600",
                    }}
                  >
                    Role
                  </label>
                  <input
                    type="text"
                    value={editForm.per_role}
                    onChange={(e) =>
                      handleInputChange("per_role", e.target.value)
                    }
                    style={{
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
                      e.target.style.transform = "translateY(-1px)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e2e8f0";
                      e.target.style.boxShadow =
                        "0 2px 4px rgba(0, 0, 0, 0.05)";
                      e.target.style.transform = "translateY(0)";
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      fontSize: "14px",
                      color: "#374151",
                      marginBottom: "8px",
                      display: "block",
                      fontWeight: "600",
                    }}
                  >
                    Department
                  </label>
                  <select
                    value={editForm.per_department}
                    onChange={(e) =>
                      handleInputChange("per_department", e.target.value)
                    }
                    style={{
                      padding: "14px 16px",
                      border: "2px solid #e2e8f0",
                      borderRadius: "12px",
                      fontSize: "16px",
                      outline: "none",
                      backgroundColor: "#ffffff",
                      transition: "all 0.2s ease",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                      width: "100%",
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
              <div style={{ display: "flex", gap: "16px" }}>
                <div style={{ flex: 1 }}></div>
                <div style={{ flex: 1 }}></div>
              </div>

              {/* Save/Cancel Buttons */}
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "center",
                  marginTop: "24px",
                }}
              >
                <button
                  onClick={handleSave}
                  disabled={uploading}
                  style={{
                    width: "140px", // Sabit genişlik
                    padding: "12px 0",
                    background:
                      "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    cursor: uploading ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                    transition: "all 0.2s ease",
                    textAlign: "center",
                  }}
                  onMouseOver={(e) => {
                    if (!uploading) {
                      e.target.style.transform = "translateY(-2px)";
                      e.target.style.boxShadow =
                        "0 6px 16px rgba(16, 185, 129, 0.4)";
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!uploading) {
                      e.target.style.transform = "translateY(0)";
                      e.target.style.boxShadow =
                        "0 4px 12px rgba(16, 185, 129, 0.3)";
                    }
                  }}
                >
                  {uploading ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={uploading}
                  style={{
                    width: "140px", // Sabit genişlik
                    padding: "12px 0",
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    color: "#64748b",
                    border: "1px solid rgba(0, 0, 0, 0.1)",
                    borderRadius: "12px",
                    cursor: uploading ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                    transition: "all 0.2s ease",
                    textAlign: "center",
                  }}
                  onMouseOver={(e) => {
                    if (!uploading) {
                      e.target.style.transform = "translateY(-2px)";
                      e.target.style.backgroundColor = "#f8fafc";
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!uploading) {
                      e.target.style.transform = "translateY(0)";
                      e.target.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
                    }
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <div className="stat-cards">
        <div className="stat-card" style={{ position: "relative" }}>
          <div className="stat-title">Check-in/Check-out</div>
          <div className="stat-value">
            {formattedCheckIn} - {formattedCheckOut}
          </div>
          <div className="stat-desc up" style={{ color: "#9ca3af" }}>
            Today
          </div>
          <div
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              backgroundColor: "#e9d5ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#7c3aed",
              fontSize: "20px",
            }}
          >
            <FiClock size={20} />
          </div>
        </div>
        <div className="stat-card" style={{ position: "relative" }}>
          <div className="stat-title">Time at Work</div>
          <div className="stat-value">{getTimeAtWork()}</div>
          <div className="stat-desc up" style={{ color: "#9ca3af" }}>
            Today
          </div>
          <div
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              backgroundColor: "#d1fae5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#059669",
              fontSize: "20px",
            }}
          >
            <FiActivity size={20} />
          </div>
        </div>
        <div className="stat-card" style={{ position: "relative" }}>
          <div className="stat-title">Productivity Score</div>
          <div className="stat-value">{getProductivityScore()}</div>
          <div className="stat-desc up" style={{ color: "#9ca3af" }}>
            Weekly
          </div>
          <div
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              backgroundColor: "#fed7aa",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#d97706",
              fontSize: "20px",
            }}
          >
            <FiTrendingUp size={20} />
          </div>
        </div>
        <div className="stat-card" style={{ position: "relative" }}>
          <div className="stat-title">Total Absences</div>
          <div className="stat-value">{getMonthlyAbsenceCount(records)}</div>
          <div className="stat-desc up" style={{ color: "#9ca3af" }}>
            Monthly
          </div>
          <div
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              backgroundColor: "#fecaca",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#dc2626",
              fontSize: "20px",
            }}
          >
            <FiCalendar size={20} />
          </div>
        </div>
      </div>
      {/* Attendance Chart */}
      <div
        style={{
          background: "#fff",
          borderRadius: 15,
          padding: 30,
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "flex-start",
            justifyContent: "center",
          }}
        >
          {/* Gün isimleri */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginRight: 8,
            }}
          >
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div
                key={day}
                style={{
                  height: 15,
                  fontSize: 12,
                  color: "#6b7280",
                  textAlign: "right",
                  width: 30,
                  fontWeight: "500",
                }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Attendance Grid */}
          <div
            style={{
              display: "flex",
              gap: 4,
              flex: 1,
              overflowX: "auto",
              paddingBottom: 5,
            }}
          >
            {Array.from({ length: 52 }).map((_, weekIdx) => (
              <div
                key={weekIdx}
                style={{ display: "flex", flexDirection: "column", gap: 2 }}
              >
                {Array.from({ length: 7 }).map((_, dayIdx) => {
                  const yesterday = new Date();
                  yesterday.setDate(today.getDate() - 1);
                  yesterday.setHours(0, 0, 0, 0);
                  const cellDate = new Date(startDate);
                  cellDate.setDate(
                    startDate.getDate() + (weekIdx * 7 + dayIdx)
                  );
                  cellDate.setHours(0, 0, 0, 0);

                  if (cellDate > yesterday) {
                    // ✅ Skip rendering future boxes altogether (optional)
                    return (
                      <div key={dayIdx} style={{ width: 12, height: 12 }} />
                    );
                  }

                  const dateStr = toLocalISODate(cellDate);
                  const isWeekend =
                    cellDate.getDay() === 0 || cellDate.getDay() === 6;

                  let status;

                  if (cellDate > yesterday || isWeekend) {
                    status = "no-data"; // Hide future and weekends
                  } else if (checkInDatesSet.has(dateStr)) {
                    status = "present";
                  } else {
                    status = "absent";
                  }

                  const colors = {
                    present: { bg: "#10b981", border: "#059669" },
                    absent: { bg: "#ef4444", border: "#dc2626" },
                    "no-data": { bg: "#f3f4f6", border: "#e5e7eb" },
                  };

                  return (
                    <div
                      key={dayIdx}
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 2,
                        background: colors[status].bg,
                        border: `1px solid ${colors[status].border}`,
                        transition: "all 0.15s ease",
                        cursor: "pointer",
                      }}
                      title={`${cellDate.toDateString()} - ${status}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Ay isimleri */}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 8,
            marginLeft: 32,
            overflowX: "auto",
            paddingBottom: 2,
          }}
        >
          {[
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ].map((month) => (
            <div
              key={month}
              style={{
                minWidth: 48,
                fontSize: 10,
                color: "#6b7280",
                textAlign: "center",
                fontWeight: "500",
              }}
            >
              {month}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 12,
            paddingTop: 12,
            borderTop: "1px solid #f3f4f6",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 2,
                background: "#f3f4f6",
                border: "1px solid #e5e7eb",
              }}
            ></div>
            <span style={{ fontSize: 11, color: "#6b7280", fontWeight: "500" }}>
              No Data
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 2,
                background: "#10b981",
                border: "1px solid #059669",
              }}
            ></div>
            <span style={{ fontSize: 11, color: "#6b7280", fontWeight: "500" }}>
              Present
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 2,
                background: "#ef4444",
                border: "1px solid #dc2626",
              }}
            ></div>
            <span style={{ fontSize: 11, color: "#6b7280", fontWeight: "500" }}>
              Absent
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonnelDetail;
