import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function CoordinatorDashboard() {
  const [courseId, setCourseId] = useState('');
  const [pendingAssessments, setPendingAssessments] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

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

  return (
    <div style={{ maxWidth: '700px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Coordinator Dashboard</h2>
        <button onClick={handleLogout} style={{ padding: '8px 16px' }}>Log Out</button>
      </div>

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
        <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
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
        <p>No pending marks loaded. Enter a Course ID and click Load.</p>
      )}
    </div>
  );
}