import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function ResourcePersonDashboard() {
  const [courses, setCourses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [students, setStudents] = useState([]);
  const [modules, setModules] = useState([]);
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
  const [asModuleId, setAsModuleId] = useState('');
  const [evalType, setEvalType] = useState('assignment');
  const [marks, setMarks] = useState('');

  const navigate = useNavigate();

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const loadCourses = () => {
    axios.get('https://fetchtms.onrender.com/courses', { headers: getHeaders() })
      .then(res => setCourses(res.data))
      .catch(err => setError(err.response?.data?.error || 'Failed to load courses'));
  };

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (asCourseId) {
      axios.get(`https://fetchtms.onrender.com/modules/${asCourseId}`, { headers: getHeaders() })
        .then(res => setModules(res.data))
        .catch(() => setModules([]));
    } else {
      setModules([]);
    }
  }, [asCourseId]);

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
      await axios.post('https://fetchtms.onrender.com/course-sessions', {
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
      const res = await axios.get(`https://fetchtms.onrender.com/course-sessions/${courseId}`, { headers: getHeaders() });
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
      await axios.post('https://fetchtms.onrender.com/attendance', {
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
      const res = await axios.post('https://fetchtms.onrender.com/assessments', {
        student_id: asStudentId,
        course_id: asCourseId,
        module_id: asModuleId,
        eval_type: evalType,
        marks
      }, { headers: getHeaders() });
      setMessage(`Marks recorded (pending coordinator review). Assessment ID: ${res.data.assessment.assessment_id}, Grade: ${res.data.assessment.grade}`);
      setAsStudentId('');
      setAsCourseId('');
      setAsModuleId('');
      setEvalType('assignment');
      setMarks('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record marks');
    }
  };

  return (
    <div style={{ maxWidth: '700px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Resource Person Dashboard</h2>
        <button onClick={handleLogout}>Log Out</button>
      </div>
      <span className="page-subtitle">Manage your courses, sessions, attendance, and module marks</span>

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
          <label>Course</label><br />
          <select value={sessCourseId} onChange={e => setSessCourseId(e.target.value)} style={{ width: '100%', padding: '8px' }} required>
            <option value="">Select Course</option>
            {courses.map(c => (
              <option key={c.course_id} value={c.course_id}>{c.code} — {c.name}</option>
            ))}
          </select>
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
        <select onChange={e => loadSessions(e.target.value)} style={{ flex: 1, padding: '8px' }}>
          <option value="">Select Course</option>
          {courses.map(c => (
            <option key={c.course_id} value={c.course_id}>{c.code} — {c.name}</option>
          ))}
        </select>
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

      <h3>Enter Module Marks</h3>
      <form onSubmit={handleEnterMarks}>
        <div style={{ marginBottom: '10px' }}>
          <label>Student ID</label><br />
          <input value={asStudentId} onChange={e => setAsStudentId(e.target.value)} style={{ width: '100%', padding: '8px' }} required />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Course</label><br />
          <select value={asCourseId} onChange={e => setAsCourseId(e.target.value)} style={{ width: '100%', padding: '8px' }} required>
            <option value="">Select Course</option>
            {courses.map(c => (
              <option key={c.course_id} value={c.course_id}>{c.code} — {c.name}</option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Module</label><br />
          <select value={asModuleId} onChange={e => setAsModuleId(e.target.value)} style={{ width: '100%', padding: '8px' }} required disabled={!asCourseId}>
            <option value="">{asCourseId ? 'Select Module' : 'Select a Course first'}</option>
            {modules.map(m => (
              <option key={m.module_id} value={m.module_id}>{m.module_name} ({m.credits} credits)</option>
            ))}
          </select>
          {asCourseId && modules.length === 0 && (
            <p style={{ fontSize: '13px', color: 'gray', marginTop: '4px' }}>
              No modules found for this course yet — ask admin to create them.
            </p>
          )}
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Evaluation Method</label><br />
          <select value={evalType} onChange={e => setEvalType(e.target.value)} style={{ width: '100%', padding: '8px' }} required>
            <option value="assignment">Assignment</option>
            <option value="exam">Exam</option>
          </select>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Marks</label><br />
          <input type="number" value={marks} onChange={e => setMarks(e.target.value)} style={{ width: '100%', padding: '8px' }} required />
        </div>
        <button type="submit" style={{ padding: '8px 16px' }}>Submit Marks</button>
      </form>
    </div>
  );
}