import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const RESULT_COLORS = {
  Pass: '#2e7d32',
  Fail: '#c62828',
  'In Progress': '#f57c00',
  'No Modules': '#777777'
};

export default function CourseWiseReportPage() {
  const [courses, setCourses] = useState([]);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [courseId, setCourseId] = useState('');
  const [status, setStatus] = useState('');

  const navigate = useNavigate();

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    axios.get('https://fetchtms.onrender.com/courses', { headers: getHeaders() })
      .then(res => setCourses(res.data))
      .catch(() => {});
  }, []);

  const loadReport = () => {
    setError(''); setLoading(true);
    const params = {};
    if (courseId) params.course_id = courseId;
    if (status) params.status = status;

    axios.get('https://fetchtms.onrender.com/reports/course-wise', { headers: getHeaders(), params })
      .then(res => setRows(res.data))
      .catch(err => setError(err.response?.data?.error || 'Failed to load report'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, status]);

  const downloadPdf = async () => {
    setError('');
    try {
      const params = {};
      if (courseId) params.course_id = courseId;
      if (status) params.status = status;

      const res = await axios.get('https://fetchtms.onrender.com/reports/course-wise/pdf', {
        headers: getHeaders(),
        params,
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      window.open(url, '_blank');
    } catch (err) {
      setError('Failed to download report PDF');
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Training Course-wise Report</h2>
        <button onClick={() => navigate('/admin/reports')}>← Back to Reports</button>
      </div>
      <span className="page-subtitle">Every registered student, fee/balance, marks, and completion status — filterable by course and status</span>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div className="btn-row" style={{ marginBottom: '20px', alignItems: 'flex-end' }}>
        <div>
          <label>Course</label><br />
          <select value={courseId} onChange={e => setCourseId(e.target.value)} style={{ padding: '8px', minWidth: '260px' }}>
            <option value="">All Courses</option>
            {courses.map(c => (
              <option key={c.course_id} value={c.course_id}>{c.code} — {c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Status</label><br />
          <select value={status} onChange={e => setStatus(e.target.value)} style={{ padding: '8px', minWidth: '180px' }}>
            <option value="">All Statuses</option>
            <option value="Pass">Completed (Pass)</option>
            <option value="Fail">Failed</option>
            <option value="In Progress">Pending Results</option>
            <option value="No Modules">No Modules Assigned</option>
          </select>
        </div>
        <button onClick={downloadPdf}>Download PDF</button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th>Course</th><th>Student</th><th>Fee</th><th>Paid</th><th>Balance</th><th>Modules & Marks</th><th>Result</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.registration_id}>
                <td>{r.course_code} — {r.course_name}</td>
                <td>{r.student_name}</td>
                <td>{r.fee}</td>
                <td>{r.paid}</td>
                <td>{r.balance}</td>
                <td>
                  {r.moduleMarks.length === 0 ? '—' : r.moduleMarks.map((mm, i) => (
                    <div key={i} style={{ fontSize: '12px' }}>
                      {mm.module_name}: {mm.marks !== null ? `${mm.marks} (${mm.grade})` : 'Pending'}
                    </div>
                  ))}
                </td>
                <td>
                  <strong style={{ color: RESULT_COLORS[r.overallResult] || 'black' }}>{r.overallResult}</strong>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan="7">No records match this filter.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
