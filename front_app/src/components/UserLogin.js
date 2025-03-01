import React, { useState } from 'react';
import { FaReact } from 'react-icons/fa6';
import './style.css';

const UserLogin = ({ setUser }) => {
  const [userName, setUserName] = useState('');

  const handleUser = () => {
    if (!userName) {
      console.log('No username entered');
      return;
    }
    setUser(userName);
  };

  return (
    <div className='login_container'>
      <div className='login_title'>
        <FaReact />
        <h1>6950_chat_app</h1>
      </div>
      <div className='login_form'>
        <input
          type="text"
          placeholder='Enter your username'
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
        />
        <button onClick={handleUser}>Login</button>
      </div>
    </div>
  );
};

export default UserLogin;