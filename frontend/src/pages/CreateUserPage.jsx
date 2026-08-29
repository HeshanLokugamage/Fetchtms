import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function CreateUserPage() {
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('student');
  const [newUserStudentId, setNewUserStudentId] = useState('');

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    axios.get('https://fetchtms.onrender.com/students', { headers: getHeaders() })
      .then(res => setStudents(res.data))
      .catch(() => {});
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setMessage(''); setError('');
    try {
      await axios.post('https://fetchtms.onrender.com/users', {
        username: newUsername, password: newPassword, role: newUserRole,
        student_id: newUserRole === 'student' ? newUserStudentId : undefined
      }, { headers: getHeaders() });
      setMessage(`User account "${newUsername}" created successfully`);
      setNewUsername(''); setNewPassword(''); setNewUserRole('student'); setNewUserStudentId('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user account');
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Create User Account</h2>
        <button onClick={() => navigate('/admin/operations')} style={{ padding: '8px 16px' }}>← Back</button>
      </div>

      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleCreateUser}>
        <div style={{ marginBottom: '10px' }}>
          <label>Username</label><br />
          <input value={newUsername} onChange={e => setNewUsername(e.target.value)} style={{ width: '100%', padding: '8px' }} required />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Password</label><br />
          <input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ width: '100%', padding: '8px' }} required />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Role</label><br />
          <select value={newUserRole} onChange={e => setNewUserRole(e.target.value)} style={{ width: '100%', padding: '8px' }}>
            <option value="student">Student</option>
            <option value="resource_person">Resource Person</option>
            <option value="coordinator">Coordinator</option>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        {newUserRole === 'student' && (
          <div style={{ marginBottom: '10px' }}>
            <label>Link to Student</label><br />
            <select
              value={newUserStudentId}
              onChange={e => setNewUserStudentId(e.target.value)}
              style={{ width: '100%', padding: '8px' }}
              required
            >
              <option value="">Select Student</option>
              {students.map(s => (
                <option key={s.student_id} value={s.student_id}>
                  {s.full_name} (ID: {s.student_id})
                </option>
              ))}
            </select>
            {students.length === 0 && (
              <p style={{ fontSize: '13px', color: 'gray', marginTop: '4px' }}>
                No students found — register a student first.
              </p>
            )}
          </div>
        )}
        <button type="submit" style={{ padding: '8px 16px' }}>Create User Account</button>
      </form>
    </div>
  );
}
