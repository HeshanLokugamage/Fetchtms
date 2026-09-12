import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function CoordinatorDashboard() {
  const [myCourses, setMyCourses] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [allAssessments, setAllAssessments] = useState([]);
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const [attCourseId, setAttCourseId] = useState('');
  const [attStudentId, setAttStudentId] = useState('');
  const [attendedSessionIds, setAttendedSessionIds] = useState([]);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    axios.get('https://fetchtms.onrender.com/course-coordinators/my', { headers: getHeaders() })
      .then(res => setMyCourses(res.data))
      .catch(err => setError(err.response?.data?.error || 'Failed to load your assigned courses'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const loadMarks = async (e) => {
    if (e) e.preventDefault();
    setError(''); setMessage('');
    try {
      const res = await axios.get(`https://fetchtms.onrender.com/assessments/course/${courseId}`, { headers: getHeaders() });
      setAllAssessments(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load marks');
      setAllAssessments([]);
    }
  };

  const handleReview = async (assessmentId) => {
    setError(''); setMessage('');
    try {
      await axios.patch(`https://fetchtms.onrender.com/assessments/${assessmentId}/review`, {}, { headers: getHeaders() });
      setMessage('Marks reviewed and published successfully');
      setAllAssessments(prev => prev.map(a => a.assessment_id === assessmentId ? { ...a, reviewed: true, published: true } : a));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to review marks');
    }
  };

  const loadCourseStudentsAndSessions = async (e) => {
    if (e) e.preventDefault();
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

  const selectAttendanceStudent = (studentId) => {
    setAttStudentId(studentId);
    if (studentId && attCourseId) {
      axios.get(`https://fetchtms.onrender.com/attendance/course/${attCourseId}/student/${studentId}`, { headers: getHeaders() })
        .then(res => setAttendedSessionIds(res.data.filter(a => a.status === 'present').map(a => a.session_id)))
        .catch(() => setAttendedSessionIds([]));
    } else {
      setAttendedSessionIds([]);
    }
  };

  const toggleAttendedSession = (id) => {
    setAttendedSessionIds(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    setError(''); setMessage('');
    try {
      await Promise.all(sessions.map(s =>
        axios.post('https://fetchtms.onrender.com/attendance', {
          session_id: s.session_id,
          student_id: attStudentId,
          status: attendedSessionIds.includes(s.session_id) ? 'present' : 'absent'
        }, { headers: getHeaders() })
      ));
      setMessage('Attendance saved successfully for all sessions shown');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to mark attendance');
    }
  };

  const selectCourse = (id) => {
    setCourseId(id);
    setAttCourseId(id);
    setAttStudentId('');
    setAttendedSessionIds([]);
    loadMarks();
    loadCourseStudentsAndSessions();
  };

  return (
    <div style={{ maxWidth: '700px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Coordinator Dashboard</h2>
        <button onClick={handleLogout}>Log Out</button>
      </div>
      <span className="page-subtitle">Review and publish marks, and manage attendance for your assigned courses</span>

      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h3>My Assigned Courses</h3>
      {myCourses.length > 0 ? (
        <div className="btn-row" style={{ marginBottom: '20px' }}>
          {myCourses.map(c => (
            <button
              key={c.course_id}
              onClick={() => selectCourse(c.course_id)}
              style={String(c.course_id) === String(courseId) ? {
                background: '#2e7d32', color: '#fff', borderColor: '#2e7d32', fontWeight: 'bold'
              } : undefined}
            >
              {c.course_code ? `${c.course_code} — ${c.course_name}` : `Course ${c.course_id}`}
            </button>
          ))}
        </div>
      ) : (
        <p style={{ marginBottom: '20px', color: 'gray' }}>No courses assigned to you yet — ask an admin to assign you as coordinator.</p>
      )}

      <h3>Marks for Selected Course</h3>
      {courseId ? (
        allAssessments.length > 0 ? (
          <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '30px' }}>
            <thead>
              <tr><th>Student</th><th>Module</th><th>Type</th><th>Marks</th><th>Grade</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {allAssessments.map(a => (
                <tr key={a.assessment_id}>
                  <td>{a.student_name || a.student_id}</td>
                  <td>{a.module_name || a.module_id}</td>
                  <td style={{ textTransform: 'capitalize' }}>{a.eval_type}</td>
                  <td>{a.marks}</td>
                  <td>{a.grade}</td>
                  <td>{a.reviewed ? 'Published' : 'Pending Review'}</td>
                  <td>
                    {!a.reviewed && (
                      <button onClick={() => handleReview(a.assessment_id)} style={{ padding: '4px 10px' }}>
                        Approve & Publish
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ marginBottom: '30px' }}>No marks have been entered for this course yet.</p>
        )
      ) : (
        <p style={{ marginBottom: '30px', color: 'gray' }}>Select a course above to view its marks.</p>
      )}

      <h3>Students & Attendance</h3>
      {!attCourseId && (
        <p style={{ marginBottom: '20px', color: 'gray' }}>Select a course above to view its registered students.</p>
      )}

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

      {attCourseId && students.length === 0 && (
        <p style={{ marginBottom: '20px', color: 'gray' }}>No students registered for this course yet.</p>
      )}

      {students.length > 0 && (
        <form onSubmit={handleMarkAttendance} style={{ marginBottom: '30px' }}>
          <div style={{ marginBottom: '10px' }}>
            <label>Student</label><br />
            <select value={attStudentId} onChange={e => selectAttendanceStudent(e.target.value)} style={{ width: '100%', padding: '8px' }} required>
              <option value="">Select Student</option>
              {students.map(r => (
                <option key={r.student_id} value={r.student_id}>{r.student?.full_name || r.student_id}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Tick the dates attended</label><br />
            {sessions.length === 0 && (
              <p style={{ fontSize: '13px', color: 'gray', marginTop: '4px' }}>No sessions found for this course yet.</p>
            )}
            {sessions.map(s => (
              <label key={s.session_id} style={{ display: 'block', marginBottom: '6px' }}>
                <input
                  type="checkbox"
                  checked={attendedSessionIds.includes(s.session_id)}
                  onChange={() => toggleAttendedSession(s.session_id)}
                  disabled={!attStudentId}
                  style={{ marginRight: '6px' }}
                />
                {s.session_date} ({s.start_time}–{s.end_time})
              </label>
            ))}
            {attStudentId && (
              <p style={{ fontSize: '12px', color: 'gray', marginTop: '4px' }}>
                Ticked dates are saved as Present; unticked dates are saved as Absent.
              </p>
            )}
          </div>
          <button type="submit" style={{ padding: '8px 16px' }} disabled={!attStudentId || sessions.length === 0}>Save Attendance</button>
        </form>
      )}
    </div>
  );
}
