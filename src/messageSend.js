import axios from "axios";
import React, {  useEffect, useState } from "react";
import { FaPaperPlane } from "react-icons/fa";
import { useAppContext } from "./AppContext";

const MessageSend = ({senderid,reciverid,name}) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const token = localStorage.getItem("token");
  const {baseUrl}=useAppContext();

   useEffect (() => {
    setMessages([])
   },[reciverid])
   
  const handleSend =async () => {
    
  
    if (input.trim() === "") 
      {
        alert("Enter message")
        return;
      }
      else
    {
       setMessages((prev) => [...prev, { text: input, sender: "You" }]);
     setInput("")
        const response=await axios.post(baseUrl+"send_message",{
         messageType:"text",
      senderId:senderid,
  reciverId:reciverid,
  messageContent:input
        },
    {
 headers:
          {
            Authorization:token
          }
    })
    }
   
  };

  return (
    <div style={styles.chatWrapper}>
      <div style={styles.container}>
        <div style={styles.chatBox}>
          <div align="left">
            <h5>{name}</h5>
            </div>
          {messages.map((msg, index) => (
            <div
              key={index}
              style={{
                ...styles.message,
                alignSelf: msg.sender === "You" ? "flex-end" : "flex-start",
                backgroundColor: msg.sender === "You" ? "#4cafef" : "#eee",
                color: msg.sender === "You" ? "white" : "black",
              }}
            >
              {msg.text}
            </div>
          ))}
        </div>

        <div style={styles.inputArea}>
          <input
            type="text"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={styles.input}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button onClick={handleSend} style={styles.sendButton}>
            <FaPaperPlane size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  chatWrapper: {
    position: "fixed",
    bottom: "20px",
    right: "20px",
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
  chatBox: {
    flex: 1,
    padding: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    overflowY: "auto",
    backgroundColor: "#f9f9f9",
  },
  message: {
    padding: "8px 12px",
    borderRadius: "15px",
    maxWidth: "70%",
  },
  inputArea: {
    display: "flex",
    borderTop: "1px solid #ccc",
    padding: "5px",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    border: "none",
    outline: "none",
    padding: "10px",
    fontSize: "14px",
  },
  sendButton: {
    backgroundColor: "#4cafef",
    border: "none",
    color: "white",
    padding: "10px",
    borderRadius: "5px",
    cursor: "pointer",
  },
};

export default MessageSend;
