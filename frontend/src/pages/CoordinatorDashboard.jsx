import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function CoordinatorDashboard() {
  const [courseId, setCourseId] = useState('');
  const [pendingAssessments, setPendingAssessments] = useState([]);
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const [attCourseId, setAttCourseId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [attStudentId, setAttStudentId] = useState('');
  const [attStatus, setAttStatus] = useState('present');

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const loadPending = async (e) => {
    e.preventDefault();
    setError(''); setMessage('');
    try {
      const res = await axios.get(`https://fetchtms.onrender.com/assessments/pending-review/${courseId}`, { headers: getHeaders() });
      setPendingAssessments(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load pending assessments');
      setPendingAssessments([]);
    }
  };

  const handleReview = async (assessmentId) => {
    setError(''); setMessage('');
    try {
      await axios.patch(`https://fetchtms.onrender.com/assessments/${assessmentId}/review`, {}, { headers: getHeaders() });
      setMessage('Marks reviewed and published successfully');
      setPendingAssessments(prev => prev.filter(a => a.assessment_id !== assessmentId));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to review marks');
    }
  };

  const loadCourseStudentsAndSessions = async (e) => {
    e.preventDefault();
    setError(''); setMessage('');
    try {
      const [regRes, sessRes] = await Promise.all([
        axios.get(`https://fetchtms.onrender.com/registrations/${attCourseId}`, { headers: getHeaders() }),
        axios.get(`https://fetchtms.onrender.com/course-sessions/${attCourseId}`, { headers: getHeaders() })
      ]);
      setStudents(regRes.data);
      setSessions(sessRes.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load students for this course');
      setStudents([]);
      setSessions([]);
    }
  };

  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    setError(''); setMessage('');
    try {
      await axios.post('https://fetchtms.onrender.com/attendance', {
        session_id: sessionId,
        student_id: attStudentId,
        status: attStatus
      }, { headers: getHeaders() });
      setMessage('Attendance marked successfully');
      setAttStudentId('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to mark attendance');
    }
  };

  return (
    <div style={{ maxWidth: '700px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Coordinator Dashboard</h2>
        <button onClick={handleLogout}>Log Out</button>
      </div>
      <span className="page-subtitle">Review and publish marks, and manage attendance for your assigned course</span>

      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h3>View Pending Marks for Review</h3>
      <form onSubmit={loadPending} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          value={courseId}
          onChange={e => setCourseId(e.target.value)}
          placeholder="Enter Course ID"
          style={{ flex: 1, padding: '8px' }}
          required
        />
        <button type="submit" style={{ padding: '8px 16px' }}>Load</button>
      </form>

      {pendingAssessments.length > 0 ? (
        <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '30px' }}>
          <thead>
            <tr><th>Student ID</th><th>Module ID</th><th>Marks</th><th>Grade</th><th>Action</th></tr>
          </thead>
          <tbody>
            {pendingAssessments.map(a => (
              <tr key={a.assessment_id}>
                <td>{a.student_id}</td>
                <td>{a.module_id}</td>
                <td>{a.marks}</td>
                <td>{a.grade}</td>
                <td>
                  <button onClick={() => handleReview(a.assessment_id)} style={{ padding: '4px 10px' }}>
                    Approve & Publish
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p style={{ marginBottom: '30px' }}>No pending marks loaded. Enter a Course ID and click Load.</p>
      )}

      <h3>My Course — Students & Attendance</h3>
      <form onSubmit={loadCourseStudentsAndSessions} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          value={attCourseId}
          onChange={e => setAttCourseId(e.target.value)}
          placeholder="Enter Course ID"
          style={{ flex: 1, padding: '8px' }}
          required
        />
        <button type="submit" style={{ padding: '8px 16px' }}>Load Students</button>
      </form>

      {students.length > 0 && (
        <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '20px' }}>
          <thead>
            <tr><th>Student ID</th><th>Name</th><th>Email</th><th>Status</th></tr>
          </thead>
          <tbody>
            {students.map(r => (
              <tr key={r.registration_id}>
                <td>{r.student_id}</td>
                <td>{r.student?.full_name || '—'}</td>
                <td>{r.student?.email || '—'}</td>
                <td>{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {students.length > 0 && (
        <form onSubmit={handleMarkAttendance} style={{ marginBottom: '30px' }}>
          <div style={{ marginBottom: '10px' }}>
            <label>Session</label><br />
            <select value={sessionId} onChange={e => setSessionId(e.target.value)} style={{ width: '100%', padding: '8px' }} required>
              <option value="">Select Session</option>
              {sessions.map(s => (
                <option key={s.session_id} value={s.session_id}>
                  {s.session_date} ({s.start_time}–{s.end_time})
                </option>
              ))}
            </select>
            {sessions.length === 0 && (
              <p style={{ fontSize: '13px', color: 'gray', marginTop: '4px' }}>
                No sessions found for this course yet.
              </p>
            )}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Student</label><br />
            <select value={attStudentId} onChange={e => setAttStudentId(e.target.value)} style={{ width: '100%', padding: '8px' }} required>
              <option value="">Select Student</option>
              {students.map(r => (
                <option key={r.student_id} value={r.student_id}>{r.student?.full_name || r.student_id}</option>
              ))}
            </select>
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
      )}
    </div>
  );
}
