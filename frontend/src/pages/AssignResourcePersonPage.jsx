import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function AssignResourcePersonPage() {
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const [assignCourseId, setAssignCourseId] = useState('');
  const [assignTrainerId, setAssignTrainerId] = useState('');

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const handleAssignResourcePerson = async (e) => {
    e.preventDefault();
    setMessage(''); setError('');
    try {
      await axios.post('https://fetchtms.onrender.com/course-resource-persons', {
        course_id: assignCourseId, trainer_id: assignTrainerId
      }, { headers: getHeaders() });
      setMessage('Resource person assigned successfully');
      setAssignCourseId(''); setAssignTrainerId('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to assign resource person');
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Assign Resource Person</h2>
        <button onClick={() => navigate('/admin/operations')} style={{ padding: '8px 16px' }}>← Back</button>
      </div>

      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleAssignResourcePerson}>
        <div style={{ marginBottom: '10px' }}>
          <label>Course ID</label><br />
          <input value={assignCourseId} onChange={e => setAssignCourseId(e.target.value)} style={{ width: '100%', padding: '8px' }} required />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Trainer ID</label><br />
          <input value={assignTrainerId} onChange={e => setAssignTrainerId(e.target.value)} style={{ width: '100%', padding: '8px' }} required />
        </div>
        <button type="submit" style={{ padding: '8px 16px' }}>Assign</button>
      </form>
    </div>
  );
}