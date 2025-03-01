import React, { useState, useEffect } from "react";
import { FaComments } from "react-icons/fa";
import ChatList from "./ChatList";
import InputText from "./InputText";
import UserLogin from "./UserLogin";
import socketIOClient from "socket.io-client";

const ChatContainer = () => {
  const [user, setUser] = useState(localStorage.getItem("user"));
  const [chats, setChats] = useState([]);
  const socketio = socketIOClient("http://localhost:3001");
  const room = "general";

  useEffect(() => {
    if (user) {
      socketio.emit("join_room", room);
    }

    socketio.on("initial_messages", (messages) => {
      setChats(messages);
    });

    socketio.on("new_message", (newMessage) => {
      setChats((prevChats) => [...prevChats, newMessage]);
    });

    return () => {
      socketio.disconnect();
    };
  }, [user]);

  const addMessage = (message) => {
    const newChat = {
      room,
      username: user,
      avatar: localStorage.getItem("avatar"),
      message,
    };
    socketio.emit("new_message", newChat);
  };

  const Logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("avatar");
    setUser(null);
  };

  return (
    <div>
      {user ? (
        <div>
          <div className="chat_header">
            <h4>UserName: {user}</h4>
            <p>
              <FaComments className="chat_icon" /> 6950_chat_app
            </p>
            <p className="chat_logout" onClick={Logout}>
              <strong>Logout</strong>
            </p>
          </div>
          <ChatList chats={chats} user={user} />
          <InputText addMessage={addMessage} />
        </div>
      ) : (
        <UserLogin setUser={(username) => {
          setUser(username);
          localStorage.setItem("user", username);
          localStorage.setItem("avatar", `https://picsum.photos/id/${Math.floor(Math.random() * 1000)}/200/300`);
        }} />
      )}
    </div>
  );
};

export default ChatContainer;