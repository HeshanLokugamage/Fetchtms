import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function ResourcePersonDashboard() {
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [sessionId, setSessionId] = useState('');
  const [attStudentId, setAttStudentId] = useState('');
  const [attStatus, setAttStatus] = useState('present');

  const [asStudentId, setAsStudentId] = useState('');
  const [asCourseId, setAsCourseId] = useState('');
  const [marks, setMarks] = useState('');
  const [grade, setGrade] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    axios.get('http://localhost:4000/courses', { headers })
      .then(res => setCourses(res.data))
      .catch(err => setError(err.response?.data?.error || 'Failed to load courses'));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post('http://localhost:4000/attendance', {
        session_id: sessionId,
        student_id: attStudentId,
        status: attStatus
      }, { headers });
      setMessage('Attendance marked successfully');
      setSessionId('');
      setAttStudentId('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to mark attendance');
    }
  };

  const handleEnterMarks = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post('http://localhost:4000/assessments', {
        student_id: asStudentId,
        course_id: asCourseId,
        marks,
        grade
      }, { headers });
      setMessage('Marks recorded (not yet published)');
      setAsStudentId('');
      setAsCourseId('');
      setMarks('');
      setGrade('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record marks');
    }
  };

  return (
    <div style={{ maxWidth: '700px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Resource Person Dashboard</h2>
        <button onClick={handleLogout} style={{ padding: '8px 16px' }}>Log Out</button>
      </div>

      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h3>Courses ({courses.length})</h3>
      <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '30px' }}>
        <thead>
          <tr><th>ID</th><th>Code</th><th>Name</th><th>Status</th></tr>
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

      <h3>Mark Attendance</h3>
      <form onSubmit={handleMarkAttendance} style={{ marginBottom: '30px' }}>
        <div style={{ marginBottom: '10px' }}>
          <label>Session ID</label><br />
          <input value={sessionId} onChange={e => setSessionId(e.target.value)} style={{ width: '100%', padding: '8px' }} required />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Student ID</label><br />
          <input value={attStudentId} onChange={e => setAttStudentId(e.target.value)} style={{ width: '100%', padding: '8px' }} required />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Status</label><br />
          <select value={attStatus} onChange={e => setAttStatus(e.target.value)} style={{ width: '100%', padding: '8px' }}>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
          </select>
        </div>
        <button type="submit" style={{ padding: '8px 16px' }}>Mark Attendance</button>
      </form>

      <h3>Enter Assessment Marks</h3>
      <form onSubmit={handleEnterMarks}>
        <div style={{ marginBottom: '10px' }}>
          <label>Student ID</label><br />
          <input value={asStudentId} onChange={e => setAsStudentId(e.target.value)} style={{ width: '100%', padding: '8px' }} required />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Course ID</label><br />
          <input value={asCourseId} onChange={e => setAsCourseId(e.target.value)} style={{ width: '100%', padding: '8px' }} required />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Marks</label><br />
          <input type="number" value={marks} onChange={e => setMarks(e.target.value)} style={{ width: '100%', padding: '8px' }} required />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Grade</label><br />
          <input value={grade} onChange={e => setGrade(e.target.value)} style={{ width: '100%', padding: '8px' }} required />
        </div>
        <button type="submit" style={{ padding: '8px 16px' }}>Submit Marks</button>
      </form>
    </div>
  );
}