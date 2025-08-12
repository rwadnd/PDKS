import React, { useState, useEffect } from "react";
import { FaEdit, FaUser, FaEnvelope, FaLock } from "react-icons/fa";

const DEFAULT_AVATAR = "https://randomuser.me/api/portraits/women/44.jpg";

const Profile = ({ onBack, currentUser }) => {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    username: "",
    password: "••••••••",
    avatar_url: "", // server-stored relative url like /uploads/...
  });
  const [profileImage, setProfileImage] = useState(DEFAULT_AVATAR); // display url
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  // Load profile
  useEffect(() => {
    if (!currentUser || !currentUser.id) {
      setLoading(false);
      setError("User data is not available.");
      return;
    }

    (async () => {
      try {
        const res = await fetch(`/api/profile/${currentUser.id}`);
        if (!res.ok) throw new Error("Failed to fetch user data.");
        const data = await res.json();
        if (!data.success) throw new Error(data.message || "Failed to fetch user.");

        const raw = data.user.avatar_url || "";
        const display =
          raw && !raw.startsWith("http")
            ? `${raw.startsWith("/") ? "" : "/"}${raw}`
            : raw || DEFAULT_AVATAR;

        setFormData({
          full_name: data.user.full_name || "",
          email: data.user.email || "",
          username: data.user.username || "",
          password: "••••••••",
          avatar_url: raw, // keep raw relative url
        });
        setProfileImage(display);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [currentUser]);

  const handleInputChange = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  // Upload new avatar (to /api/upload/profile) and set avatar_url
  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // optimistic preview
    const preview = URL.createObjectURL(file);
    setProfileImage(preview);

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("userId", currentUser?.id || "");

      const res = await fetch(`/api/profile/${currentUser.id}/avatar`, {
  method: "POST",
  body: fd
});
      const data = await res.json();

      if (!res.ok || !data.success) throw new Error(data.message || "Upload failed");

      // data.url like /uploads/xxx.png
      const display =
        data.url.startsWith("http") ? data.url : `${data.url.startsWith("/") ? "" : "/"}${data.url}`;

      setProfileImage(display);
      setFormData((prev) => ({ ...prev, avatar_url: data.url })); // store server url
    } catch (e) {
      console.error("Upload error:", e);
      alert("Failed to upload image.");
      // revert preview
      const raw = formData.avatar_url;
      setProfileImage(raw ? `${raw.startsWith("/") ? "" : "/"}${raw}` : DEFAULT_AVATAR);
    } finally {
      setUploading(false);
    }
  };

  // Save profile (JSON PUT /api/profile/:id)
  const handleSave = async () => {
    if (!currentUser?.id) return;
    setSaving(true);
    try {
      const payload = {
        full_name: formData.full_name,
        email: formData.email,
        username: formData.username,
        avatar_url: formData.avatar_url || "",
      };
      if (formData.password && formData.password !== "••••••••") {
        payload.password = formData.password;
      }

      const res = await fetch(`/api/profile/${currentUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(`Error: ${data.message || "Failed to update"}`);
        return;
      }

      alert("Profile updated successfully!");

      const raw = data.user.avatar_url || "";
      const display =
        raw && !raw.startsWith("http")
          ? `${raw.startsWith("/") ? "" : "/"}${raw}`
          : raw || DEFAULT_AVATAR;

      setFormData({
        full_name: data.user.full_name || "",
        email: data.user.email || "",
        username: data.user.username || "",
        password: "••••••••",
        avatar_url: raw,
      });
      setProfileImage(display);
    } catch (e) {
      console.error("Save error:", e);
      alert("An error occurred while saving the profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading profile...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div
      style={{
        height: "100vh",
        backgroundColor: "#f6f8fb",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          padding: 0,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          margin: "auto",
          width: "100%",
          height: "95vh",
          minHeight: "calc(100vh - 240px)",
          display: "flex",
          flexDirection: "column",
          overflowX: "hidden",
          overflowY: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ padding: "20px 20px", borderBottom: "1px solid #f0f0f0" }}>
          <h2 style={{ fontSize: 20, color: "#0C2440", margin: 0 }}>Edit Profile</h2>
        </div>

        {/* Content */}
        <div
          style={{
            display: "flex",
            gap: "60px",
            padding: 30,
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "flex-start",
          }}
        >
          {/* Avatar */}
          <div style={{ width: 210, textAlign: "center" }}>
            <div style={{ position: "relative", display: "inline-block", marginBottom: 10 }}>
              <img
                src={profileImage}
                alt="Profile"
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "3px solid #f0f0f0",
                  cursor: "pointer",
                  opacity: uploading ? 0.6 : 1,
                  transition: "opacity .2s",
                }}
                onClick={() => document.getElementById("profile-image-input").click()}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 6,
                  right: 6,
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  backgroundColor: "#333",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#ffffff",
                }}
                onClick={() => document.getElementById("profile-image-input").click()}
                title="Change photo"
              >
                <FaEdit size={12} />
              </div>
              <input
                id="profile-image-input"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: "none" }}
              />
              {uploading && (
                <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>Uploading…</div>
              )}
            </div>
          </div>

          {/* Form */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 24, maxWidth: 400 }}>
            {/* Name */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#555",
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Your Name
              </label>
              <div style={{ position: "relative" }}>
                <FaUser style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#999" }} />
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange("full_name", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "14px 12px 14px 40px",
                    border: "1px solid #e0e0e0",
                    borderRadius: 6,
                    fontSize: 14,
                    outline: "none",
                    transition: "border-color 0.2s ease",
                  }}
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#555",
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                User Name
              </label>
              <div style={{ position: "relative" }}>
                <FaUser style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#999" }} />
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange("username", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "14px 12px 14px 40px",
                    border: "1px solid #e0e0e0",
                    borderRadius: 6,
                    fontSize: 14,
                    outline: "none",
                    transition: "border-color 0.2s ease",
                  }}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#555",
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Email
              </label>
              <div style={{ position: "relative" }}>
                <FaEnvelope style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#999" }} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "14px 12px 14px 40px",
                    border: "1px solid #e0e0e0",
                    borderRadius: 6,
                    fontSize: 14,
                    outline: "none",
                    transition: "border-color 0.2s ease",
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#555",
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Password
              </label>
              <div style={{ position: "relative" }}>
                <FaLock style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#999" }} />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "14px 12px 14px 40px",
                    border: "1px solid #e0e0e0",
                    borderRadius: 6,
                    fontSize: 14,
                    outline: "none",
                    transition: "border-color 0.2s ease",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save */}
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "16px 40px", flexShrink: 0 }}>
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            style={{
              backgroundColor: saving || uploading ? "#7a869a" : "#0C2440",
              color: "#ffffff",
              border: "none",
              padding: "12px 24px",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 500,
              cursor: saving || uploading ? "not-allowed" : "pointer",
              transition: "background-color 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (!(saving || uploading)) e.target.style.backgroundColor = "#555";
            }}
            onMouseLeave={(e) => {
              if (!(saving || uploading)) e.target.style.backgroundColor = "#0C2440";
            }}
          >
            {saving ? "Saving..." : uploading ? "Uploading..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
