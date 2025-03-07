import React, { useState, useEffect, useRef } from 'react';
import { FaComments } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import ChatList from './ChatList';
import InputText from './InputText';
import socketIOClient from 'socket.io-client';

const ChatContainer = () => {


  const [user, setUser] = useState(null); 
  const [chats, setChats] = useState([]);
  const navigate = useNavigate();
  const room = 'general';  // room name -> future consideration for when its a lot of rooms
  const chatListRef = useRef(null); // Automatic scrolling *wasn't seeing the bottom*

  useEffect(() => {
    // check login key and send back if none
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        // send request to auth, save user info if yes, go back to login if none
        const response = await fetch('http://localhost:3001/auth/profile', {
          headers: { Authorization: `Bearer ${token}` }, // Fulll send it bruv
        });
        const data = await response.json();
        if (data.username) {
          setUser(data);
        } else {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } catch (error) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    };

    fetchProfile(); // run function once inside useEffect when component mounts 
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    // Connect to backend 
    const socketio = socketIOClient('http://localhost:3001', {
      query: { token: localStorage.getItem('token') }, // send key
    });

    // auth error, go back to login
    socketio.on('connect_error', (err) => {
      if (err.message === 'Authentication error') {
        localStorage.removeItem('token');
        navigate('/login');
      }
    });

    socketio.emit('join_room', room);
    socketio.on('initial_messages', (messages) => setChats(messages)); // old messages
    socketio.on('new_message', (newMessage) => {
      setChats((prevChats) => [...prevChats, newMessage]); // dynamic new messages
    });

    return () => socketio.disconnect();
  }, [user, navigate]);

  useEffect(() => {
    if (chatListRef.current) {
      chatListRef.current.scrollTop = chatListRef.current.scrollHeight; // Scroll to the latest message
    }
  }, [chats]); 

  const addMessage = (message) => {
    const socketio = socketIOClient('http://localhost:3001', {
      query: { token: localStorage.getItem('token') }, // token everytime dayumm
    });
    socketio.emit('new_message', { room, message }); // full send new message
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  if (!user) return <div>Loading...</div>; // Bufferrriinnngggggg

  return (
    <div>
      <div className="chat_header">
        <h4>UserName: {user.username}</h4>
        <p>
          <FaComments className="chat_icon" /> 6950_chat_app
        </p>
        <p className="chat_logout" onClick={logout}>
          <strong>Logout</strong>
        </p>
      </div>
      {}
      <ChatList ref={chatListRef} chats={chats} user={user.username} />
      <InputText addMessage={addMessage} />
    </div>
  );
};

export default ChatContainer;