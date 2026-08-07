import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { FaPaperPlane, FaPlus, FaCheck, FaCheckDouble, FaArrowLeft } from "react-icons/fa";
import { useAppContext } from "./AppContext";

import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

// let stompClient = null;


const MessageSend = ({ senderid, reciverid, name, profileUrl, onClose }) => {
  const stompClient = useRef(null);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const token = localStorage.getItem("token");
  const { baseUrl } = useAppContext();
  const chatEndRef = useRef(null);
  const [menuOpenIndex, setMenuOpenIndex] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [zoomImage, setZoomImage] = useState(null);

  useEffect(() => {
    if (!senderid || !reciverid) return;

    const fetchHistory = async () => {
      try {
        const response = await axios.post(
          baseUrl + "get_messages",
          { reciverId: reciverid, senderId: senderid },
          { headers: { Authorization: token } }
        );

        console.log("📥 Raw History Data:", response.data);

        let cleanedData = [];

        // Check if the backend is returning proper standard JSON objects
        if (Array.isArray(response.data) && response.data.length > 0 && typeof response.data[0] === "object" && !Array.isArray(response.data[0])) {
          cleanedData = response.data.map(msg => ({
            text: msg.messageContent || msg.text,
            senderId: msg.senderId,
            reciverId: msg.reciverId,
            time: msg.time,
            date: msg.date,
            messageId: msg.messageId,
            isRead: msg.isRead === true || msg.isRead === "true",
            isEdited: msg.isEdited,
            isImage: msg.isImage,
            isPdf: msg.isPdf,
            fileName: msg.fileName,
            imageUrl: msg.imageUrl
          }));
        } else if (response.data) {
          // Fallback to the old formatted string arrays
          cleanedData = Object.values(response.data).map((msgArr) => {
            let msgObj = {};
            if (Array.isArray(msgArr)) {
              msgArr.forEach((item) => {
                if (typeof item === "string") {
                  const [rawKey, ...rest] = item.split(":");
                  const key = rawKey.trim().toLowerCase();
                  const value = rest.join(":").trim();

                  if (key === "messagecontent") msgObj.text = value;
                  if (key === "senderid") msgObj.senderId = value;
                  if (key === "reciverid") msgObj.reciverId = value;
                  if (key === "time") msgObj.time = value;
                  if (key === "date") msgObj.date = value;
                  if (key === "messageid") msgObj.messageId = value;
                  if (key === "isread") msgObj.isRead = value === "true";
                  if (key === "isedited") msgObj.isEdited = value;
                }
              });
            }
            return msgObj;
          });
        }

        console.log("🧹 Cleaned History Data:", cleanedData);

        const sortedMessages = cleanedData.sort((a, b) => {
          if (!a.date || !a.time || !b.date || !b.time) return 0;
          const dateTimeA = new Date(`${a.date}T${a.time}`);
          const dateTimeB = new Date(`${b.date}T${b.time}`);
          return dateTimeA - dateTimeB;
        });

        setMessages(sortedMessages);
      } catch (error) {
        console.error("❌ Error fetching messages:");
        console.error(error);
        if (error.response) console.error("Server Response:", error.response.data);
      }
    };

    fetchHistory();


  }, [senderid, reciverid, baseUrl, token]);

  // ✅ Connect WebSocket
  useEffect(() => {
    connectWebSocket();
    return () => {
      if (stompClient.current) stompClient.current.deactivate();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [senderid, reciverid, name]);

  useEffect(() => {
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);
  useEffect(() => {
    if (senderid && reciverid) {
      sendReadReceipt();
      sendIsChatOpen();
    }

    // Adjust frontend to trigger read receipts when window comes back into focus
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && senderid && reciverid) {
        sendReadReceipt();
        sendIsChatOpen();
      }
    };

    const handleFocus = () => {
      if (senderid && reciverid) {
        sendReadReceipt();
        sendIsChatOpen();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [senderid, reciverid]);

  const sendReadReceipt = () => {
    if (!stompClient.current || !stompClient.current.connected) return;

    stompClient.current.publish({
      destination: "/app/message_read",
      headers: { Authorization: token },
      body: JSON.stringify({
        senderId: reciverid,   // who sent messages
        reciverId: senderid  // who read them
      }),
    });
  };

  const sendIsChatOpen = () => {
    if (!stompClient.current || !stompClient.current.connected) return;

    stompClient.current.publish({
      destination: "/app/is_chat_open",
      headers: { Authorization: token },
      body: JSON.stringify({
        senderId: reciverid,   // who sent messages
        reciverId: senderid   // who sent messages
      }),
    });
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size exceeds 5MB limit. Please choose a smaller file.");
      } else {
        setSelectedFile(file);
      }
    }

    // Reset file input so the same file can be selected again
    if (event.target) {
      event.target.value = "";
    }
  };

  // ✅ Auto scroll
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const connectWebSocket = () => {
    stompClient.current = new Client({
      webSocketFactory: () => new SockJS(baseUrl + "ws"),
      reconnectDelay: 5000,
      connectHeaders: { Authorization: token },

      onConnect: () => {

        if (senderid && reciverid) {
          sendReadReceipt();
          sendIsChatOpen();
        }

        stompClient.current.subscribe("/user/queue/messages", (msg) => {
          const body = JSON.parse(msg.body);

          if (
            (body.senderId === reciverid && body.reciverId === senderid) ||
            (body.senderId === senderid && body.reciverId === reciverid)
          ) {
            setMessages((prev) => [
              ...prev,
              {
                text: body.messageContent,
                senderId: body.senderId,
                reciverId: body.reciverId,
                time: body.time,
                date: body.date,
                messageId: body.messageId,
                isRead: body.isRead === true,
              },
            ]);

            if (body.senderId === reciverid && body.reciverId === senderid) {
              stompClient.current.publish({
                destination: "/app/message_read",
                headers: { Authorization: token },
                body: JSON.stringify({
                  senderId: reciverid,   // who sent messages (B)
                  reciverId: senderid  // who read them (A)
                }),
              });
            }
          }
        });


        stompClient.current.subscribe("/user/queue/read-receipt", (msg) => {
          const receipt = JSON.parse(msg.body);
          console.log("📩 Received read-receipt:", receipt);

          const isMatchingReceipt =
            String(receipt.senderId) === String(senderid) &&
            String(receipt.reciverId) === String(reciverid);

          if (isMatchingReceipt) {
            setMessages((prev) =>
              prev.map((m) =>
                String(m.senderId) === String(senderid)
                  ? { ...m, isRead: true }
                  : m
              )
            );
          }
        });

        stompClient.current.subscribe("/user/queue/is_chat_open", (msg) => {
          const receipt = JSON.parse(msg.body);
          console.log("📩 Received is_chat_open:", receipt);

          const isMatchingReceipt =
            String(receipt.senderId) === String(senderid) &&
            String(receipt.reciverId) === String(reciverid);

          if (isMatchingReceipt) {
            setMessages((prev) =>
              prev.map((m) =>
                String(m.senderId) === String(senderid)
                  ? { ...m, isRead: true }
                  : m
              )
            );
          }
        });

        stompClient.current.subscribe("/user/queue/edit", (msg) => {
          const body = JSON.parse(msg.body);

          setMessages((prev) =>
            prev.map((m) =>
              m.messageId === body.messageId
                ? { ...m, text: body.messageContent }
                : m
            )
          );
        });

      },

      onStompError: (frame) =>
        console.error("❌ STOMP Error:", frame.headers["message"]),

      onDisconnect: () =>
        console.warn("⚠️ WebSocket disconnected"),
    });

    stompClient.current.activate();
  };






  const handleSend = async () => {
    if (input.trim() === "" && !selectedFile) return;

    if (selectedFile) {
      const file = selectedFile;
      const formData = new FormData();
      formData.append("name", senderid);
      formData.append("file", file);

      try {
        const response = await axios.post(
          baseUrl + "upload_a_file",
          formData,
          {
            headers: { Authorization: token },
          }
        );

        console.log("✅ File uploaded:", response.data);

        const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");

        setMessages((prev) => [
          ...prev,
          {
            imageUrl: URL.createObjectURL(file),
            fileName: file.name,
            senderId: senderid,
            reciverId: reciverid,
            isImage: !isPdf,
            isPdf: isPdf,
            isRead: false,
            date: new Date().toLocaleDateString("en-CA"),
            time: new Date().toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: false,
            }),
          },
        ]);
      } catch (err) {
        console.error("❌ Error uploading file:", err);
      }

      setSelectedFile(null);
    }

    if (input.trim() === "") return;

    if (editIndex !== null) {
      const msgToUpdate = messages[editIndex];
      const updatedMsg = { ...msgToUpdate, text: input };

      setMessages((prev) => {
        const updated = [...prev];
        updated[editIndex] = updatedMsg;
        return updated;
      });

      setEditIndex(null);
      setInput("");


      try {
        const response = await axios.patch(
          baseUrl + "edit_message",
          { messageId: msgToUpdate.messageId, message: updatedMsg.text },
          { headers: { Authorization: token } }
        );


      } catch (err) {
        console.error("❌ Error updating message:", err);
      }
      if (stompClient.current && stompClient.current.connected) {
        stompClient.current.publish({
          destination: "/app/edit_messages",
          headers: { Authorization: token },

          body: JSON.stringify({
            messageId: msgToUpdate.messageId,
            messageContent: updatedMsg.text,
            senderId: senderid,
            reciverId: reciverid,
          }),
        });

        console.log("✅ Edit event sent via WebSocket");
      }


    } else {
      const msg = {
        messageType: "text",
        senderId: senderid,
        reciverId: reciverid,
        messageContent: input,
        date: new Date().toLocaleDateString("en-CA"),
        time: new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }),
      };





      setMessages((prev) => [
        ...prev,
        {
          text: input, senderId: senderid, reciverId: reciverid, isRead: false, time: msg.time, date: msg.date,
        },
      ]);
      setInput("");

      if (stompClient.current && stompClient.current.connected) {
        stompClient.current.publish({
          destination: "/app/send_message",
          body: JSON.stringify(msg),
          headers: { Authorization: token },
        });
      } else {
        console.warn("⚠️ WebSocket not connected");
      }
    }
  };

  const handleDelete = async (index, messageId) => {
    setMessages((prev) => prev.filter((_, i) => i !== index));
    setMenuOpenIndex(null);

    try {
      await axios.delete(baseUrl + "deleteById", {
        headers: { Authorization: token },
        data: { id: messageId, senderId: senderid },
      });
    } catch (err) {
      console.error("❌ Error deleting message:", err);
    }
  };

  const handleEdit = (index, text) => {
    setEditIndex(index);
    setInput(text);
    setMenuOpenIndex(null);
  };

  return (
    <div className="chat-wrapper">
      <div className="glass-card chat-card">
        <div className="chat-header-glass">
          {onClose && (
            <button
              onClick={onClose}
              style={{ background: "transparent", border: "none", color: "var(--text-main)", cursor: "pointer", marginRight: "15px", display: "flex", alignItems: "center", padding: "8px 4px" }}
              title="Back"
            >
              <FaArrowLeft size={18} />
            </button>
          )}
          <div
            style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#dfe5e7", marginRight: "15px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0, cursor: profileUrl ? "pointer" : "default" }}
            onClick={() => { if (profileUrl) setZoomImage(profileUrl); }}
            title={profileUrl ? "View profile picture" : ""}
          >
            {profileUrl ? (
              <img
                src={profileUrl}
                alt={name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => { e.target.onerror = null; e.target.style.display = "none"; e.target.nextSibling && (e.target.nextSibling.style.display = "block"); }}
              />
            ) : null}
            <span style={{ fontSize: "24px", color: "#fff", display: profileUrl ? "none" : "block" }}>👤</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "600", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</h3>
          </div>
        </div>

        <div className="whatsapp-bg" style={{ flex: 1, padding: "20px 5%", overflowY: "auto", display: "flex", flexDirection: "column", gap: "2px" }}>
          {messages.map((msg, index) => {
            const isSender = String(msg.senderId) === String(senderid);
            const isFirstInGroup = index === 0 || String(messages[index - 1].senderId) !== String(msg.senderId);
            const isMenuOpen = menuOpenIndex === index;
            return (
              <div
                key={index}
                className={`chat-bubble-container ${isSender ? "sent" : "received"}`}
                style={{
                  marginBottom: isFirstInGroup && index !== 0 ? "10px" : "2px",
                  zIndex: isMenuOpen ? 50 : undefined,
                  position: isMenuOpen ? "relative" : undefined,
                }}
              >
                <div
                  className={`animate-slide-up chat-bubble ${isSender ? "chat-bubble-sent" : "chat-bubble-received"}`}
                  style={{
                    borderTopRightRadius: isSender && isFirstInGroup ? "4px" : undefined,
                    borderTopLeftRadius: !isSender && isFirstInGroup ? "4px" : undefined,
                    zIndex: isMenuOpen ? 50 : undefined,
                  }}
                >
                  {isSender && (
                    <button
                      style={{ position: "absolute", top: "4px", right: "6px", background: "transparent", border: "none", color: "white", cursor: "pointer", fontSize: "16px" }}
                      onClick={() =>
                        setMenuOpenIndex(menuOpenIndex === index ? null : index)
                      }
                    >
                      ⋮
                    </button>
                  )}

                  <div style={{ paddingRight: msg.text ? "45px" : "0", paddingBottom: msg.text ? "10px" : "0" }}>
                    {msg.text}
                  </div>

                  {msg.isImage ? (
                    <img
                      src={msg.imageUrl}
                      alt="uploaded"
                      style={{
                        maxWidth: "200px",
                        borderRadius: "6px",
                        marginTop: "2px",
                      }}
                    />
                  ) : msg.isPdf ? (
                    <div style={{ marginTop: "2px", display: "flex", alignItems: "center", gap: "8px", background: "rgba(0,0,0,0.2)", padding: "10px", borderRadius: "6px" }}>
                      <span style={{ fontSize: "24px" }}>📄</span>
                      <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none", fontSize: "14px", fontWeight: "500", wordBreak: "break-all" }}>
                        {msg.fileName || "Document.pdf"}
                      </a>
                    </div>
                  ) : (
                    <></>
                  )}

                  <div style={{ position: msg.text ? "absolute" : "relative", bottom: "4px", right: "6px", display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", color: "rgba(255, 255, 255, 0.6)" }}>
                    {msg.isEdited && <span style={{ fontStyle: "italic" }}>edited</span>}
                    <span>{msg.time}</span>
                    {isSender && (
                      msg.isRead ? (
                        <FaCheckDouble style={{ color: "#53bdeb" }} size={13} title="Read" />
                      ) : (
                        <FaCheck style={{ color: "rgba(255,255,255,0.6)" }} size={11} title="Sent" />
                      )
                    )}
                  </div>

                  {menuOpenIndex === index && (
                    <div style={{
                      position: "absolute",
                      [index === messages.length - 1 ? "bottom" : "top"]: "28px",
                      right: "6px",
                      background: "white",
                      border: "1px solid #ccc",
                      borderRadius: "6px",
                      boxShadow: "0 3px 8px rgba(0,0,0,0.25)",
                      zIndex: 10,
                      display: "flex",
                      flexDirection: "column",
                      overflow: "hidden"
                    }}>
                      <button
                        style={{ padding: "8px 12px", border: "none", background: "transparent", cursor: "pointer", textAlign: "left", fontSize: "13px", color: "#333" }}
                        onClick={() => handleEdit(index, msg.text)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        style={{ padding: "8px 12px", border: "none", borderTop: "1px solid #eee", background: "transparent", cursor: "pointer", textAlign: "left", fontSize: "13px", color: "#333" }}
                        onClick={() => handleDelete(index, msg.messageId)}
                      >
                        🗑 Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        <input
          id="chat-file-upload"
          type="file"
          accept="image/*,application/pdf"
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />

        {selectedFile && (
          <div style={{ padding: "10px 15px", background: "rgba(15, 23, 42, 0.6)", borderTop: "1px solid var(--glass-border)", display: "flex", alignItems: "center", gap: "12px", backdropFilter: "blur(10px)" }}>
            <div style={{ position: "relative" }}>
              {selectedFile.type.startsWith("image/") ? (
                <img src={URL.createObjectURL(selectedFile)} alt="preview" style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "8px", border: "1px solid #ddd" }} />
              ) : (
                <div style={{ width: "50px", height: "50px", borderRadius: "8px", background: "#f0f0f0", border: "1px solid #ddd", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>📄</div>
              )}
              <button
                onClick={() => setSelectedFile(null)}
                style={{ position: "absolute", top: "-6px", right: "-6px", background: "#ff4d4f", color: "white", borderRadius: "50%", width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer", fontSize: "11px", padding: 0, boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }}
                title="Remove file"
              >
                ✕
              </button>
            </div>
            <div style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "13px", color: "var(--text-main)", fontWeight: "500" }}>
              {selectedFile.name}
            </div>
          </div>
        )}

        <div className="chat-input-bar">
          {/* <button
            onClick={() => document.getElementById('chat-file-upload').click()}
            style={{ background: "transparent", border: "none", color: "var(--text-light)", cursor: "pointer", display: "flex", alignItems: "center", padding: "4px" }}
            title="Upload file (PDF/Image)"
          >
            <FaPlus size={18} />
          </button> */}

          <div className="chat-input-container">
            <input
              type="text"
              placeholder={
                editIndex !== null ? "Edit your message..." : "Type a message"
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="chat-input-field"
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
          </div>

          <button onClick={handleSend} className="chat-send-btn">
            <FaPaperPlane size={15} />
          </button>
        </div>
      </div>

      {/* Profile Picture Zoom Modal */}
      {zoomImage && (
        <div className="profile-zoom-modal" onClick={() => setZoomImage(null)}>
          <div className="profile-zoom-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="profile-zoom-title">{name || "Profile"}</h3>
            <div className="profile-zoom-img-container">
              <img
                src={zoomImage}
                alt="Profile"
                className="profile-zoom-img"
              />
            </div>
            <div className="profile-zoom-actions">
              <button
                className="btn btn-secondary btn-block"
                onClick={() => setZoomImage(null)}
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

export default MessageSend;
