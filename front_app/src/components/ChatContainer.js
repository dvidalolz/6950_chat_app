import React, { useState, useEffect, useRef } from 'react';
import { FaComments } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import ChatList from './ChatList';
import InputText from './InputText';
import socketIOClient from 'socket.io-client';

const ChatContainer = () => {
  const [user, setUser] = useState(null); 
  const [chatRooms, setChatRooms] = useState([]);
  const [currentChatRoom, setCurrentChatRoom] = useState(null);
  const [messages, setMessages] = useState({});
  const navigate = useNavigate();
  const chatListRef = useRef(null); // Automatic scrolling wasn't seeing the bottom
  const socketRef = useRef(null);
  // Added states for friends list feature
  const [showFriends, setShowFriends] = useState(false);
  const [searchUsername, setSearchUsername] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [showInvite, setShowInvite] = useState(false);

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
          // Fetch chat rooms
          const chatRoomsResponse = await fetch('http://localhost:3001/chatrooms', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const chatRoomsData = await chatRoomsResponse.json();
          if (chatRoomsResponse.ok) {
            setChatRooms(chatRoomsData);
            if (chatRoomsData.length > 0) {
              setCurrentChatRoom(chatRoomsData[0]);
            }
          }
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
    if (!user || chatRooms.length === 0) return;

    // Connect to backend 
    socketRef.current = socketIOClient('http://localhost:3001', {
      query: { token: localStorage.getItem('token') }, // send key
    });

    // auth error, go back to login
    socketRef.current.on('connect_error', (err) => {
      if (err.message === 'Authentication error') {
        localStorage.removeItem('token');
        navigate('/login');
      }
    });

    // Join all chat rooms
    chatRooms.forEach(chatRoom => {
      socketRef.current.emit('join_room', chatRoom._id);
    });

    socketRef.current.on('initial_messages', ({ chatRoomId, messages }) => {
      setMessages(prev => ({
        ...prev,
        [chatRoomId]: messages
      }));
    });

    socketRef.current.on('new_message', (newMessage) => {
      setMessages(prev => ({
        ...prev,
        [newMessage.chatRoom]: [...(prev[newMessage.chatRoom] || []), newMessage]
      }));
    });

    return () => socketRef.current.disconnect();
  }, [user, chatRooms, navigate]);

  useEffect(() => {
    if (chatListRef.current) {
      chatListRef.current.scrollTop = chatListRef.current.scrollHeight; // Scroll to the latest message
    }
  }, [messages, currentChatRoom]);

  const addMessage = (message) => {
    if (socketRef.current && currentChatRoom) {
      socketRef.current.emit('new_message', { chatRoomId: currentChatRoom._id, message });
    }
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

  const handleCreateChatRoom = async () => {
    const name = prompt('Enter chat room name:');
    if (!name) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/chatrooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });
      const data = await response.json();
      if (response.ok) {
        setChatRooms(prev => [...prev, data]);
        setCurrentChatRoom(data);
        socketRef.current.emit('join_room', data._id);
      } else {
        alert(data.message || 'Failed to create chat room');
      }
    } catch (error) {
      alert('An error occurred');
    }
  };

  const handleInviteFriend = async (friendId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/chatrooms/${currentChatRoom._id}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ friendId }),
      });
      const data = await response.json();
      if (response.ok) {
        setChatRooms(prev => prev.map(cr => cr._id === currentChatRoom._id ? data : cr));
      } else {
        alert(data.message || 'Failed to invite friend');
      }
    } catch (error) {
      alert('An error occurred');
    }
  };

  const handleViewFriendChatRooms = async (friendId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/chatrooms/user/${friendId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        alert(`Chat rooms for ${user.friends.find(f => f._id === friendId).username}: ${data.map(cr => cr.name).join(', ')}`);
      } else {
        alert(data.message || 'Failed to fetch chat rooms');
      }
    } catch (error) {
      alert('An error occurred');
    }
  };

  if (!user) return <div>Loading...</div>; // Bufferrriinnngggggg

  return (
    <div className="chat_container">
      <div className="chat_rooms_sidebar">
        <h3>Chat Rooms</h3>
        <ul>
          {chatRooms.map(chatRoom => (
            <li key={chatRoom._id} onClick={() => setCurrentChatRoom(chatRoom)}>
              {chatRoom.name}
            </li>
          ))}
        </ul>
        <button onClick={handleCreateChatRoom}>Create New Chat Room</button>
      </div>
      <div className="chat_main">
        <div className="chat_header">
          <div className="user_info">
            <h4>UserName: {user.username}</h4>
            {currentChatRoom && <p className="chatroom_name">Chatroom: {currentChatRoom.name}</p>}
          </div>
          <div className="header_buttons">
            <p>
              <FaComments className="chat_icon" /> 6950_chat_app
            </p>
            <p className="chat_friends" onClick={() => setShowFriends(!showFriends)}>
              <strong>Friends</strong>
            </p>
            <p className="chat_logout" onClick={logout}>
              <strong>Logout</strong>
            </p>
          </div>
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
                  <li key={friend._id}>
                    {friend.username}
                    <button onClick={() => handleViewFriendChatRooms(friend._id)}>View Chat Rooms</button>
                  </li>
                ))
              ) : (
                <p>No friends yet.</p>
              )}
            </ul>
          </div>
        )}
        {currentChatRoom ? (
          <>
            <ChatList ref={chatListRef} chats={messages[currentChatRoom._id] || []} user={user.username} />
            <InputText addMessage={addMessage} />
            <button onClick={() => setShowInvite(true)}>Invite Friends</button>
            {showInvite && (
              <div className="invite_friends">
                <h3>Invite Friends to {currentChatRoom.name}</h3>
                <ul>
                  {user.friends.filter(friend => !currentChatRoom.members.some(member => member._id === friend._id)).map(friend => (
                    <li key={friend._id}>
                      {friend.username}
                      <button onClick={() => handleInviteFriend(friend._id)}>Invite</button>
                    </li>
                  ))}
                </ul>
                <button onClick={() => setShowInvite(false)}>Close</button>
              </div>
            )}
          </>
        ) : (
          <p>Select a chat room</p>
        )}
      </div>
    </div>
  );
};

export default ChatContainer;