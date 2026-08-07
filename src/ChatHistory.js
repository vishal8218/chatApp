import { useEffect, useState } from "react";
import { useAppContext } from "./AppContext";
import axios from "axios";

const ChatHistory = ({ id, recid, name }) => {
  const token = localStorage.getItem("token");
  const { baseUrl } = useAppContext();
  const [data, setData] = useState([]);


  useEffect(() => {
    const getSenderName = async () => {
      try {
        await axios.post(
          baseUrl + "get_sender_name",
          { senderId: recid },
          { headers: { Authorization: token } }
        );
      } catch (error) {
        console.log(error);
      }
    };
    getSenderName();
  }, [baseUrl, recid, token]);

  useEffect(() => {
    const getMessages = async () => {
      try {
        const response = await axios.post(
          baseUrl + "get_messages",
          { reciverId: id, senderId: recid },
          { headers: { Authorization: token } }
        );

        const cleanedData = Object.values(response.data).map((msgArr) => {
          const msgObj = {};
          msgArr.forEach((item) => {
            const [key, value] = item.split(" : ").map((s) => s.trim());
            msgObj[key] = value;
          });
          return msgObj;
        });


        setData(cleanedData);

      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    getMessages();
  }, [baseUrl, id, token, recid]);

  return (
    <div style={{ position: "fixed", bottom: "20px", left: "20px", zIndex: 9999 }}>
      <div className="glass-card" style={{ width: "calc(100vw - 40px)", maxWidth: "320px", height: "450px", maxHeight: "calc(100vh - 100px)", display: "flex", flexDirection: "column", padding: "0", background: "var(--bg-main)", border: "1px solid var(--glass-border)" }}>
        {/* HEADER */}
        <div style={{ padding: "10px 16px", background: "var(--glass-bg)", color: "var(--text-main)", display: "flex", alignItems: "center", borderBottom: "1px solid var(--glass-border)", zIndex: 2 }}>
          <div style={{width: "40px", height: "40px", borderRadius: "50%", background: "#dfe5e7", marginRight: "15px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden"}}>
            <span style={{fontSize: "24px", color: "#fff"}}>👤</span>
          </div>
          <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "500" }}>{name}</h3>
        </div>

        {/* CHAT BOX */}
        <div className="whatsapp-bg" style={{ flex: 1, padding: "20px 5%", overflowY: "auto", display: "flex", flexDirection: "column", gap: "2px" }}>
          {data.length > 0 ? (
            data.map((msg, index) => {
              const isSender = msg.senderId === recid;
              const isFirstInGroup = index === 0 || data[index - 1].senderId !== msg.senderId;
              return (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent: isSender ? "flex-end" : "flex-start",
                    marginBottom: isFirstInGroup && index !== 0 ? "10px" : "2px",
                  }}
                >
                  <div
                    style={{
                      padding: "6px 7px 8px 9px",
                      borderRadius: "7.5px",
                      borderTopRightRadius: isSender && isFirstInGroup ? "0px" : "7.5px",
                      borderTopLeftRadius: !isSender && isFirstInGroup ? "0px" : "7.5px",
                      maxWidth: "65%",
                      fontSize: "0.93rem",
                      background: isSender ? "var(--message-sent)" : "var(--message-received)",
                      color: "var(--text-main)",
                      boxShadow: "0 1px 0.5px rgba(11,20,26,.13)",
                      position: "relative",
                      wordBreak: "break-word",
                      lineHeight: "1.4"
                    }}
                  >
                    <div style={{ paddingRight: "45px", paddingBottom: "10px" }}>
                      {msg.messageContent}
                    </div>
                    <div style={{ position: "absolute", bottom: "4px", right: "6px", display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--text-light)" }}>
                      <span>
                        {msg.time}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p style={{ textAlign: "center", color: "#777", marginTop: "20px" }}>
              No messages found
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatHistory;
