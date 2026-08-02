import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function StudentDashboard() {
  const [attendance, setAttendance] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    axios.get('https://fetchtms.onrender.com/attendance/my', { headers })
      .then(res => setAttendance(res.data))
      .catch(err => setError(err.response?.data?.error || 'Failed to load attendance'));

    axios.get('https://fetchtms.onrender.com/assessments/my', { headers })
      .then(res => setAssessments(res.data))
      .catch(err => setError(err.response?.data?.error || 'Failed to load assessments'));

    axios.get('https://fetchtms.onrender.com/payments/my', { headers })
      .then(res => setPayments(res.data))
      .catch(err => setError(err.response?.data?.error || 'Failed to load payments'));

    axios.get('https://fetchtms.onrender.com/registrations/my', { headers })
      .then(res => setRegistrations(res.data))
      .catch(err => setError(err.response?.data?.error || 'Failed to load registrations'));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const totalDebit = payments.filter(p => p.type === 'debit').reduce((sum, p) => sum + Number(p.amount), 0);
  const totalCredit = payments.filter(p => p.type === 'credit').reduce((sum, p) => sum + Number(p.amount), 0);
  const outstanding = totalDebit - totalCredit;

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Student Dashboard</h2>
        <button onClick={handleLogout} style={{ padding: '8px 16px' }}>Log Out</button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h3>My Registrations ({registrations.length})</h3>
      <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '30px' }}>
        <thead>
          <tr>
            <th>Course ID</th><th>Status</th><th>Registered At</th>
          </tr>
        </thead>
        <tbody>
          {registrations.map(r => (
            <tr key={r.registration_id}>
              <td>{r.course_id}</td>
              <td>{r.status}</td>
              <td>{r.registered_at}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>My Attendance ({attendance.length})</h3>
      <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '30px' }}>
        <thead>
          <tr>
            <th>Session ID</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          {attendance.map(a => (
            <tr key={a.attendance_id}>
              <td>{a.session_id}</td>
              <td>{a.status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>My Published Marks ({assessments.length})</h3>
      <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '30px' }}>
        <thead>
          <tr>
            <th>Course ID</th><th>Marks</th><th>Grade</th>
          </tr>
        </thead>
        <tbody>
          {assessments.map(a => (
            <tr key={a.assessment_id}>
              <td>{a.course_id}</td>
              <td>{a.marks}</td>
              <td>{a.grade}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>My Payments ({payments.length})</h3>
      <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th>Course ID</th><th>Type</th><th>Amount</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          {payments.map(p => (
            <tr key={p.payment_id}>
              <td>{p.course_id}</td>
              <td>{p.type}</td>
              <td>{p.amount}</td>
              <td>{p.status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ marginTop: '15px', fontWeight: 'bold' }}>
        Outstanding Balance: {outstanding}
      </p>
    </div>
  );
}