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

  const email = location.state?.userEmailId || localStorage.getItem("userEmail");
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

  // ── Delete Account modal state ──
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

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
        if (friendRes.data.Status === "False" || friendRes.data.Status === false) {
          setTotalUnreadUsers(0);
          return;
        }
        const { Status: _s, Message: _m, ...friendContacts } = friendRes.data;
        const friends = { ...friendContacts };
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
    const intervalId = setInterval(pollUnreadUserCount, 15000);
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
    try {
      await axios.post(
        `${baseUrl}logout`,
        {},
        {
          headers: {
            Authorization: token,
          },
        }
      );
    } catch (err) {
      // Proceed with local logout even if the server call fails
      console.error("Logout API error:", err);
    }

    // Clear all cached data
    localStorage.removeItem("token");
    localStorage.removeItem("profileUrl");
    localStorage.removeItem("unreadUserCount");
    localStorage.removeItem("userEmail");

    navigate("/", { replace: true });
  };

  /* ===================== DELETE ACCOUNT ===================== */
  const handleDeleteAccount = async () => {
    if (deleteConfirmEmail.trim().toLowerCase() !== email.toLowerCase()) {
      setDeleteError("Email does not match. Please type your email exactly.");
      return;
    }

    setIsDeleting(true);
    setDeleteError("");

    try {
      // Step 1: Resolve the userId from email
      const senderRes = await axios.post(
        `${baseUrl}get_senderId`,
        { email },
        { headers: { Authorization: token } }
      );
      const userId = senderRes.data.UserId;
      if (!userId) {
        setDeleteError("Could not resolve user ID. Please try again.");
        return;
      }

      // Step 2: Call the delete account API with userId
      await axios.delete(
        `${baseUrl}accountDelete`,
        {
          headers: { Authorization: token },
          data: { userId },
        }
      );

      // Clear all cached data and redirect
      localStorage.removeItem("token");
      localStorage.removeItem("profileUrl");
      localStorage.removeItem("unreadUserCount");
      localStorage.removeItem("userEmail");

      navigate("/", { replace: true });
    } catch (err) {
      setDeleteError(
        err.response?.data?.Message || "Failed to delete account. Please try again."
      );
    } finally {
      setIsDeleting(false);
    }
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

        {/* ── Left: New Chat ── */}
        <button
          onClick={() => setOpenUSP(true)}
          className="na-btn-newchat"
          style={{ position: "relative" }}
        >
          {/* chat bubble icon */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
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

        {/* ── Centre: User chip ── */}
        <div
          className="na-user-chip"
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
              size={30}
              className="profile-pic-icon"
              onClick={handleProfileClick}
            />
          )}
          <span className="na-user-email">{email}</span>
          {/* pencil icon to signal editable */}
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4, flexShrink: 0 }}>
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </div>

        {/* ── Right: Action buttons ── */}
        <div className="na-actions">
          <button
            className="na-btn-delete"
            onClick={() => {
              setShowDeleteModal(true);
              setDeleteConfirmEmail("");
              setDeleteError("");
            }}
            title="Delete your account permanently"
          >
            {/* trash icon */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4h6v2"/>
            </svg>
            <span>Delete</span>
          </button>

          <button
            className="na-btn-logout"
            onClick={logout}
          >
            {/* logout arrow icon */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span>Logout</span>
          </button>
        </div>

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

      {/* ===================== DELETE ACCOUNT MODAL ===================== */}
      {showDeleteModal && (
        <div className="da-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="da-modal" onClick={(e) => e.stopPropagation()}>

            {/* Top gradient accent bar */}
            <div className="da-accent-bar" />

            {/* Close button */}
            <button
              className="da-close-btn"
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeleting}
              aria-label="Close"
            >
              ✕
            </button>

            {/* Icon */}
            <div className="da-icon-ring">
              <div className="da-icon-inner">
                <svg viewBox="0 0 24 24" fill="none" className="da-trash-svg">
                  <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M8 6V4h8v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
            </div>

            {/* Heading */}
            <h2 className="da-title">Delete Account</h2>
            <p className="da-subtitle">
              This is <span className="da-highlight">permanent</span> — your messages, contacts,
              and profile will be gone forever.
            </p>

            {/* Warning pills */}
            <div className="da-warning-pills">
              <span className="da-pill">🚫 No Recovery</span>
              <span className="da-pill">🗂 Data Erased</span>
              <span className="da-pill">🔒 Sessions Revoked</span>
            </div>

            {/* Confirmation input */}
            <div className="da-confirm-section">
              <label className="da-confirm-label">
                Type your email to confirm:
              </label>
              <div className="da-email-badge">{email}</div>

              <div className="da-input-wrapper">
                <input
                  type="email"
                  className={`da-input ${
                    deleteConfirmEmail.length > 0
                      ? deleteConfirmEmail.trim().toLowerCase() === email.toLowerCase()
                        ? "da-input--match"
                        : "da-input--mismatch"
                      : ""
                  }`}
                  placeholder="your@email.com"
                  value={deleteConfirmEmail}
                  onChange={(e) => {
                    setDeleteConfirmEmail(e.target.value);
                    setDeleteError("");
                  }}
                  autoComplete="off"
                  spellCheck={false}
                />
                {/* Live match indicator */}
                {deleteConfirmEmail.length > 0 && (
                  <span className={`da-input-status ${
                    deleteConfirmEmail.trim().toLowerCase() === email.toLowerCase()
                      ? "da-input-status--ok"
                      : "da-input-status--bad"
                  }`}>
                    {deleteConfirmEmail.trim().toLowerCase() === email.toLowerCase() ? "✓" : "✗"}
                  </span>
                )}
              </div>

              {/* Match progress bar */}
              <div className="da-match-bar-track">
                <div
                  className="da-match-bar-fill"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(
                        (deleteConfirmEmail.length / email.length) * 100
                      )
                    )}%`,
                    background:
                      deleteConfirmEmail.trim().toLowerCase() === email.toLowerCase()
                        ? "#22c55e"
                        : "var(--danger-color)",
                  }}
                />
              </div>

              {deleteError && (
                <p className="da-error">{deleteError}</p>
              )}
            </div>

            {/* Actions */}
            <div className="da-actions">
              <button
                className="da-btn-cancel"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                Keep Account
              </button>
              <button
                className="da-btn-delete"
                onClick={handleDeleteAccount}
                disabled={isDeleting || deleteConfirmEmail.trim().toLowerCase() !== email.toLowerCase()}
              >
                {isDeleting ? (
                  <><span className="delete-spinner" /> Deleting…</>
                ) : (
                  "Delete Forever"
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
