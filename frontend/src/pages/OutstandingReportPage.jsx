import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function OutstandingReportPage() {
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [overallReport, setOverallReport] = useState(null);
  const [studentReport, setStudentReport] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    axios.get('https://fetchtms.onrender.com/students', { headers: getHeaders() })
      .then(res => setStudents(res.data))
      .catch(() => {});

    axios.get('https://fetchtms.onrender.com/reports/outstanding', { headers: getHeaders() })
      .then(res => setOverallReport(res.data))
      .catch(err => setError(err.response?.data?.error || 'Failed to load overall report'));
  }, []);

  const handleFilterStudent = async (e) => {
    e.preventDefault();
    setError('');
    if (!studentId) { setStudentReport(null); return; }
    try {
      const res = await axios.get(`https://fetchtms.onrender.com/reports/outstanding/student/${studentId}`, { headers: getHeaders() });
      setStudentReport(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load student report');
    }
  };

  return (
    <div style={{ maxWidth: '700px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Outstanding Report</h2>
        <button onClick={() => navigate('/admin/reports')} style={{ padding: '8px 16px' }}>← Back</button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h3>Overall (All Students)</h3>
      {overallReport && (
        <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '30px' }}>
          <tbody>
            <tr><td>Total Debit</td><td style={{ textAlign: 'right' }}>{overallReport.totalDebit}</td></tr>
            <tr><td>Total Credit</td><td style={{ textAlign: 'right' }}>{overallReport.totalCredit}</td></tr>
            <tr style={{ fontWeight: 'bold' }}><td>Outstanding</td><td style={{ textAlign: 'right' }}>{overallReport.outstanding}</td></tr>
          </tbody>
        </table>
      )}

      <h3>Filter by Single Student</h3>
      <form onSubmit={handleFilterStudent} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <select value={studentId} onChange={e => setStudentId(e.target.value)} style={{ flex: 1, padding: '8px' }}>
          <option value="">Select Student</option>
          {students.map(s => (
            <option key={s.student_id} value={s.student_id}>{s.full_name}</option>
          ))}
        </select>
        <button type="submit" style={{ padding: '8px 16px' }}>Filter</button>
      </form>

      {studentReport && (
        <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
          <tbody>
            <tr><td>Total Debit</td><td style={{ textAlign: 'right' }}>{studentReport.totalDebit}</td></tr>
            <tr><td>Total Credit</td><td style={{ textAlign: 'right' }}>{studentReport.totalCredit}</td></tr>
            <tr style={{ fontWeight: 'bold' }}><td>Outstanding</td><td style={{ textAlign: 'right' }}>{studentReport.outstanding}</td></tr>
          </tbody>
        </table>
      )}
    </div>
  );
}