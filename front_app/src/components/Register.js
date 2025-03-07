import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaReact } from 'react-icons/fa6';
import './style.css';

const Register = () => {
  const [form, setForm] = useState({      // Track sign-up user information
    username: '',
    password: '',
    email: '',
    firstName: '',
    lastName: '',
    dob: '',
    gender: '',
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value }); // dynamic form text handling
  };

  const handleRegister = async () => {
    // send signup info to backend
    try {
      const response = await fetch('http://localhost:3001/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (response.status === 201) { // if signup successful
        alert('Registration successful');
        navigate('/login');
      } else {
        alert(data.message || 'Registration failed'); // if not
      }
    } catch (error) {
      console.error('Register error:', error); // other possible issues
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
        <input name="username" placeholder="Username" value={form.username} onChange={handleChange} required />
        <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
        <input name="email" type="email" placeholder="Email (optional)" value={form.email} onChange={handleChange} />
        <input name="firstName" placeholder="First Name" value={form.firstName} onChange={handleChange} />
        <input name="lastName" placeholder="Last Name" value={form.lastName} onChange={handleChange} />
        <input name="dob" type="date" value={form.dob} onChange={handleChange} />
        <select name="gender" value={form.gender} onChange={handleChange}>
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
        <button onClick={handleRegister}>Register</button>
        <p>
          Already have an account? <a href="/login">Login</a>
        </p>
      </div>
    </div>
  );
};

export default Register;