import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function ManageUsersPage() {
  const [users, setUsers] = useState([]);
  const [resourcePersons, setResourcePersons] = useState([]);
  const [diagnostics, setDiagnostics] = useState(null);
  const [financialIssues, setFinancialIssues] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [newPasswords, setNewPasswords] = useState({});
  const [linkChoice, setLinkChoice] = useState({});
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

  const loadResourcePersons = () => {
    axios.get('https://fetchtms.onrender.com/resource-persons', { headers: getHeaders() })
      .then(res => setResourcePersons(res.data))
      .catch(() => {});
  };

  const loadDiagnostics = () => {
    axios.get('https://fetchtms.onrender.com/diagnostics/account-links', { headers: getHeaders() })
      .then(res => setDiagnostics(res.data))
      .catch(() => setDiagnostics(null));
  };

  const loadFinancialIssues = () => {
    axios.get('https://fetchtms.onrender.com/diagnostics/financial-integrity', { headers: getHeaders() })
      .then(res => setFinancialIssues(res.data))
      .catch(() => setFinancialIssues(null));
  };

  useEffect(() => { loadUsers(); loadResourcePersons(); loadDiagnostics(); loadFinancialIssues(); }, []);

  const handleBackfillFinancial = async () => {
    setError(''); setMessage('');
    try {
      const res = await axios.post('https://fetchtms.onrender.com/diagnostics/financial-integrity/backfill', {}, { headers: getHeaders() });
      setMessage(res.data.message);
      loadFinancialIssues();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fix financial records');
    }
  };

  const handleLinkResourcePerson = async (userId) => {
    setError(''); setMessage('');
    const trainerId = linkChoice[userId];
    if (!trainerId) {
      setError('Select a resource person to link first');
      return;
    }
    try {
      await axios.patch(`https://fetchtms.onrender.com/users/${userId}/link-resource-person`,
        { trainer_id: trainerId }, { headers: getHeaders() });
      setMessage('Linked successfully');
      loadDiagnostics();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to link');
    }
  };

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

      <h3>Account & Assignment Check</h3>
      {diagnostics ? (
        <div style={{ marginBottom: '20px' }}>
          {diagnostics.studentsWithoutLogin.length === 0 &&
           diagnostics.resourcePersonsWithoutLogin.length === 0 &&
           diagnostics.resourcePersonUserAccountsUnlinked.length === 0 &&
           diagnostics.coordinatorsWithNoCourseAssigned.length === 0 &&
           diagnostics.resourcePersonsWithNoCourseAssigned.length === 0 ? (
            <p style={{ color: '#2e7d32' }}>Everything checked out — no missing links found.</p>
          ) : (
            <>
              {diagnostics.resourcePersonUserAccountsUnlinked.length > 0 && (
                <div style={{ marginBottom: '10px' }}>
                  <p style={{ color: '#c62828', marginBottom: '6px' }}>
                    <strong>Resource person logins not linked to a profile</strong> (this causes "No resource person record linked" errors):
                  </p>
                  {diagnostics.resourcePersonUserAccountsUnlinked.map(u => (
                    <div key={u.user_id} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ minWidth: '120px' }}>{u.username}</span>
                      <select
                        value={linkChoice[u.user_id] || ''}
                        onChange={e => setLinkChoice(prev => ({ ...prev, [u.user_id]: e.target.value }))}
                        style={{ padding: '6px', flex: 1 }}
                      >
                        <option value="">Select the matching resource person...</option>
                        {resourcePersons.map(rp => (
                          <option key={rp.trainer_id} value={rp.trainer_id}>{rp.name} (ID: {rp.trainer_id})</option>
                        ))}
                      </select>
                      <button onClick={() => handleLinkResourcePerson(u.user_id)}>Link</button>
                    </div>
                  ))}
                </div>
              )}
              {diagnostics.resourcePersonsWithoutLogin.length > 0 && (
                <p style={{ color: '#f57c00' }}>
                  <strong>Resource persons with no login account:</strong>{' '}
                  {diagnostics.resourcePersonsWithoutLogin.map(rp => rp.name).join(', ')}
                </p>
              )}
              {diagnostics.studentsWithoutLogin.length > 0 && (
                <p style={{ color: 'gray' }}>
                  <strong>Students with no login account</strong> ({diagnostics.studentsWithoutLogin.length}) — normal unless you need them to log in.
                </p>
              )}
              {diagnostics.coordinatorsWithNoCourseAssigned.length > 0 && (
                <p style={{ color: '#f57c00' }}>
                  <strong>Coordinator accounts with no course assigned:</strong>{' '}
                  {diagnostics.coordinatorsWithNoCourseAssigned.map(u => u.username).join(', ')}
                </p>
              )}
              {diagnostics.resourcePersonsWithNoCourseAssigned.length > 0 && (
                <p style={{ color: '#f57c00' }}>
                  <strong>Resource persons with no course assigned:</strong>{' '}
                  {diagnostics.resourcePersonsWithNoCourseAssigned.map(rp => rp.name).join(', ')}
                </p>
              )}
            </>
          )}
        </div>
      ) : <p style={{ color: 'gray', marginBottom: '20px' }}>Loading account check...</p>}

      <h3>Financial Data Check</h3>
      {financialIssues ? (
        financialIssues.length === 0 ? (
          <p style={{ color: '#2e7d32', marginBottom: '20px' }}>No issues found — every registration with a fee has a matching balance record.</p>
        ) : (
          <div style={{ marginBottom: '20px' }}>
            <p style={{ color: '#c62828' }}>
              <strong>{financialIssues.length} registration(s) show an incorrect balance</strong> (fee owed was never recorded, so the outstanding balance shows as 0 instead of the real amount):
            </p>
            <table border="1" cellPadding="6" style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '10px' }}>
              <thead><tr><th>Student</th><th>Course</th><th>Fee</th></tr></thead>
              <tbody>
                {financialIssues.map(f => (
                  <tr key={f.registration_id}>
                    <td>{f.student_name}</td>
                    <td>{f.course_code} — {f.course_name}</td>
                    <td>{f.fee}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={handleBackfillFinancial}>Fix All Automatically</button>
          </div>
        )
      ) : <p style={{ color: 'gray', marginBottom: '20px' }}>Loading financial check...</p>}

      <h3>All User Accounts</h3>

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
