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

    // Fetch all users to filter coordinators (reuses the students/resource-persons pattern isn't available for users list,
    // so we ask the admin to note this: we don't yet have a GET /users route)
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
                {c.code} — {c.name} (ID: {c.course_id})
              </option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Coordinator User ID</label><br />
          <input value={coordinatorId} onChange={e => setCoordinatorId(e.target.value)} style={{ width: '100%', padding: '8px' }} placeholder="Enter user_id from Supabase users table" required />
          <p style={{ fontSize: '13px', color: 'gray', marginTop: '4px' }}>
            (A dropdown of coordinator names requires a new backend route — let me know if you'd like this added)
          </p>
        </div>
        <button type="submit" style={{ padding: '8px 16px' }}>Assign</button>
      </form>
    </div>
  );
}