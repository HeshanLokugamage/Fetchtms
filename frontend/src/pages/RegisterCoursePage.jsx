import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function RegisterCoursePage() {
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const [regStudentId, setRegStudentId] = useState('');
  const [regCourseId, setRegCourseId] = useState('');

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const handleRegisterForCourse = async (e) => {
    e.preventDefault();
    setMessage(''); setError('');
    try {
      await axios.post('https://fetchtms.onrender.com/registrations', {
        student_id: regStudentId, course_id: regCourseId
      }, { headers: getHeaders() });
      setMessage('Student registered for course successfully');
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
          <label>Student ID</label><br />
          <input value={regStudentId} onChange={e => setRegStudentId(e.target.value)} style={{ width: '100%', padding: '8px' }} required />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Course ID</label><br />
          <input value={regCourseId} onChange={e => setRegCourseId(e.target.value)} style={{ width: '100%', padding: '8px' }} required />
        </div>
        <button type="submit" style={{ padding: '8px 16px' }}>Register</button>
      </form>
    </div>
  );
}