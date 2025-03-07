import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaReact } from 'react-icons/fa6';
import './style.css';

const Login = () => {

  // Track input for username and password
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // switch pages
  const navigate = useNavigate();

  const handleLogin = async () => {
    // send username and password to backend to check if they exist
    try {
      const response = await fetch('http://localhost:3001/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (data.token) { // If token retrieved, proceed to /. If not, errors
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', data.username);
        localStorage.setItem('avatar', data.avatar);
        navigate('/');
      } else {
        alert(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('An error occurred');
    }
  };

  return (
    <div className="login_container">
      <div className="login_title">
        <FaReact />
        <h1>6950_chat_app</h1>
      </div>
      <div className="login_form">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)} // update username as you type
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)} // update username as you type
        />
        <button onClick={handleLogin}>Login</button>
        <p>
          Don't have an account? <a href="/register">Register</a>
        </p>
      </div>
    </div>
  );
};

export default Login;