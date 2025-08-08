import React, { useEffect, useState } from "react";
import axios from "axios";

const PersonnelList = ({ searchTerm, onSelectPerson }) => {
  const [personnel, setPersonnel] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    per_id: "",
    per_name: "",
    per_lname: "",
    per_department: "",
    per_role: "",
    per_email: "",
  });

  useEffect(() => {
    fetchPersonnel();
  }, []);

  const fetchPersonnel = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5050/api/personnel");
      setPersonnel(res.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching personnel:", err);
      setError("Personel listesi yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      // Form data oluştur
      const submitData = new FormData();
      Object.keys(formData).forEach((key) => {
        submitData.append(key, formData[key]);
      });

      if (selectedImage) {
        submitData.append("photo", selectedImage);
      }

      await axios.post("http://localhost:5050/api/personnel", submitData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setFormData({
        per_id: "",
        per_name: "",
        per_lname: "",
        per_department: "",
        per_role: "",
        per_email: "",
      });
      setSelectedImage(null);
      setImagePreview(null);
      setShowModal(false);
      fetchPersonnel(); // Refresh the list
      setError(null);
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
      per_id: "",
      per_name: "",
      per_lname: "",
      per_department: "",
      per_role: "",
      per_email: "",
    });
    setSelectedImage(null);
    setImagePreview(null);
    setError(null);
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Add Button */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "24px",
          padding: "0 8px",
        }}
      >
        <button
          onClick={() => setShowModal(true)}
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
            e.target.style.backgroundColor = "#f3f4f6";
            e.target.style.color = "#374151";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "transparent";
            e.target.style.color = "#6b7280";
          }}
        >
          <span
            style={{ fontSize: "18px", fontWeight: "bold", lineHeight: "1" }}
          >
            +
          </span>
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

      {/* Personnel Grid */}
      {!loading && (
        <div className="personnel-grid">
          {personnel
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
            .map((person) => (
              <div
                className="personnel-card"
                key={person.per_id}
                onClick={() => {
                  window.history.pushState(
                    null,
                    "",
                    `/personnel/${person.per_id}`
                  );
                  window.dispatchEvent(new PopStateEvent("popstate"));
                }}
                style={{ cursor: "pointer" }}
              >
                <img
                  className="personnel-avatar"
                  src={`/${person.per_id}.jpg`}
                  alt={`${person.per_name} ${person.per_lname}`}
                />
                <div className="personnel-name">
                  {person.per_name} {person.per_lname}
                </div>
                <div className="personnel-role">{person.per_role}</div>
              </div>
            ))}
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
              {/* Photo Upload Section */}
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
                    value={formData.per_name}
                    onChange={(e) =>
                      handleInputChange("per_name", e.target.value)
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
                    value={formData.per_lname}
                    onChange={(e) =>
                      handleInputChange("per_lname", e.target.value)
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

              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#374151",
                  }}
                >
                  Personnel ID *
                </label>
                <input
                  type="number"
                  required
                  value={formData.per_id}
                  onChange={(e) => handleInputChange("per_id", e.target.value)}
                  placeholder="Enter unique ID (e.g., 1, 2, 3...)"
                  style={{
                    width: "70%",
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
                  <input
                    type="text"
                    required
                    value={formData.per_department}
                    onChange={(e) =>
                      handleInputChange("per_department", e.target.value)
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
                    Role *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.per_role}
                    onChange={(e) =>
                      handleInputChange("per_role", e.target.value)
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
                  onMouseEnter={(e) => (e.target.style.background = "#e5e7eb")}
                  onMouseLeave={(e) => (e.target.style.background = "#f3f4f6")}
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
                    if (!loading) {
                      e.target.style.transform = "translateY(-1px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.target.style.transform = "translateY(0)";
                    }
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
                      ></div>
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
