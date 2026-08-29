import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function RegisterCoursePage() {
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [regStudentId, setRegStudentId] = useState('');
  const [regCourseId, setRegCourseId] = useState('');

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    axios.get('https://fetchtms.onrender.com/students', { headers: getHeaders() })
      .then(res => setStudents(res.data))
      .catch(() => {});

    axios.get('https://fetchtms.onrender.com/courses', { headers: getHeaders() })
      .then(res => setCourses(res.data))
      .catch(() => {});
  }, []);

  const selectedCourse = courses.find(c => String(c.course_id) === String(regCourseId));

  const handleRegisterForCourse = async (e) => {
    e.preventDefault();
    setMessage(''); setError('');
    try {
      const res = await axios.post('https://fetchtms.onrender.com/registrations', {
        student_id: regStudentId, course_id: regCourseId
      }, { headers: getHeaders() });
      setMessage(`Student registered for course successfully. Amount to be paid: ${res.data.fee}`);
      setRegStudentId(''); setRegCourseId('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register student for course');
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Register Student for Course</h2>
        <button onClick={() => navigate('/admin/operations')} style={{ padding: '8px 16px' }}>← Back</button>
      </div>

      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleRegisterForCourse}>
        <div style={{ marginBottom: '10px' }}>
          <label>Student</label><br />
          <select value={regStudentId} onChange={e => setRegStudentId(e.target.value)} style={{ width: '100%', padding: '8px' }} required>
            <option value="">Select Student</option>
            {students.map(s => (
              <option key={s.student_id} value={s.student_id}>
                {s.full_name}
              </option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Course</label><br />
          <select value={regCourseId} onChange={e => setRegCourseId(e.target.value)} style={{ width: '100%', padding: '8px' }} required>
            <option value="">Select Course</option>
            {courses.map(c => (
              <option key={c.course_id} value={c.course_id}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
        </div>
        {selectedCourse && (
          <p style={{ fontSize: '13px', color: 'gray', marginBottom: '10px' }}>
            Course fee: {selectedCourse.fee || 0}
          </p>
        )}
        <button type="submit" style={{ padding: '8px 16px' }}>Register</button>
      </form>
    </div>
  );
}