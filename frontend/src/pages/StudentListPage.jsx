import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function StudentListPage() {
  const [students, setStudents] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    axios.get('https://fetchtms.onrender.com/students', { headers: getHeaders() })
      .then(res => setStudents(res.data))
      .catch(err => setError(err.response?.data?.error || 'Failed to load students'));
  }, []);

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Students List</h2>
        <button onClick={() => navigate('/admin/students')} style={{ padding: '8px 16px' }}>← Back to Students</button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h3>Students ({students.length})</h3>
      <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr><th>ID</th><th>Full Name</th><th>Email</th><th>Status</th></tr>
        </thead>
        <tbody>
          {students.map(s => (
            <tr key={s.student_id}>
              <td>{s.student_id}</td><td>{s.full_name}</td><td>{s.email}</td><td>{s.registration_status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}