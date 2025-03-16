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
  const chatListRef = useRef(null); // Automatic scrolling wasn't seeing the bottom
  // Added states for friends list feature
  const [showFriends, setShowFriends] = useState(false);
  const [searchUsername, setSearchUsername] = useState('');
  const [searchResult, setSearchResult] = useState(null);

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

  // Added function to search for a user by username
  const handleSearch = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:3001/auth/search?username=${searchUsername}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setSearchResult(data);
      } else {
        alert(data.message || 'User not found');
        setSearchResult(null);
      }
    } catch (error) {
      alert('An error occurred');
      setSearchResult(null);
    }
  };

  // Added function to add a friend and refresh the profile
  const handleAddFriend = async (username) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:3001/auth/add-friend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username }),
      });
      const data = await response.json();
      if (response.ok) {
        alert('Friend added successfully');
        const profileResponse = await fetch('http://localhost:3001/auth/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const profileData = await profileResponse.json();
        setUser(profileData); // Update user state with new friends list
        setSearchResult(null);
        setSearchUsername('');
      } else {
        alert(data.message || 'Failed to add friend');
      }
    } catch (error) {
      alert('An error occurred');
    }
  };

  if (!user) return <div>Loading...</div>; // Bufferrriinnngggggg

  return (
    <div>
      <div className="chat_header">
        <h4>UserName: {user.username}</h4>
        <p>
          <FaComments className="chat_icon" /> 6950_chat_app
        </p>
        {/* Added Friends button to toggle friends list */}
        <p className="chat_friends" onClick={() => setShowFriends(!showFriends)}>
          <strong>Friends</strong>
        </p>
        <p className="chat_logout" onClick={logout}>
          <strong>Logout</strong>
        </p>
      </div>
      {/* Added friends list UI that appears when showFriends is true */}
      {showFriends && (
        <div className="friends_list">
          <h3>Friends List</h3>
          <div>
            <input
              type="text"
              placeholder="Search username"
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
            />
            <button onClick={handleSearch}>Search</button>
          </div>
          {searchResult && (
            <div>
              <p>{searchResult.username}</p>
              {searchResult._id === user._id ? (
                <p>Cannot add yourself</p>
              ) : user.friends.some(friend => friend._id === searchResult._id) ? (
                <p>Already Friends</p>
              ) : (
                <button onClick={() => handleAddFriend(searchResult.username)}>Add Friend</button>
              )}
            </div>
          )}
          <ul>
            {user.friends.length > 0 ? (
              user.friends.map((friend) => (
                <li key={friend._id}>{friend.username}</li>
              ))
            ) : (
              <p>No friends yet.</p>
            )}
          </ul>
        </div>
      )}
      <ChatList ref={chatListRef} chats={chats} user={user.username} />
      <InputText addMessage={addMessage} />
    </div>
  );
};

export default ChatContainer;