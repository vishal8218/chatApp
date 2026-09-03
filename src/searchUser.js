import axios from "axios";
import { useEffect, useState, useRef, useCallback } from "react";
import { useAppContext } from "./AppContext";
import MessageSend from "./messageSend";
const SearchUser = ({ senderEmail, onUnreadCountChange }) => {
  const [formData, setFormData] = useState({ friendEmail: "", email: "" });
  const [openchatPage, setOpenChat] = useState(false);
  const [reciverName, setReciverName] = useState();
  const [reciverProfileUrl, setReciverProfileUrl] = useState("");
  const [data, setData] = useState({});
  const [reciverid, setReciverId] = useState();
  const [senderid, setSenderId] = useState();

  // ✅ NEW: unread count map
  const [unreadCounts, setUnreadCounts] = useState({});

  // tracks whether "See List" has been called at least once
  const [hasFetched, setHasFetched] = useState(false);

  // ── Three-dot menu state ──
  const [openMenuKey, setOpenMenuKey] = useState(null); // contact key whose menu is open
  const menuRef = useRef(null);

  // ── Lock Chat modal state ──
  const [lockModal, setLockModal] = useState(null); // { key, name } | null
  const [lockPassword, setLockPassword] = useState("");
  const [lockLoading, setLockLoading] = useState(false);
  const [lockError, setLockError] = useState("");
  const [lockSuccess, setLockSuccess] = useState("");

  // ── Remove Chat Lock modal state ──
  const [removeModal, setRemoveModal] = useState(null); // { key, name } | null
  const [removePassword, setRemovePassword] = useState("");
  const [removeLoading, setRemoveLoading] = useState(false);
  const [removeError, setRemoveError] = useState("");

  // ── Locked chats (persisted across sessions) ──
  const [lockedChats, setLockedChats] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem("lockedChats") || "[]"));
    } catch { return new Set(); }
  });

  // ── Verify PIN modal state (shown when opening a locked chat) ──
  const [verifyModal, setVerifyModal] = useState(null); // { key, name, value } | null
  const [verifyPin, setVerifyPin] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  // ── In-memory set of contacts unlocked this session ──
  // useState (not useRef) so mutations trigger re-renders and the lock icon updates.
  // NOT persisted: reset on page refresh, removed when the chat is closed.
  const [unlockedThisSession, setUnlockedThisSession] = useState(new Set());

  const token = localStorage.getItem("token");
  const { baseUrl } = useAppContext();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };


  const searchUser = async () => {
    if (formData.friendEmail === senderEmail) {
      alert("Please check email id");
    } else if (formData.friendEmail.trim() === "") {
      alert("Please Enter email-id");
    } else {
      try {
        const response = await axios.post(
          baseUrl + "add_friend",
          { friendEmail: formData.friendEmail, email: senderEmail },
          { headers: { Authorization: token, "Content-Type": "application/json" } }
        );
        alert(response.data.Message);

      } catch (error) {
        alert("User not exists");
      }
      setFormData("");
    }
    // const response = await axios.post(
    //   baseUrl + "get_friends?userEmail=" + senderEmail,
    //   {},
    //   { headers: { Authorization: token } }
    // );
    // setData(response.data);

  };

  const getFriends = async () => {
    try {
      // Get the logged-in user's own ID so we can exclude them from the list
      const senderRes = await axios.post(
        baseUrl + "get_senderId",
        { email: senderEmail },
        { headers: { Authorization: token } }
      );
      // Handle both flat and {Error:{...}} wrapper formats for senderId response
      const senderData = senderRes.data?.Error ?? senderRes.data;
      const myUserId = senderData.UserId;
      setSenderId(myUserId);

      const response = await axios.post(
        baseUrl + "get_friends?userEmail=" + senderEmail.toLowerCase(),
        {},
        { headers: { Authorization: token } }
      );


      // Handle both flat response and {Error:{...}} wrapper formats
      const rawData = response.data?.Error ?? response.data;
      const isFailure =
        rawData.Status === "False" ||
        rawData.Status === false ||
        rawData.status === false;

      if (isFailure) {
        setData({});
      } else {
        // Exclude metadata keys and the logged-in user's own entry
        const METADATA_KEYS = new Set(["Status", "Message", "status", "message"]);
        const filtered = {};
        Object.entries(rawData).forEach(([k, v]) => {
          if (!METADATA_KEYS.has(k) && String(k) !== String(myUserId)) {
            filtered[k] = v;
          }
        });

        setData(filtered);
      }
    } catch (err) {
      console.error("Error fetching friends:", err);
      setData({});
    } finally {
      setHasFetched(true); // mark that at least one fetch has completed
    }
  };

  // ── Close chat and re-lock if the chat was a locked one ──
  const handleChatClose = () => {
    if (reciverid) {
      setUnlockedThisSession((prev) => {
        const next = new Set(prev);
        next.delete(String(reciverid));
        return next;
      });
    }
    setOpenChat(false);
  };

  const openchatpage = async (key, value) => {
    if (openchatPage && String(reciverid) === String(key)) {
      // User clicked the same contact again to toggle-close
      setUnlockedThisSession((prev) => {
        const next = new Set(prev);
        next.delete(String(key));
        return next;
      });
      setOpenChat(false);
      return;
    }

    const response = await axios.post(
      baseUrl + "get_senderId",
      { email: senderEmail },
      { headers: { Authorization: token } }
    );
    setOpenChat(true);

    setSenderId(response.data.UserId);
    setReciverId(key);
    // value is an object { name, userProfile } from the API
    const contactName = value?.name || value || "User";
    const contactProfile = value?.userProfile || "";
    setReciverName(contactName);
    setReciverProfileUrl(contactProfile);
    // Immediately clear count for this contact and notify parent badge
    setUnreadCounts((prev) => {
      const updated = { ...prev, [key]: 0 };
      if (onUnreadCountChange) {
        const usersWithUnread = Object.values(updated).filter((c) => c > 0).length;
        onUnreadCountChange(usersWithUnread);
      }
      return updated;
    });
  };

  // ── Close three-dot menu when clicking outside ──
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuKey(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // ── Open lock modal ──
  const openLockModal = useCallback((key, name) => {
    setOpenMenuKey(null);
    setLockModal({ key, name });
    setLockPassword("");
    setLockError("");
    setLockSuccess("");
  }, []);

  // ── Open remove-lock modal ──
  const openRemoveModal = useCallback((key, name) => {
    setOpenMenuKey(null);
    setRemoveModal({ key, name });
    setRemovePassword("");
    setRemoveError("");
  }, []);

  // ── Submit remove chat lock: verify PIN first, then delete the lock ──
  const handleRemoveSubmit = async () => {
    if (removePassword.length !== 4) {
      setRemoveError("Password must be exactly 4 digits.");
      return;
    }
    setRemoveLoading(true);
    setRemoveError("");
    try {
      // Resolve sender ID
      let resolvedSenderId = senderid || senderIdRef.current;
      if (!resolvedSenderId) {
        const senderRes = await axios.post(
          baseUrl + "get_senderId",
          { email: senderEmail },
          { headers: { Authorization: token } }
        );
        resolvedSenderId = senderRes.data.UserId;
        senderIdRef.current = resolvedSenderId;
        setSenderId(resolvedSenderId);
      }

      // ── Step 1: verify PIN via verifychatlock ──
      const verifyRes = await axios.post(
        baseUrl + "verifychatlock",
        {
          receiverId: removeModal.key,
          senderId: resolvedSenderId,
          isLock: true,
          password: removePassword,
        },
        { headers: { Authorization: token } }
      );

      if (verifyRes.data.status !== true) {
        // Wrong PIN — show error, clear input, stay in modal
        setRemoveError(verifyRes.data.message || "Incorrect PIN. Try again.");
        setRemovePassword("");
        return;
      }

      // ── Step 2: PIN correct — now remove the lock ──
      await axios.delete(
        baseUrl + "removechatlock",
        {
          headers: { Authorization: token },
          data: {
            receiverId: removeModal.key,
            senderId: resolvedSenderId,
            password: removePassword,
          },
        }
      );

      // Remove from locked set and persist
      setLockedChats((prev) => {
        const next = new Set(prev);
        next.delete(removeModal.key);
        localStorage.setItem("lockedChats", JSON.stringify([...next]));
        return next;
      });
      // Clear from unlocked-this-session (no longer needed)
      setUnlockedThisSession((prev) => {
        const next = new Set(prev);
        next.delete(String(removeModal.key));
        return next;
      });
      setRemoveModal(null);
    } catch (err) {
      setRemoveError(
        err.response?.data?.Message ||
        err.response?.data?.message ||
        "Incorrect password or failed to remove lock."
      );
      setRemovePassword("");
    } finally {
      setRemoveLoading(false);
    }
  };

  // ── Submit lock API ──
  const handleLockSubmit = async () => {
    if (lockPassword.length !== 4) {
      setLockError("Password must be exactly 4 digits.");
      return;
    }
    setLockLoading(true);
    setLockError("");
    setLockSuccess("");
    try {
      await axios.post(
        baseUrl + "lockuser",
        {
          receiverId: lockModal.key,
          senderId: senderid,
          isLock: true,
          password: lockPassword,
        },
        { headers: { Authorization: token } }
      );
      // Mark chat as locked and persist
      setLockedChats((prev) => {
        const next = new Set(prev);
        next.add(lockModal.key);
        localStorage.setItem("lockedChats", JSON.stringify([...next]));
        return next;
      });
      setLockModal(null); // close immediately on success
    } catch (err) {
      setLockError(err.response?.data?.Message || "Failed to lock chat. Try again.");
    } finally {
      setLockLoading(false);
    }
  };

  // ── Open verify-PIN modal instead of chat (for locked contacts) ──
  const openVerifyModal = useCallback((key, name, value) => {
    setVerifyModal({ key, name, value });
    setVerifyPin("");
    setVerifyError("");
  }, []);

  // ── Submit verify PIN ──
  const handleVerifySubmit = async () => {
    if (verifyPin.length !== 4) {
      setVerifyError("Enter the 4-digit PIN.");
      return;
    }
    setVerifyLoading(true);
    setVerifyError("");
    try {
      // Resolve senderId: prefer state, fall back to ref (set by polling),
      // fetch fresh as last resort so the call is never made with undefined.
      let resolvedSenderId = senderid || senderIdRef.current;
      if (!resolvedSenderId) {
        const senderRes = await axios.post(
          baseUrl + "get_senderId",
          { email: senderEmail },
          { headers: { Authorization: token } }
        );
        resolvedSenderId = senderRes.data.UserId;
        senderIdRef.current = resolvedSenderId;
        setSenderId(resolvedSenderId);
      }

      const res = await axios.post(
        baseUrl + "verifychatlock",
        {
          receiverId: verifyModal.key,
          senderId: resolvedSenderId,
          isLock: true,
          password: verifyPin,
        },
        { headers: { Authorization: token } }
      );

      // API returns 202 for both outcomes — check status field in the body
      if (res.data.status === true) {
        // PIN correct — mark as unlocked for this session, then open chat
        setUnlockedThisSession((prev) => {
          const next = new Set(prev);
          next.add(String(verifyModal.key));
          return next;
        });
        setVerifyModal(null);
        openchatpage(verifyModal.key, verifyModal.value);
      } else {
        // Wrong PIN — show the API message and clear the input for retry
        setVerifyError(res.data.message || "Incorrect PIN. Try again.");
        setVerifyPin("");
      }
    } catch (err) {
      setVerifyError(err.response?.data?.Message || "Incorrect PIN. Try again.");
      setVerifyPin("");
    } finally {
      setVerifyLoading(false);
    }
  };

  // Cached sender ID so we don't re-fetch it on every poll tick
  const senderIdRef = useRef(null);

  // ======================================================
  // ✅ Poll unread counts every 5s for fast badge updates
  // ======================================================
  useEffect(() => {
    if (Object.keys(data).length === 0) return;

    const fetchUnreadCounts = async () => {
      try {
        // Fetch senderId once, then cache it
        if (!senderIdRef.current) {
          const senderRes = await axios.post(
            baseUrl + "get_senderId",
            { email: senderEmail },
            { headers: { Authorization: token } }
          );
          senderIdRef.current = senderRes.data.UserId;
        }

        const senderId = senderIdRef.current;
        const counts = {};

        for (const key of Object.keys(data)) {
          const res = await axios.post(
            baseUrl + "unread_count",
            { senderId: key, reciverId: senderId },
            { headers: { Authorization: token } }
          );
          counts[key] = res.data.UnReadCount || 0;
        }

        setUnreadCounts(counts);

        // Notify parent: count of USERS (not messages) with unread > 0
        if (onUnreadCountChange) {
          const usersWithUnread = Object.values(counts).filter((c) => c > 0).length;
          onUnreadCountChange(usersWithUnread);
        }
      } catch (err) {
        console.error("Unread count error", err);
      }
    };

    fetchUnreadCounts();
    const intervalId = setInterval(fetchUnreadCounts, 15000);
    return () => clearInterval(intervalId);
  }, [data, senderEmail, baseUrl, token, onUnreadCountChange]);


  return (
    <div className="chat-dashboard-container">
      {/* Sidebar: contains Search card and Chats list */}
      <div className={`chat-sidebar ${openchatPage ? "hidden-on-mobile" : ""}`}>
        {/* Search Card */}
        <div className="glass-card" style={{ border: "none", borderRadius: 0, boxShadow: "none", background: "transparent" }}>
          <h3 className="text-center">Search User</h3>
          <label className="form-label text-center">Enter Email ID</label>
          <input
            type="email"
            name="friendEmail"
            onChange={handleChange}
            required
            className="form-input"
            placeholder="user@example.com"
          />
          <div className="btn-group">
            <button onClick={searchUser} className="btn btn-primary" style={{ flex: 1 }}>
              Find
            </button>
            <button onClick={getFriends} className="btn btn-secondary" style={{ flex: 1 }}>
              See List
            </button>
          </div>
        </div>

        {/* Friends List — shown when contacts exist */}
        {hasFetched && Object.keys(data).length === 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px 20px",
              gap: "14px",
              borderTop: "1px solid var(--glass-border)",
            }}
          >
            <span style={{ fontSize: "48px" }}>🙈</span>
            <p
              style={{
                color: "var(--text-light)",
                fontSize: "0.95rem",
                textAlign: "center",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              No friend added yet.
              <br />
              <span style={{ color: "var(--primary-color)", fontSize: "0.85rem" }}>
                Use <strong>Find</strong> to search and add someone!
              </span>
            </p>
          </div>
        )}

        {Object.keys(data).length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", borderTop: "1px solid var(--glass-border)" }}>
            <div style={{ padding: "20px 20px 10px", fontSize: "1.1rem", fontWeight: "600", color: "var(--primary-color)" }}>Chats</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {Object.entries(data).map(([key, value], index) => {
                // value may be a string (name) or object {name, userProfile}
                const contactName = typeof value === "string"
                  ? value
                  : (typeof value === "object" && value !== null)
                    ? (value.name || "User")
                    : "User";
                const contactProfile = (typeof value === "object" && value !== null) ? (value.userProfile || "") : "";
                const isMenuOpen = openMenuKey === key;
                // Show lock icon only if the chat is in lockedChats AND
                // the user has NOT verified the PIN in this current open session.
                const isLocked = lockedChats.has(key) && !unlockedThisSession.has(key);
                return (
                  <div
                    key={key}
                    className="contact-row"
                    style={{ display: "flex", alignItems: "center", padding: "10px 20px 0 20px", cursor: "pointer", background: openchatPage && String(reciverid) === String(key) ? "var(--glass-border)" : "transparent", position: "relative" }}
                    onClick={() => isLocked ? openVerifyModal(key, contactName, value) : openchatpage(key, value)}
                  >
                    {/* Avatar */}
                    <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#dfe5e7", marginRight: "15px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0, marginBottom: "10px" }}>
                      {contactProfile ? (
                        <img
                          src={contactProfile}
                          alt={contactName}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          onError={(e) => { e.target.onerror = null; e.target.style.display = "none"; e.target.nextSibling && (e.target.nextSibling.style.display = "block"); }}
                        />
                      ) : null}
                      <span style={{ fontSize: "28px", color: "#fff", display: contactProfile ? "none" : "block" }}>👤</span>
                    </div>

                    {/* Name + unread badge */}
                    <div style={{ flex: 1, minWidth: 0, borderBottom: index < Object.keys(data).length - 1 ? "1px solid var(--glass-border)" : "none", paddingBottom: "15px", paddingTop: "5px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px", flex: 1, minWidth: 0, overflow: "hidden" }}>
                        {isLocked && <span title="Chat locked" style={{ fontSize: "13px", flexShrink: 0 }}>🔒</span>}
                        <span style={{ fontWeight: "500", fontSize: "1.05rem", color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{contactName}</span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {unreadCounts[key] > 0 && !(openchatPage && String(reciverid) === String(key)) && (
                          <span style={{ background: "var(--primary-color)", color: "var(--secondary-color)", borderRadius: "10px", padding: "2px 6px", fontSize: "11px", fontWeight: "bold" }}>
                            {unreadCounts[key]}
                          </span>
                        )}

                        {/* ⋮ Three-dot button — always visible for all contacts */}
                        <div ref={isMenuOpen ? menuRef : null} style={{ position: "relative" }}>
                          <button
                            id={`menu-btn-${key}`}
                            title="More options"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuKey(isMenuOpen ? null : key);
                            }}
                            style={{
                              background: "none",
                              border: "none",
                              color: "var(--text-light)",
                              cursor: "pointer",
                              fontSize: "18px",
                              lineHeight: 1,
                              padding: "4px 6px",
                              borderRadius: "50%",
                              transition: "background 0.15s",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--glass-border)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                          >
                            ⋮
                          </button>

                          {/* Dropdown Menu */}
                          {isMenuOpen && (
                            <div
                              style={{
                                position: "absolute",
                                right: 0,
                                top: "calc(100% + 4px)",
                                background: "var(--glass-bg)",
                                border: "1px solid var(--glass-border)",
                                borderRadius: "8px",
                                boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                                zIndex: 500,
                                minWidth: "160px",
                                overflow: "hidden",
                                animation: "slideUpFade 0.15s ease-out forwards",
                              }}
                            >
                              {isLocked ? (
                                /* Locked chat → show Remove Password */
                                <button
                                  id={`remove-lock-${key}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openRemoveModal(key, contactName);
                                  }}
                                  style={{
                                    width: "100%",
                                    background: "none",
                                    border: "none",
                                    color: "var(--danger-color, #ff4d4f)",
                                    padding: "12px 16px",
                                    textAlign: "left",
                                    cursor: "pointer",
                                    fontSize: "0.92rem",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    transition: "background 0.15s",
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--glass-border)")}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                                >
                                  🔓 Remove Password
                                </button>
                              ) : (
                                /* Unlocked chat → show Lock Chat */
                                <button
                                  id={`lock-chat-${key}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openLockModal(key, contactName);
                                  }}
                                  style={{
                                    width: "100%",
                                    background: "none",
                                    border: "none",
                                    color: "var(--text-main)",
                                    padding: "12px 16px",
                                    textAlign: "left",
                                    cursor: "pointer",
                                    fontSize: "0.92rem",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    transition: "background 0.15s",
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--glass-border)")}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                                >
                                  🔒 Lock Chat
                                </button>
                              )}
                            </div>
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
      </div>

      {/* Main Conversation Pane */}
      <div className={`chat-conversation-area ${!openchatPage ? "hidden-on-mobile" : ""}`}>
        {openchatPage ? (
          <MessageSend
            senderid={senderid}
            reciverid={reciverid}
            name={reciverName}
            profileUrl={reciverProfileUrl}
            onClose={handleChatClose}
          />
        ) : (
          <div className="no-chat-selected">
            <div>
              <span style={{ fontSize: "64px", display: "block", marginBottom: "15px" }}>💬</span>
              Select a chat to start messaging
            </div>
          </div>
        )}
      </div>

      {/* ══════════════ LOCK CHAT MODAL ══════════════ */}
      {lockModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(11,20,26,0.85)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 3000,
            animation: "fadeIn 0.2s ease-out forwards",
          }}
          onClick={() => setLockModal(null)}
        >
          <div
            style={{
              background: "var(--glass-bg)",
              border: "1px solid var(--glass-border)",
              borderRadius: "16px",
              padding: "32px 28px",
              width: "90%",
              maxWidth: "360px",
              boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
              animation: "zoomIn 0.25s cubic-bezier(0.34,1.56,0.64,1) forwards",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon + Title */}
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <span style={{ fontSize: "36px" }}>🔒</span>
              <h3 style={{ margin: "10px 0 4px", color: "var(--text-main)", fontWeight: 700 }}>Lock Chat</h3>
              <p style={{ color: "var(--text-light)", fontSize: "0.88rem", margin: 0 }}>
                Set a 4-digit PIN to lock <strong style={{ color: "var(--primary-color)" }}>{lockModal.name}</strong>
              </p>
            </div>

            {/* PIN Dots display */}
            <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginBottom: "18px" }}>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    width: "14px",
                    height: "14px",
                    borderRadius: "50%",
                    background: lockPassword.length > i ? "var(--primary-color)" : "var(--glass-border)",
                    transition: "background 0.2s",
                    boxShadow: lockPassword.length > i ? "0 0 8px rgba(0,168,132,0.5)" : "none",
                  }}
                />
              ))}
            </div>

            {/* Password input */}
            <input
              id="lock-password-input"
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="Enter 4-digit PIN"
              value={lockPassword}
              autoFocus
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                if (val.length <= 4) setLockPassword(val);
                setLockError("");
              }}
              className="form-input"
              style={{ textAlign: "center", letterSpacing: "8px", fontSize: "1.4rem", marginBottom: "12px" }}
            />

            {/* Error / success */}
            {lockError && (
              <p style={{ color: "var(--danger-color)", fontSize: "0.85rem", textAlign: "center", margin: "0 0 10px" }}>
                {lockError}
              </p>
            )}
            {lockSuccess && (
              <p style={{ color: "var(--primary-color)", fontSize: "0.88rem", textAlign: "center", margin: "0 0 10px" }}>
                ✅ {lockSuccess}
              </p>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
              <button
                id="lock-cancel-btn"
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setLockModal(null)}
                disabled={lockLoading}
              >
                Cancel
              </button>
              <button
                id="lock-confirm-btn"
                className="btn btn-primary"
                style={{
                  flex: 1,
                  opacity: lockPassword.length === 4 && !lockLoading ? 1 : 0.55,
                  cursor: lockPassword.length === 4 && !lockLoading ? "pointer" : "not-allowed",
                }}
                disabled={lockPassword.length !== 4 || lockLoading}
                onClick={handleLockSubmit}
              >
                {lockLoading ? "Locking…" : "Lock 🔒"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ VERIFY PIN MODAL ══════════════ */}
      {verifyModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(11,20,26,0.88)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 3000,
            animation: "fadeIn 0.2s ease-out forwards",
          }}
          onClick={() => setVerifyModal(null)}
        >
          <div
            style={{
              background: "var(--glass-bg)",
              border: "1px solid var(--glass-border)",
              borderRadius: "16px",
              padding: "32px 28px",
              width: "90%",
              maxWidth: "360px",
              boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
              animation: "zoomIn 0.25s cubic-bezier(0.34,1.56,0.64,1) forwards",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon + Title */}
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <span style={{ fontSize: "36px" }}>🔐</span>
              <h3 style={{ margin: "10px 0 4px", color: "var(--text-main)", fontWeight: 700 }}>Locked Chat</h3>
              <p style={{ color: "var(--text-light)", fontSize: "0.88rem", margin: 0 }}>
                Enter PIN to open <strong style={{ color: "var(--primary-color)" }}>{verifyModal.name}</strong>
              </p>
            </div>

            {/* PIN Dots display */}
            <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginBottom: "18px" }}>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    width: "14px",
                    height: "14px",
                    borderRadius: "50%",
                    background: verifyPin.length > i ? "var(--primary-color)" : "var(--glass-border)",
                    transition: "background 0.2s",
                    boxShadow: verifyPin.length > i ? "0 0 8px rgba(0,168,132,0.5)" : "none",
                  }}
                />
              ))}
            </div>

            {/* PIN input */}
            <input
              id="verify-pin-input"
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="Enter 4-digit PIN"
              value={verifyPin}
              autoFocus
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                if (val.length <= 4) setVerifyPin(val);
                setVerifyError("");
              }}
              onKeyDown={(e) => { if (e.key === "Enter" && verifyPin.length === 4) handleVerifySubmit(); }}
              className="form-input"
              style={{ textAlign: "center", letterSpacing: "8px", fontSize: "1.4rem", marginBottom: "12px" }}
            />

            {/* Error */}
            {verifyError && (
              <p style={{ color: "var(--danger-color)", fontSize: "0.85rem", textAlign: "center", margin: "0 0 10px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                <span>⚠️</span> {verifyError}
              </p>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
              <button
                id="verify-cancel-btn"
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setVerifyModal(null)}
                disabled={verifyLoading}
              >
                Cancel
              </button>
              <button
                id="verify-confirm-btn"
                className="btn btn-primary"
                style={{
                  flex: 1,
                  opacity: verifyPin.length === 4 && !verifyLoading ? 1 : 0.55,
                  cursor: verifyPin.length === 4 && !verifyLoading ? "pointer" : "not-allowed",
                }}
                disabled={verifyPin.length !== 4 || verifyLoading}
                onClick={handleVerifySubmit}
              >
                {verifyLoading ? "Verifying…" : "Unlock 🔓"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ REMOVE CHAT LOCK MODAL ══════════════ */}
      {removeModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(11,20,26,0.88)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 3000,
            animation: "fadeIn 0.2s ease-out forwards",
          }}
          onClick={() => setRemoveModal(null)}
        >
          <div
            style={{
              background: "var(--glass-bg)",
              border: "1px solid var(--glass-border)",
              borderRadius: "16px",
              padding: "32px 28px",
              width: "90%",
              maxWidth: "360px",
              boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
              animation: "zoomIn 0.25s cubic-bezier(0.34,1.56,0.64,1) forwards",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon + Title */}
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <span style={{ fontSize: "36px" }}>🔓</span>
              <h3 style={{ margin: "10px 0 4px", color: "var(--text-main)", fontWeight: 700 }}>Remove Password</h3>
              <p style={{ color: "var(--text-light)", fontSize: "0.88rem", margin: 0 }}>
                Enter current PIN to remove lock from{" "}
                <strong style={{ color: "var(--primary-color)" }}>{removeModal.name}</strong>
              </p>
            </div>

            {/* PIN Dots display */}
            <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginBottom: "18px" }}>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    width: "14px",
                    height: "14px",
                    borderRadius: "50%",
                    background: removePassword.length > i ? "#ff4d4f" : "var(--glass-border)",
                    transition: "background 0.2s",
                    boxShadow: removePassword.length > i ? "0 0 8px rgba(255,77,79,0.5)" : "none",
                  }}
                />
              ))}
            </div>

            {/* PIN input */}
            <input
              id="remove-lock-pin-input"
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="Enter 4-digit PIN"
              value={removePassword}
              autoFocus
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                if (val.length <= 4) setRemovePassword(val);
                setRemoveError("");
              }}
              onKeyDown={(e) => { if (e.key === "Enter" && removePassword.length === 4) handleRemoveSubmit(); }}
              className="form-input"
              style={{ textAlign: "center", letterSpacing: "8px", fontSize: "1.4rem", marginBottom: "12px" }}
            />

            {/* Error */}
            {removeError && (
              <p style={{ color: "var(--danger-color, #ff4d4f)", fontSize: "0.85rem", textAlign: "center", margin: "0 0 10px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                <span>⚠️</span> {removeError}
              </p>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
              <button
                id="remove-lock-cancel-btn"
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setRemoveModal(null)}
                disabled={removeLoading}
              >
                Cancel
              </button>
              <button
                id="remove-lock-confirm-btn"
                className="btn btn-primary"
                style={{
                  flex: 1,
                  background: "linear-gradient(135deg, #ff4d4f, #d9363e)",
                  opacity: removePassword.length === 4 && !removeLoading ? 1 : 0.55,
                  cursor: removePassword.length === 4 && !removeLoading ? "pointer" : "not-allowed",
                }}
                disabled={removePassword.length !== 4 || removeLoading}
                onClick={handleRemoveSubmit}
              >
                {removeLoading ? "Removing…" : "Remove 🔓"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchUser;
