import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function ResourcePersonDashboard() {
  const [courses, setCourses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [sessCourseId, setSessCourseId] = useState('');
  const [sessDate, setSessDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [venue, setVenue] = useState('');

  const [sessionId, setSessionId] = useState('');
  const [attStudentId, setAttStudentId] = useState('');
  const [attStatus, setAttStatus] = useState('present');

  const [asStudentId, setAsStudentId] = useState('');
  const [asCourseId, setAsCourseId] = useState('');
  const [marks, setMarks] = useState('');
  const [grade, setGrade] = useState('');

  const [publishAssessmentId, setPublishAssessmentId] = useState('');

  const navigate = useNavigate();

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const loadCourses = () => {
    axios.get('http://localhost:4000/courses', { headers: getHeaders() })
      .then(res => setCourses(res.data))
      .catch(err => setError(err.response?.data?.error || 'Failed to load courses'));
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      await axios.post('http://localhost:4000/course-sessions', {
        course_id: sessCourseId,
        session_date: sessDate,
        start_time: startTime,
        end_time: endTime,
        venue
      }, { headers: getHeaders() });
      setMessage('Session created successfully');
      setSessDate('');
      setStartTime('');
      setEndTime('');
      setVenue('');
      if (sessCourseId) loadSessions(sessCourseId);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create session');
    }
  };

  const loadSessions = async (courseId) => {
    if (!courseId) return;
    try {
      const res = await axios.get(`http://localhost:4000/course-sessions/${courseId}`, { headers: getHeaders() });
      setSessions(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load sessions');
    }
  };

  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      await axios.post('http://localhost:4000/attendance', {
        session_id: sessionId,
        student_id: attStudentId,
        status: attStatus
      }, { headers: getHeaders() });
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
      const res = await axios.post('http://localhost:4000/assessments', {
        student_id: asStudentId,
        course_id: asCourseId,
        marks,
        grade
      }, { headers: getHeaders() });
      setMessage(`Marks recorded (not yet published). Assessment ID: ${res.data.assessment.assessment_id}`);
      setAsStudentId('');
      setAsCourseId('');
      setMarks('');
      setGrade('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record marks');
    }
  };

  const handlePublishMarks = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      await axios.patch(`http://localhost:4000/assessments/${publishAssessmentId}/publish`, {}, { headers: getHeaders() });
      setMessage('Marks published successfully');
      setPublishAssessmentId('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to publish marks');
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

      <h3>Create Course Session</h3>
      <form onSubmit={handleCreateSession} style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '10px' }}>
          <label>Course ID</label><br />
          <input value={sessCourseId} onChange={e => setSessCourseId(e.target.value)} style={{ width: '100%', padding: '8px' }} required />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Session Date</label><br />
          <input type="date" value={sessDate} onChange={e => setSessDate(e.target.value)} style={{ width: '100%', padding: '8px' }} required />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Start Time</label><br />
          <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={{ width: '100%', padding: '8px' }} required />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>End Time</label><br />
          <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={{ width: '100%', padding: '8px' }} required />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Venue</label><br />
          <input value={venue} onChange={e => setVenue(e.target.value)} style={{ width: '100%', padding: '8px' }} />
        </div>
        <button type="submit" style={{ padding: '8px 16px' }}>Create Session</button>
      </form>

      <h3>View Sessions for a Course</h3>
      <div style={{ marginBottom: '10px', display: 'flex', gap: '10px' }}>
        <input
          placeholder="Course ID"
          onChange={e => loadSessions(e.target.value)}
          style={{ flex: 1, padding: '8px' }}
        />
      </div>
      <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '30px' }}>
        <thead>
          <tr><th>Session ID</th><th>Date</th><th>Start</th><th>End</th><th>Venue</th></tr>
        </thead>
        <tbody>
          {sessions.map(s => (
            <tr key={s.session_id}>
              <td>{s.session_id}</td>
              <td>{s.session_date}</td>
              <td>{s.start_time}</td>
              <td>{s.end_time}</td>
              <td>{s.venue}</td>
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
      <form onSubmit={handleEnterMarks} style={{ marginBottom: '30px' }}>
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

      <h3>Publish Marks</h3>
      <form onSubmit={handlePublishMarks}>
        <div style={{ marginBottom: '10px' }}>
          <label>Assessment ID</label><br />
          <input value={publishAssessmentId} onChange={e => setPublishAssessmentId(e.target.value)} style={{ width: '100%', padding: '8px' }} required />
        </div>
        <button type="submit" style={{ padding: '8px 16px' }}>Publish Marks</button>
      </form>
    </div>
  );
}