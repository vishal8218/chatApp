import axios from "axios";
import { useEffect, useState, useRef } from "react";
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
      const myUserId = senderRes.data.UserId;
      setSenderId(myUserId);

      const response = await axios.post(
        baseUrl + "get_friends?userEmail=" + senderEmail,
        {},
        { headers: { Authorization: token } }
      );
      console.log(response.data);
      if (response.data.Status === "False") {
        setData({});
      } else {
        // Remove the logged-in user's own entry if present
        const filtered = { ...response.data };
        if (myUserId && filtered[myUserId]) {
          delete filtered[myUserId];
        }
        setData(filtered);
      }
    } catch (err) {
      console.error("Error fetching friends:", err);
    }
  };

  const openchatpage = async (key, value) => {
    if (openchatPage && String(reciverid) === String(key)) {
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

        {/* Friends List */}
        {Object.keys(data).length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", borderTop: "1px solid var(--glass-border)" }}>
            <div style={{ padding: "20px 20px 10px", fontSize: "1.1rem", fontWeight: "600", color: "var(--primary-color)" }}>Chats</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {Object.entries(data).map(([key, value], index) => {
                // value is { name, userProfile } object from API
                const contactName = value?.name || value || "User";
                const contactProfile = value?.userProfile || "";
                return (
                  <div
                    key={key}
                    className="contact-row"
                    style={{ display: "flex", alignItems: "center", padding: "10px 20px 0 20px", cursor: "pointer", background: openchatPage && String(reciverid) === String(key) ? "var(--glass-border)" : "transparent" }}
                    onClick={() => openchatpage(key, value)}
                  >
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
                    <div style={{ flex: 1, borderBottom: index < Object.keys(data).length - 1 ? "1px solid var(--glass-border)" : "none", paddingBottom: "15px", paddingTop: "5px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ fontWeight: "500", fontSize: "1.05rem", color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "200px" }}>{contactName}</div>

                      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", minWidth: "24px" }}>
                        {unreadCounts[key] > 0 && !(openchatPage && String(reciverid) === String(key)) && (
                          <span style={{ background: "var(--primary-color)", color: "var(--secondary-color)", borderRadius: "10px", padding: "2px 6px", fontSize: "11px", fontWeight: "bold" }}>
                            {unreadCounts[key]}
                          </span>
                        )}
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
            onClose={() => setOpenChat(false)}
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
    </div>
  );
};

export default SearchUser;
