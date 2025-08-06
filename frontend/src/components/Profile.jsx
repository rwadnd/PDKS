import React, { useState } from "react";
import { FaEdit, FaUser, FaEnvelope, FaLock } from "react-icons/fa";

const Profile = ({ onBack, currentUser }) => {
  const [formData, setFormData] = useState({
    name: currentUser?.full_name || "Charlene Reed",
    email: currentUser?.email || "charlenereed@gmail.com",
    username: currentUser?.username || "Charlene Reed",
    password: "••••••••",
  });
  const [profileImage, setProfileImage] = useState(
    "https://randomuser.me/api/portraits/women/44.jpg"
  );

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    // Save logic here
    alert("Profile updated successfully!");
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

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
      {/* Main Content */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          padding: "0",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          margin: "auto",
          width: "100%",
          height: "95vh",
          minHeight: "calc(100vh - 240px)",
          display: "flex",
          flexDirection: "column",
          overflowX: "hidden",
          overflowY: "hidden",
          // transform: "translate(-50%, -50%)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 20px",
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <h2
            style={{
              fontSize: "20px",
              color: "#0C2440",
              margin: "0",
            }}
          >
            Edit Profile
          </h2>
        </div>

        {/* Profile Content */}
        <div
          style={{
            display: "flex",
            gap: "60px",
            padding: "30px 30px 30px 30px",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "flex-start",
          }}
        >
          {/* Left Column - Avatar */}
          <div
            style={{
              width: "210px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                position: "relative",
                display: "inline-block",
                marginBottom: "10px",
              }}
            >
              <img
                src={profileImage}
                alt="Profile"
                style={{
                  width: "120px",
                  height: "120px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "3px solid #f0f0f0",
                  cursor: "pointer",
                }}
                onClick={() =>
                  document.getElementById("profile-image-input").click()
                }
              />
              <div
                style={{
                  position: "absolute",
                  bottom: "6px",
                  right: "6px",
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  backgroundColor: "#333",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#ffffff",
                }}
                onClick={() =>
                  document.getElementById("profile-image-input").click()
                }
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
            </div>
          </div>

          {/* Right Column - Form */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              maxWidth: "400px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "500",
                  color: "#555",
                  marginBottom: "6px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Your Name
              </label>
              <div style={{ position: "relative" }}>
                <FaUser
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#999",
                  }}
                />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "14px 12px 14px 40px",
                    border: "1px solid #e0e0e0",
                    borderRadius: "6px",
                    fontSize: "14px",
                    outline: "none",
                    transition: "border-color 0.2s ease",
                  }}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "500",
                  color: "#555",
                  marginBottom: "6px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                User Name
              </label>
              <div style={{ position: "relative" }}>
                <FaUser
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#999",
                  }}
                />
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    handleInputChange("username", e.target.value)
                  }
                  style={{
                    width: "100%",
                    padding: "14px 12px 14px 40px",
                    border: "1px solid #e0e0e0",
                    borderRadius: "6px",
                    fontSize: "14px",
                    outline: "none",
                    transition: "border-color 0.2s ease",
                  }}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "500",
                  color: "#555",
                  marginBottom: "6px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Email
              </label>
              <div style={{ position: "relative" }}>
                <FaEnvelope
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#999",
                  }}
                />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "14px 12px 14px 40px",
                    border: "1px solid #e0e0e0",
                    borderRadius: "6px",
                    fontSize: "14px",
                    outline: "none",
                    transition: "border-color 0.2s ease",
                  }}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "500",
                  color: "#555",
                  marginBottom: "6px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Password
              </label>
              <div style={{ position: "relative" }}>
                <FaLock
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#999",
                  }}
                />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  style={{
                    width: "100%",
                    padding: "14px 12px 14px 40px",
                    border: "1px solid #e0e0e0",
                    borderRadius: "6px",
                    fontSize: "14px",
                    outline: "none",
                    transition: "border-color 0.2s ease",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            padding: "16px 40px",
            flexShrink: 0,
          }}
        >
          <button
            onClick={handleSave}
            style={{
              backgroundColor: "#0C2440",
              color: "#ffffff",
              border: "none",
              padding: "12px 24px",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "background-color 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#555";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#333";
            }}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
