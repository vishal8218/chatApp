import { useEffect, useState } from "react";
import { useAppContext } from "./AppContext";
import axios from "axios";

const ChatHistory = ({ id, name }) => {
  const token = localStorage.getItem("token");
  const { baseUrl } = useAppContext();
  const [data, setData] = useState([]);

  useEffect(() => {
    const getMessages = async () => {
      try {
        const response = await axios.post(
          baseUrl + "get_messages",
          { id },
          { headers: { Authorization: token } }
        );

        // Transform array of arrays into array of objects
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
  }, [baseUrl, id, token]);

  return (
    <div style={styles.chatWrapper}>
      <div style={styles.container}>
        <div style={styles.chatHeader}>
          <h5 style={{ margin: 0 }}>{name}</h5>
        </div>

        <div style={styles.chatBox}>
          {data.length > 0 ? (
            data.map((msg, index) => (
              <div key={index} style={styles.messageWrapper}>
                <div style={styles.messageBubble}>
                  <strong>{msg.messageContent}</strong>
                  <br />
                  <small>
                    {msg.date} {msg.time}
                  </small>
                </div>
              </div>
            ))
          ) : (
            <p style={{ textAlign: "center", color: "#777" }}>No messages found</p>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  chatWrapper: {
    position: "fixed",
    bottom: "20px",
    left: "20px",
    zIndex: 9999,
  },
  container: {
    width: "300px",
    height: "400px",
    display: "flex",
    flexDirection: "column",
    border: "1px solid #ccc",
    borderRadius: "10px",
    overflow: "hidden",
    backgroundColor: "white",
    boxShadow: "0px 4px 8px rgba(0,0,0,0.2)",
    fontFamily: "Arial, sans-serif",
  },
  chatHeader: {
    padding: "10px",
    backgroundColor: "#007bff",
    color: "white",
    fontWeight: "bold",
  },
  chatBox: {
    flex: 1,
    padding: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    overflowY: "auto",
    backgroundColor: "#f9f9f9",
  },
  messageWrapper: {
    display: "flex",
    justifyContent: "flex-start", // LEFT alignment
  },
  messageBubble: {
    padding: "8px 12px",
    borderRadius: "15px",
    backgroundColor: "#e0e0e0",
    maxWidth: "80%",
    textAlign: "left",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
};

export default ChatHistory;
