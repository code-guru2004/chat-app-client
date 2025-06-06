import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import "./App.css";

const socket = io("http://localhost:3000");

function App() {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [hasJoined, setHasJoined] = useState(false);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [typingUser, setTypingUser] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chat]); // Triggers on new message
  
  useEffect(() => {
    socket.on("receive_message", (data) => {
      setChat((prev) => [...prev, data]);
      setTypingUser(""); // Clear typing when message received
    });

    socket.on("user_joined", (data) => {
      setChat((prev) => [
        ...prev,
        { user: "system", text: `🔔 ${data.user} joined the room` },
      ]);
    });

    socket.on("user_typing", ({ user }) => {
      if (user !== username) {
        setTypingUser(user);

        // Clear typing indicator after 2 seconds
        setTimeout(() => {
          setTypingUser("");
        }, 2000);
      }
    });

    return () => {
      socket.off("receive_message");
      socket.off("user_joined");
      socket.off("user_typing");
    };
  }, [username]);

  const joinRoom = (e) => {
    e.preventDefault();
    if (username.trim() && room.trim()) {
      socket.emit("join_room", { room, user: username });
      setHasJoined(true);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      socket.emit("send_message", { room, user: username, text: message });
      setMessage("");
    }
  };

  if (!hasJoined) {
    return (
      <div className="app">
        <form className="chat-container" onSubmit={joinRoom}>
          <header className="chat-header">
            <h2>Join Chat Room</h2>
          </header>
          <div className="chat-box">
            <input
              type="text"
              placeholder="Enter your name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="chat-input"
            />
            <input
              type="text"
              placeholder="Enter room code"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="chat-input"
              style={{ marginTop: "1rem" }}
            />
            <button
              type="submit"
              className="send-btn"
              style={{ marginTop: "1rem" }}
            >
              Join
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="chat-container">
        <header className="chat-header">
          <h2>Room: {room}</h2>
        </header>

        <div className="chat-box">
          {chat.map((msg, idx) => {
            if (msg.user === "system") {
              return (
                <div key={idx} className="chat-message system">
                  {msg.text}
                </div>
              );
            }

            return (
              <div
                key={idx}
                className={`chat-message ${
                  msg.user === username ? "own-message" : "other-message"
                }`}
              >
                <div className="chat-username">{msg.user === username? "You" :msg.user }</div>
                <div className="chat-text">{msg.text}</div>
              </div>
            );
          })}

          {typingUser && (
            <div className="chat-message typing-message other-message">
              <div className="chat-username">{typingUser}</div>
              <div className="chat-text">
                <TypingAnimation />
              </div>
            </div>
          )}
          <div ref={bottomRef} />

        </div>

        <form className="chat-form" onSubmit={sendMessage}>
          <input
            type="text"
            value={message}
            placeholder="Type a message..."
            onChange={(e) => {
              setMessage(e.target.value);
              socket.emit("typing", { room, user: username });
            }}
            className="chat-input"
          />
          <button type="submit" className="send-btn">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

function TypingAnimation() {
  return (
    <span className="typing-dots">
      <span className="dot" />
      <span className="dot" />
      <span className="dot" />
    </span>
  );
}

export default App;
