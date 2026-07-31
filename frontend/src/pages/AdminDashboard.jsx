import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    axios.get('http://localhost:4000/students', { headers })
      .then(res => setStudents(res.data))
      .catch(err => setError(err.response?.data?.error || 'Failed to load students'));

    axios.get('http://localhost:4000/courses', { headers })
      .then(res => setCourses(res.data))
      .catch(err => setError(err.response?.data?.error || 'Failed to load courses'));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Admin Dashboard</h2>
        <button onClick={handleLogout} style={{ padding: '8px 16px' }}>Log Out</button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h3>Students ({students.length})</h3>
      <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '30px' }}>
        <thead>
          <tr>
            <th>ID</th><th>Full Name</th><th>Email</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          {students.map(s => (
            <tr key={s.student_id}>
              <td>{s.student_id}</td>
              <td>{s.full_name}</td>
              <td>{s.email}</td>
              <td>{s.registration_status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Courses ({courses.length})</h3>
      <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th>ID</th><th>Code</th><th>Name</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          {courses.map(c => (
            <tr key={c.course_id}>
              <td>{c.course_id}</td>
              <td>{c.code}</td>
              <td>{c.name}</td>
              <td>{c.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}