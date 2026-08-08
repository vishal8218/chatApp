import { useLocation, useNavigate } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import { useState, useRef, useCallback, useEffect } from "react";
import SearchUser from "./searchUser";
import axios from "axios";
import { useAppContext } from "./AppContext";
import useBadge from "./useBadge";

const HomePage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.userEmailId;
  const token = localStorage.getItem("token");
  const { baseUrl } = useAppContext();

  const [openUSP, setOpenUSP] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showOtpForm, setShowOtpForm] = useState(false);
  // Read cached count immediately so badge shows as soon as the app opens
  const [totalUnreadUsers, setTotalUnreadUsers] = useState(() => {
    return parseInt(localStorage.getItem("unreadUserCount") || "0", 10);
  });

  const [emailInput, setEmailInput] = useState("");
  const [otpInput, setOtpInput] = useState("");

  const [profilePic, setProfilePic] = useState(() => {
    return localStorage.getItem("profileUrl") || "";
  });
  const [zoomOpen, setZoomOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  /* ===================== PROFILE PICTURE UPLOAD ===================== */
  const handleUnreadCountChange = useCallback((count) => {
    setTotalUnreadUsers(count);
    localStorage.setItem("unreadUserCount", String(count));
  }, []);

  // 🔴 Set PWA app icon badge = number of users with unread messages
  useBadge(totalUnreadUsers);

  /* ===================== POLL UNREAD USER COUNT ===================== */
  useEffect(() => {
    if (!email || !token) return;

    const pollUnreadUserCount = async () => {
      try {
        // 1. Get logged-in user's ID
        const senderRes = await axios.post(
          `${baseUrl}get_senderId`,
          { email },
          { headers: { Authorization: token } }
        );
        const myUserId = senderRes.data.UserId;
        if (!myUserId) return;

        // 2. Get friend list
        const friendRes = await axios.post(
          `${baseUrl}get_friends?userEmail=${email}`,
          {},
          { headers: { Authorization: token } }
        );
        if (friendRes.data.Status === "False") {
          setTotalUnreadUsers(0);
          return;
        }
        const friends = { ...friendRes.data };
        if (friends[myUserId]) delete friends[myUserId];

        // 3. Count how many friends have sent unread messages to me (user count, not message count)
        let usersWithUnread = 0;
        for (const friendId of Object.keys(friends)) {
          const res = await axios.post(
            `${baseUrl}unread_count`,
            { senderId: friendId, reciverId: myUserId },
            { headers: { Authorization: token } }
          );
          if ((res.data.UnReadCount || 0) > 0) {
            usersWithUnread += 1;
          }
        }
        setTotalUnreadUsers(usersWithUnread);
        // Cache so the badge is instant on next app open
        localStorage.setItem("unreadUserCount", String(usersWithUnread));
      } catch (err) {
        // Silently ignore polling errors
      }
    };

    pollUnreadUserCount();
    const intervalId = setInterval(pollUnreadUserCount, 5000);
    return () => clearInterval(intervalId);
  }, [email, token, baseUrl]);

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
    // Clear all cached data including badge count
    localStorage.removeItem("unreadUserCount");
    if (localStorage.getItem("access_token") !== null) {
      localStorage.removeItem("token");
      localStorage.removeItem("profileUrl");
      navigate(-1);

    }
    localStorage.removeItem("token");
    localStorage.removeItem("profileUrl");

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
          style={{ position: "relative" }}
        >
          New Chat
          {totalUnreadUsers > 0 && (
            <span
              style={{
                position: "absolute",
                top: "-8px",
                right: "-8px",
                background: "var(--danger-color)",
                color: "white",
                borderRadius: "50%",
                minWidth: "20px",
                height: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
                fontWeight: "bold",
                boxShadow: "0 2px 8px rgba(241,92,109,0.6)",
                animation: "pulseRing 2s infinite",
                padding: "0 4px",
                lineHeight: 1,
                pointerEvents: "none",
              }}
              title={`${totalUnreadUsers} user${totalUnreadUsers > 1 ? 's' : ''} with unread messages`}
            >
              {totalUnreadUsers > 99 ? "99+" : totalUnreadUsers}
            </span>
          )}
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
          <SearchUser senderEmail={email} onUnreadCountChange={handleUnreadCountChange} />
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
