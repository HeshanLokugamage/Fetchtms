import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function AssignCoordinatorPage() {
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [coordinators, setCoordinators] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [coordinatorId, setCoordinatorId] = useState('');

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    axios.get('https://fetchtms.onrender.com/courses', { headers: getHeaders() })
      .then(res => setCourses(res.data))
      .catch(() => {});

    axios.get('https://fetchtms.onrender.com/users', { headers: getHeaders() })
      .then(res => setCoordinators(res.data.filter(u => u.role === 'coordinator')))
      .catch(() => {});
  }, []);

  const handleAssignCoordinator = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      await axios.post('https://fetchtms.onrender.com/course-coordinators', {
        course_id: courseId,
        coordinator_id: coordinatorId
      }, { headers: getHeaders() });
      setMessage('Coordinator assigned successfully');
      setCourseId(''); setCoordinatorId('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to assign coordinator');
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Assign Coordinator</h2>
        <button onClick={() => navigate('/admin/operations')} style={{ padding: '8px 16px' }}>← Back</button>
      </div>

      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleAssignCoordinator}>
        <div style={{ marginBottom: '10px' }}>
          <label>Course</label><br />
          <select value={courseId} onChange={e => setCourseId(e.target.value)} style={{ width: '100%', padding: '8px' }} required>
            <option value="">Select Course</option>
            {courses.map(c => (
              <option key={c.course_id} value={c.course_id}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Coordinator</label><br />
          <select value={coordinatorId} onChange={e => setCoordinatorId(e.target.value)} style={{ width: '100%', padding: '8px' }} required>
            <option value="">Select Coordinator</option>
            {coordinators.map(u => (
              <option key={u.user_id} value={u.user_id}>
                {u.username}
              </option>
            ))}
          </select>
          {coordinators.length === 0 && (
            <p style={{ fontSize: '13px', color: 'gray', marginTop: '4px' }}>
              No coordinator accounts found. Create one first via Create User Account.
            </p>
          )}
        </div>
        <button type="submit" style={{ padding: '8px 16px' }}>Assign</button>
      </form>
    </div>
  );
}