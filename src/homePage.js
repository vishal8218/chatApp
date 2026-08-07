import { useLocation, useNavigate } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import { useState, useRef } from "react";
import SearchUser from "./searchUser";
import axios from "axios";
import { useAppContext } from "./AppContext";

const HomePage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.userEmailId;
  const token = localStorage.getItem("token");
  const { baseUrl } = useAppContext();

  const [openUSP, setOpenUSP] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showOtpForm, setShowOtpForm] = useState(false);

  const [emailInput, setEmailInput] = useState("");
  const [otpInput, setOtpInput] = useState("");

  const [profilePic, setProfilePic] = useState(() => {
    return localStorage.getItem("profileUrl") || "";
  });
  const [zoomOpen, setZoomOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  /* ===================== PROFILE PICTURE UPLOAD ===================== */
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 5MB
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("File is too large. Maximum size is 5MB.");
      e.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    try {
      const response = await axios.patch(
        `${baseUrl}profile-picture-upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: token,
          },
        }
      );

      // Extract the url from response or fallback to local preview
      const uploadedUrl = response.data.profileUrl;
      localStorage.setItem("profileUrl", uploadedUrl);

      setProfilePic(localStorage.getItem("profileUrl", uploadedUrl)
      );
      alert("Profile picture updated successfully!");


    } catch (error) {
      console.error("Upload error:", error);
      alert(error.response?.data?.Message || "Failed to upload profile picture.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleProfileClick = (e) => {
    e.stopPropagation(); // Prevent toggling the update email form dropdown
    if (profilePic) {
      setZoomOpen(true);
    } else {
      fileInputRef.current?.click();
    }
  };

  /* ===================== LOGOUT ===================== */
  const logout = async () => {
    await axios.post(
      `${baseUrl}logout`,
      {},
      {
        headers: {
          Authorization: token,
        },
      }
    );
    if (localStorage.getItem("access_token") !== null) {
      localStorage.removeItem("token");
      localStorage.removeItem("profileUrl")
      navigate(-1);

    }
    localStorage.removeItem("token");
    localStorage.removeItem("profileUrl")

    navigate("/", { replace: true });
  };

  /* ===================== SEND OTP ===================== */
  const handleGetOtp = async () => {
    if (!emailInput.trim()) {
      alert("Email is required");
      return;
    }

    try {

      const response = await axios.post(
        `${baseUrl}sendOtp`,
        null,
        {
          params: {
            newEmail: emailInput.toLowerCase(),
          },
        }
      );

      alert(response.data.Message);

      if (response.data.Status) {
        setShowEmailForm(false);   // ✅ hide update email form
        setShowOtpForm(true);     // ✅ show OTP form
      }
    } catch (error) {
      alert(error.response?.data?.Message || "Failed to send OTP");
    }
  };

  /* ===================== VERIFY OTP ===================== */
  const handleVerifyOtp = async () => {
    try {
      const response = await axios.patch(
        `${baseUrl}updateEmail`,
        {
          currentEmail: email,
          newEmail: emailInput,
          otp: otpInput,
        }
      );

      alert(response.data.Message);

      if (response.data.Status) {
        setShowOtpForm(false);
        setEmailInput("");
        setOtpInput("");
        logout();
      }
    } catch (error) {
      alert(error.response?.data?.Message || "Invalid OTP");
    }
  };

  return (
    <div className="page-content">
      {/* ===================== NAVBAR ===================== */}
      <div className="glass-navbar">
        <button
          onClick={() => setOpenUSP(true)}
          className="btn btn-primary nav-btn"
        >
          New Chat
        </button>

        <div
          className="navbar-user"
          onClick={() => {
            if (showEmailForm || showOtpForm) {
              setShowEmailForm(false);
              setShowOtpForm(false);
            } else {
              setShowEmailForm(true);
              setShowOtpForm(false);
              setEmailInput("");
            }
          }}
        >
          {profilePic ? (
            <img
              src={profilePic}
              alt="Profile"
              className="profile-pic-icon"
              onClick={handleProfileClick}
            />
          ) : (
            <FaUserCircle
              size={32}
              className="profile-pic-icon"
              onClick={handleProfileClick}
            />
          )}
          <span>{email}</span>
        </div>

        <button
          onClick={logout}
          className="btn btn-danger nav-btn"
        >
          Logout
        </button>
      </div>

      {/* ===================== UPDATE EMAIL FORM ===================== */}
      {showEmailForm && (
        <div className="glass-container" style={{ minHeight: 'auto', paddingTop: '40px' }}>
          <div className="glass-card">
            <h3>Update Email</h3>

            <div className="form-group">
              <input
                type="email"
                placeholder="Enter new email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="form-input"
              />
            </div>

            <button onClick={handleGetOtp} className="btn btn-secondary btn-block">
              Get OTP
            </button>
          </div>
        </div>
      )}

      {/* ===================== VERIFY OTP FORM ===================== */}
      {showOtpForm && (
        <div className="glass-container" style={{ minHeight: 'auto', paddingTop: '40px' }}>
          <div className="glass-card">
            <h3>Verify OTP</h3>

            <div className="form-group">
              <input
                type="text"
                placeholder="Enter 4-digit OTP"
                value={otpInput}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, ""); // allow only numbers
                  if (value.length <= 4) {
                    setOtpInput(value);
                  }
                }}
                maxLength={4}
                inputMode="numeric"
                className="form-input"
              />
            </div>

            <button
              onClick={handleVerifyOtp}
              className="btn btn-primary btn-block"
              style={{
                opacity: otpInput.length === 4 ? 1 : 0.6,
                cursor: otpInput.length === 4 ? "pointer" : "not-allowed",
              }}
              disabled={otpInput.length !== 4}
            >
              Verify OTP
            </button>
          </div>
        </div>
      )}

      {/* ===================== SEARCH USER ===================== */}
      {openUSP && (
        <div className="home-dashboard-wrapper">
          <SearchUser senderEmail={email} />
        </div>
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: "none" }}
      />

      {/* ===================== ZOOM MODAL ===================== */}
      {zoomOpen && (
        <div className="profile-zoom-modal" onClick={() => setZoomOpen(false)}>
          <div className="profile-zoom-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="profile-zoom-title">Profile Picture</h3>

            <div className="profile-zoom-img-container">
              <img
                src={profilePic}
                alt="Zoomed Profile"
                className="profile-zoom-img"
              />
              {isUploading && (
                <div className="profile-upload-loader">
                  <div className="spinner"></div>
                  <span>Uploading...</span>
                </div>
              )}
            </div>

            <div className="profile-zoom-actions">
              <button
                className="btn btn-primary btn-block"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                Update Picture
              </button>
              <button
                className="btn btn-secondary btn-block"
                onClick={() => setZoomOpen(false)}
                disabled={isUploading}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
