import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  const [pin, setPin] = useState('');
  const handleLogin = (e) => {
    e.preventDefault();
    if (pin === '1234') onLogin();
    else alert('Incorrect Admin PIN');
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#121212', color: 'white' }}>
      <form onSubmit={handleLogin} style={{ background: '#1e1e1e', padding: '40px', borderRadius: '10px', textAlign: 'center' }}>
        <h1 style={{ color: '#ff4d4d' }}>Admin Login</h1>
        <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="Enter PIN" style={{ padding: '10px', margin: '20px 0', width: '100%' }} />
        <button type="submit" style={{ width: '100%', padding: '10px', background: '#ff4d4d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Unlock Dashboards</button>
      </form>
    </div>
  );
};

export default Login;