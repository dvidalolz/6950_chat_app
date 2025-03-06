import React, { useState, useEffect } from 'react';
import { FaComments } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import ChatList from './ChatList';
import InputText from './InputText';
import socketIOClient from 'socket.io-client';

const ChatContainer = () => {
  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([]);
  const navigate = useNavigate();
  const room = 'general';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await fetch('http://localhost:3001/auth/profile', {
          headers: { Authorization: `Bearer ${token}` },
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

    fetchProfile();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    const socketio = socketIOClient('http://localhost:3001', {
      query: { token: localStorage.getItem('token') },
    });

    socketio.on('connect_error', (err) => {
      if (err.message === 'Authentication error') {
        localStorage.removeItem('token');
        navigate('/login');
      }
    });

    socketio.emit('join_room', room);
    socketio.on('initial_messages', (messages) => setChats(messages));
    socketio.on('new_message', (newMessage) => {
      setChats((prevChats) => [...prevChats, newMessage]);
    });

    return () => socketio.disconnect();
  }, [user, navigate]);

  const addMessage = (message) => {
    const socketio = socketIOClient('http://localhost:3001', {
      query: { token: localStorage.getItem('token') },
    });
    socketio.emit('new_message', { room, message });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  if (!user) return <div>Loading...</div>;

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
      <ChatList chats={chats} user={user.username} />
      <InputText addMessage={addMessage} />
    </div>
  );
};

export default ChatContainer;