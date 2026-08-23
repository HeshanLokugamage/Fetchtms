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
    <div style={{ maxWidth: '400px', margin: '100px auto', fontFamily: 'sans-serif' }}>
      {!showPasswordPrompt ? (
        <>
          <h2>FetchTMS Login</h2>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '10px' }}>
              <label>Username</label><br />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>Password</label><br />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <button type="submit" style={{ padding: '8px 16px' }}>Log In</button>
          </form>
          {message && <p style={{ marginTop: '15px' }}>{message}</p>}
        </>
      ) : (
        <div>
          <h2>Change Your Password?</h2>
          <p>Do you wish to change your password now?</p>

          {passwordError && <p style={{ color: 'red' }}>{passwordError}</p>}

          <form onSubmit={handleChangePassword} style={{ marginBottom: '15px' }}>
            <div style={{ marginBottom: '10px' }}>
              <label>New Password</label><br />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{ width: '100%', padding: '8px' }}
                required
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>Confirm New Password</label><br />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ width: '100%', padding: '8px' }}
                required
              />
            </div>
            <button type="submit" style={{ padding: '8px 16px', marginRight: '10px' }}>Yes, Change Password</button>
          </form>

          <button onClick={handleSkipPasswordChange} style={{ padding: '8px 16px' }}>No, Skip for Now</button>
        </div>
      )}
    </div>
  );
}

export default App;