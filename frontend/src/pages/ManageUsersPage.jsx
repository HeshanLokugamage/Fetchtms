import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function ManageUsersPage() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [newPasswords, setNewPasswords] = useState({});
  const navigate = useNavigate();

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const loadUsers = () => {
    axios.get('https://fetchtms.onrender.com/users', { headers: getHeaders() })
      .then(res => setUsers(res.data))
      .catch(err => setError(err.response?.data?.error || 'Failed to load users'));
  };

  useEffect(() => { loadUsers(); }, []);

  const handleReset = async (userId, username) => {
    setError(''); setMessage('');
    const newPassword = newPasswords[userId];
    if (!newPassword || newPassword.length < 4) {
      setError('Enter a new password of at least 4 characters first');
      return;
    }
    try {
      await axios.patch(`https://fetchtms.onrender.com/users/${userId}/reset-password`,
        { newPassword }, { headers: getHeaders() });
      setMessage(`Password reset for ${username}. They will be asked to change it again on next login.`);
      setNewPasswords(prev => ({ ...prev, [userId]: '' }));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password');
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Manage User Accounts</h2>
        <button onClick={() => navigate('/admin/operations')}>← Back</button>
      </div>
      <span className="page-subtitle">Reset any user's password — they'll be prompted to change it again on their next login</span>

      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr><th>Username</th><th>Role</th><th>Active</th><th>New Password</th><th>Action</th></tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.user_id}>
              <td>{u.username}</td>
              <td style={{ textTransform: 'capitalize' }}>{u.role}</td>
              <td>{u.is_active === false ? 'No' : 'Yes'}</td>
              <td>
                <input
                  type="text"
                  placeholder="New password"
                  value={newPasswords[u.user_id] || ''}
                  onChange={e => setNewPasswords(prev => ({ ...prev, [u.user_id]: e.target.value }))}
                  style={{ padding: '6px', width: '140px' }}
                />
              </td>
              <td>
                <button onClick={() => handleReset(u.user_id, u.username)}>Reset Password</button>
              </td>
            </tr>
          ))}
          {users.length === 0 && <tr><td colSpan="5">No user accounts found.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
