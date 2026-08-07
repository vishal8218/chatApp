import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppContext } from "./AppContext";
import axios from "axios";
import SearchUser from "./searchUser";


const AdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem("access_token");
  const { baseUrl } = useAppContext();
  const userdata = location.state?.userdata;

  const [senderid, setSenderId] = useState();
  const [messages, setMessages] = useState([]);
  const [name, setName] = useState();
  const [friendsData, setFriendsData] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
// ⭐ PAGINATION STATES
const [currentPage, setCurrentPage] = useState(1);
const rowsPerPage = 5;   // ← Updated from 10 to 5


  const chatBoxRef = useRef(null);

  const isRegister = localStorage.getItem("isRegister");
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages, isRegister]);

  const handleLogout = async () => {
    await axios.post(baseUrl + "logout", {}, { headers: { Authorization: token } });
    localStorage.removeItem("access_token");
    navigate("/admin", { replace: true });
  };

  const loginAsUser = async (email) => {
 const response =await axios.post(
    `${baseUrl}loginuser?email=${encodeURIComponent(email)}`,
    null, // no body
    {
      headers: {
        Authorization: localStorage.getItem("access_token"),
      },
    }
  );
localStorage.setItem("token", response.data.token);

            <SearchUser senderEmail={email} />


          navigate("/home_page", { state: { userEmailId: email } });
};



  const getFriends = async (senderEmail, userId) => {
    try {
      const response = await axios.post(
        baseUrl + "get_friends?userEmail=" + senderEmail,
        {},
        { headers: { Authorization: token } }
      );

      const formattedFriends = Object.entries(response.data).map(([id, name]) => ({
        id,
        name,
      }));

      if (formattedFriends.length === 0) {
        window.alert(`No friends found for ${senderEmail}`);
        setFriendsData([]);
        return;
      }

      setFriendsData(formattedFriends);
      setSelectedUser(senderEmail);
      setSenderId(userId);
    } catch (err) {
      console.error("Error fetching friends:", err);
      setFriendsData([]);
      window.alert("Failed to fetch friends. Please try again later.");
    }
  };

  const getChats = async (reciverid, name) => {
    try {
      const response = await axios.post(
        baseUrl + "get_all_messages",
        { reciverId: reciverid, senderId: senderid },
        { headers: { Authorization: token } }
      );

      setName(name);

      const cleanedData = Object.values(response.data).map((msgArr) => {
        let msgObj = {};
        msgArr.forEach((item) => {
          const [key, value] = item.split(" : ").map((s) => s.trim());
          if (key.toLowerCase() === "messagecontent") msgObj.text = value;
          if (key.toLowerCase() === "senderid") msgObj.senderId = value;
          if (key.toLowerCase() === "reciverid") msgObj.reciverId = value;
          if (key.toLowerCase() === "time") msgObj.time = value;
          if (key.toLowerCase() === "date") msgObj.date = value;
          if (key.toLowerCase() === "messageid") msgObj.messageId = value;
        });
        return msgObj;
      });

      const sortedMessages = cleanedData.sort((a, b) => {
        if (!a.date || !a.time || !b.date || !b.time) return 0;
        return new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`);
      });

      setMessages(sortedMessages);
    } catch (error) {
      console.error("❌ Error fetching messages:", error);
    }
  };

  if (!userdata || Object.keys(userdata).length === 0) {
    return <p style={{ textAlign: "center", color: "gray" }}>No user data found.</p>;
  }

  const validData = Object.entries(userdata)
    .filter(([key, value]) => !isNaN(key) && Array.isArray(value))
    .map(([_, value]) => value);

  const rows = validData.map((item = []) => {
    const userObj = {};
    (item || []).forEach((str) => {
      if (typeof str === "string" && str.includes(" : ")) {
        const [key, value] = str.split(" : ");
        userObj[key.trim()] = value.trim();
      }
    });
    return userObj;
  });

  // ⭐ SEARCH FILTER
  const filteredRows = rows.filter((user) => {
    const q = searchQuery.toLowerCase();
    return (
      user["Email"]?.toLowerCase().includes(q) ||
      user["Name"]?.toLowerCase().includes(q)
    );
  });

  // ⭐ PAGINATION LOGIC
  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);
  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentRows = filteredRows.slice(indexOfFirst, indexOfLast);

  const goToPage = (num) => setCurrentPage(num);
  

  return (
    <div className="page-content" style={{ padding: "20px 10px" }}>
      {/* Logout Button */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
        <button onClick={handleLogout} className="btn btn-danger">
          Logout
        </button>
      </div>

      <h2 className="text-center" style={{ marginBottom: "20px" }}>
        Admin Dashboard – User Data
      </h2>

      {/* Search Bar */}
      <div style={{ width: "100%", maxWidth: "800px", margin: "0 auto", marginBottom: "20px", padding: "0 10px", boxSizing: "border-box" }}>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1); // Reset to page 1 after search
          }}
          className="form-input"
        />
      </div>

      {/* Table */}
      <div className="glass-card" style={{ width: "100%", maxWidth: "1000px", margin: "0 auto", padding: "20px", boxSizing: "border-box" }}>
        <table className="responsive-table" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid rgba(255,255,255,0.4)" }}>
              <th style={{ padding: "14px 20px", textAlign: "left", color: "var(--text-main)" }}>Name</th>
              <th style={{ padding: "14px 20px", textAlign: "left", color: "var(--text-main)" }}>Email</th>
              <th style={{ padding: "14px 20px", textAlign: "left", color: "var(--text-main)" }}>Action</th>
            </tr>
          </thead>

          <tbody>
            {currentRows.map((user, index) => {
              const userId = user["userId"] || user["Email"];
              return (
                <tr key={index} style={{ borderBottom: "1px solid rgba(255,255,255,0.2)" }}>
                  <td data-label="Name" style={{ padding: "14px 20px", fontWeight: "500" }}>{user["Name"] || "-"}</td>
                  <td data-label="Email" style={{ padding: "14px 20px", color: "var(--text-light)" }}>{user["Email"] || "-"}</td>
                  <td data-label="Action" style={{ padding: "14px 20px", display: "flex", gap: "10px" }}>
                    <button
                      onClick={() => getFriends(user["Email"], userId)}
                      className="btn btn-secondary"
                      style={{ padding: "8px 12px", fontSize: "0.85rem" }}
                    >
                      Friend List
                    </button>
                    <button
                      onClick={() => loginAsUser(user["Email"])}
                      className="btn btn-primary"
                      style={{ padding: "8px 12px", fontSize: "0.85rem" }}
                    >
                      Login
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* ⭐ PAGINATION UI */}
        <div style={{ marginTop: "20px", display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
          <button
            disabled={currentPage === 1}
            onClick={() => goToPage(currentPage - 1)}
            className="btn glass-card"
            style={{ padding: "8px 12px", cursor: currentPage === 1 ? "not-allowed" : "pointer" }}
          >
            Prev
          </button>

          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => goToPage(i + 1)}
              className="btn"
              style={{
                padding: "8px 12px",
                background: currentPage === i + 1 ? "var(--secondary-color)" : "rgba(255,255,255,0.5)",
                color: currentPage === i + 1 ? "#fff" : "var(--text-main)",
                border: "1px solid rgba(255,255,255,0.5)",
              }}
            >
              {i + 1}
            </button>
          ))}

          <button
            disabled={currentPage === totalPages}
            onClick={() => goToPage(currentPage + 1)}
            className="btn glass-card"
            style={{ padding: "8px 12px", cursor: currentPage === totalPages ? "not-allowed" : "pointer" }}
          >
            Next
          </button>
        </div>
      </div>

      {/* Friend List */}
      {friendsData.length > 0 && (
        <div className="glass-card" style={{ marginTop: "30px", width: "90%", maxWidth: "800px", margin: "30px auto", padding: "20px" }}>
          <h3 style={{ marginBottom: "15px", textAlign: "left" }}>
            Friends of {selectedUser}
          </h3>

          <ul style={{ listStyle: "none", padding: 0 }}>
            {friendsData.map((friend) => (
              <li
                key={friend.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 15px",
                  borderBottom: "1px solid rgba(255,255,255,0.3)",
                  marginBottom: "8px",
                }}
              >
                <strong style={{ fontSize: "1.1rem" }}>{friend.name}</strong>
                <button
                  onClick={() => getChats(friend.id, friend.name)}
                  className="btn btn-secondary"
                  style={{ padding: "8px 16px", fontSize: "0.9rem" }}
                >
                  View Chat
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Chat Box */}
      {messages.length > 0 && (
        <div
          ref={chatBoxRef}
          className="glass-card"
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            width: "calc(100vw - 40px)",
            maxWidth: "320px",
            height: "400px",
            maxHeight: "calc(100vh - 100px)",
            overflowY: "auto",
            padding: "15px",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.4)", paddingBottom: "10px", marginBottom: "15px" }}>
            <h4 style={{ margin: 0 }}>{name}</h4>
            <button
              onClick={() => setMessages([])}
              style={{ background: "transparent", border: "none", color: "var(--danger-color)", fontSize: "20px", cursor: "pointer", fontWeight: "bold" }}
            >
              ✕
            </button>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
            {messages.map((msg) => (
              <div
                key={msg.messageId}
                style={{
                  alignSelf: msg.senderId === senderid ? "flex-end" : "flex-start",
                  background: msg.senderId === senderid ? "var(--secondary-color)" : "rgba(255,255,255,0.8)",
                  color: msg.senderId === senderid ? "#fff" : "#333",
                  padding: "10px 14px",
                  borderRadius: "15px",
                  borderBottomRightRadius: msg.senderId === senderid ? "4px" : "15px",
                  borderBottomLeftRadius: msg.senderId === senderid ? "15px" : "4px",
                  maxWidth: "80%",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                }}
              >
                <p style={{ margin: 0, fontSize: "0.95rem" }}>{msg.text}</p>
                <small style={{ fontSize: "10px", color: msg.senderId === senderid ? "rgba(255,255,255,0.7)" : "gray", display: "block", textAlign: "right", marginTop: "5px" }}>
                  {msg.date} {msg.time}
                </small>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
