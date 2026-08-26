import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function StudentBalanceSummaryPage() {
  const [summary, setSummary] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    axios.get('https://fetchtms.onrender.com/reports/student-balance-summary', { headers: getHeaders() })
      .then(res => setSummary(res.data))
      .catch(err => setError(err.response?.data?.error || 'Failed to load report'));
  }, []);

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Student Balance Summary</h2>
        <button onClick={() => navigate('/admin/reports')} style={{ padding: '8px 16px' }}>← Back</button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr><th>Student ID</th><th>Student Name</th><th>Debit</th><th>Credit</th><th>Balance</th></tr>
        </thead>
        <tbody>
          {summary.map(s => (
            <tr key={s.student_id}>
              <td>{s.student_id}</td>
              <td>{s.full_name}</td>
              <td style={{ textAlign: 'right' }}>{s.debit}</td>
              <td style={{ textAlign: 'right' }}>{s.credit}</td>
              <td style={{ textAlign: 'right' }}>{s.balance}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}