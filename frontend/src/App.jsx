import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [pendingRole, setPendingRole] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const goToDashboard = (role) => {
    if (role === 'admin') navigate('/admin');
    else if (role === 'resource_person') navigate('/resource-person');
    else if (role === 'coordinator') navigate('/coordinator');
    else navigate('/student');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const response = await axios.post('https://fetchtms.onrender.com/auth/login', {
        username,
        password
      });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('role', response.data.role);

      if (response.data.forcePasswordReset) {
        setPendingRole(response.data.role);
        setCurrentPassword(password);
        setShowPasswordPrompt(true);
      } else {
        goToDashboard(response.data.role);
      }
    } catch (error) {
      setMessage(error.response?.data?.error || 'Login failed');
    }
  };

  const handleSkipPasswordChange = () => {
    goToDashboard(pendingRole);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.patch('https://fetchtms.onrender.com/users/change-password', {
        currentPassword,
        newPassword
      }, { headers: { Authorization: `Bearer ${token}` } });

      goToDashboard(pendingRole);
    } catch (error) {
      setPasswordError(error.response?.data?.error || 'Failed to change password');
    }
  };

  return (
    <div style={{ maxWidth: '380px', margin: '60px auto' }}>
      {!showPasswordPrompt ? (
        <>
          <h2 style={{ textAlign: 'center', display: 'block' }}>Sign In</h2>
          <p style={{ textAlign: 'center', color: '#777', fontSize: '13px', marginBottom: '20px' }}>
            FetchTMS — Training Management System
          </p>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '14px' }}>
              <label>Username</label><br />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ width: '100%', marginTop: '4px' }}
              />
            </div>
            <div style={{ marginBottom: '18px' }}>
              <label>Password</label><br />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', marginTop: '4px' }}
              />
            </div>
            <button type="submit" style={{ width: '100%' }}>Log In</button>
          </form>
          {message && <p style={{ marginTop: '15px', color: '#c62828', textAlign: 'center' }}>{message}</p>}
        </>
      ) : (
        <div>
          <h2>Change Your Password?</h2>
          <p style={{ color: '#666', marginBottom: '16px' }}>Do you wish to change your password now?</p>

          {passwordError && <p style={{ color: '#c62828' }}>{passwordError}</p>}

          <form onSubmit={handleChangePassword} style={{ marginBottom: '15px' }}>
            <div style={{ marginBottom: '14px' }}>
              <label>New Password</label><br />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{ width: '100%', marginTop: '4px' }}
                required
              />
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label>Confirm New Password</label><br />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ width: '100%', marginTop: '4px' }}
                required
              />
            </div>
            <button type="submit" style={{ marginRight: '10px' }}>Yes, Change Password</button>
          </form>

          <button onClick={handleSkipPasswordChange}>No, Skip for Now</button>
        </div>
      )}
    </div>
  );
}

export default App;
