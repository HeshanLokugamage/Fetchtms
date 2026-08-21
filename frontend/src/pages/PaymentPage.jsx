import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function PaymentPage() {
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);

  const [studentSearch, setStudentSearch] = useState('');
  const [courseSearch, setCourseSearch] = useState('');
  const [payStudentId, setPayStudentId] = useState('');
  const [payCourseId, setPayCourseId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payType, setPayType] = useState('debit');
  const [payStatus, setPayStatus] = useState('pending');

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

  const studentMatches = studentSearch
    ? students.filter(s =>
        String(s.student_id).includes(studentSearch) ||
        s.full_name.toLowerCase().includes(studentSearch.toLowerCase())
      ).slice(0, 5)
    : [];

  const courseMatches = courseSearch
    ? courses.filter(c =>
        String(c.course_id).includes(courseSearch) ||
        c.name.toLowerCase().includes(courseSearch.toLowerCase()) ||
        c.code.toLowerCase().includes(courseSearch.toLowerCase())
      ).slice(0, 5)
    : [];

  const selectedStudent = students.find(s => s.student_id === Number(payStudentId));
  const selectedCourse = courses.find(c => c.course_id === Number(payCourseId));

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setMessage(''); setError('');
    try {
      await axios.post('https://fetchtms.onrender.com/payments', {
        student_id: payStudentId, course_id: payCourseId, amount: payAmount, type: payType, status: payStatus
      }, { headers: getHeaders() });
      setMessage('Payment recorded successfully');
      setPayStudentId(''); setPayCourseId(''); setPayAmount(''); setPayType('debit'); setPayStatus('pending');
      setStudentSearch(''); setCourseSearch('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record payment');
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Record Payment</h2>
        <button onClick={() => navigate('/admin/operations')} style={{ padding: '8px 16px' }}>← Back</button>
      </div>

      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleRecordPayment}>
        <div style={{ marginBottom: '10px', position: 'relative' }}>
          <label>Student (search by ID or name)</label><br />
          <input
            value={studentSearch}
            onChange={e => { setStudentSearch(e.target.value); setPayStudentId(''); }}
            style={{ width: '100%', padding: '8px' }}
            placeholder="Type ID or name..."
          />
          {studentMatches.length > 0 && (
            <div style={{ border: '1px solid #ccc', borderRadius: '4px', marginTop: '2px' }}>
              {studentMatches.map(s => (
                <div
                  key={s.student_id}
                  onClick={() => { setPayStudentId(s.student_id); setStudentSearch(`${s.full_name} (ID: ${s.student_id})`); }}
                  style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                >
                  {s.full_name} — ID: {s.student_id} — {s.email}
                </div>
              ))}
            </div>
          )}
          {selectedStudent && (
            <p style={{ fontSize: '13px', color: 'gray', marginTop: '4px' }}>
              Selected: {selectedStudent.full_name}, {selectedStudent.email}, Status: {selectedStudent.registration_status}
            </p>
          )}
        </div>

        <div style={{ marginBottom: '10px', position: 'relative' }}>
          <label>Course (search by ID, code, or name)</label><br />
          <input
            value={courseSearch}
            onChange={e => { setCourseSearch(e.target.value); setPayCourseId(''); }}
            style={{ width: '100%', padding: '8px' }}
            placeholder="Type ID, code, or name..."
          />
          {courseMatches.length > 0 && (
            <div style={{ border: '1px solid #ccc', borderRadius: '4px', marginTop: '2px' }}>
              {courseMatches.map(c => (
                <div
                  key={c.course_id}
                  onClick={() => { setPayCourseId(c.course_id); setCourseSearch(`${c.name} (${c.code})`); }}
                  style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                >
                  {c.code} — {c.name} — ID: {c.course_id}
                </div>
              ))}
            </div>
          )}
          {selectedCourse && (
            <p style={{ fontSize: '13px', color: 'gray', marginTop: '4px' }}>
              Selected: {selectedCourse.code} — {selectedCourse.name}, Status: {selectedCourse.status}
            </p>
          )}
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Amount</label><br />
          <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} style={{ width: '100%', padding: '8px' }} required />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Type</label><br />
          <select value={payType} onChange={e => setPayType(e.target.value)} style={{ width: '100%', padding: '8px' }}>
            <option value="debit">Debit (fee owed)</option>
            <option value="credit">Credit (payment made)</option>
          </select>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Status</label><br />
          <select value={payStatus} onChange={e => setPayStatus(e.target.value)} style={{ width: '100%', padding: '8px' }}>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <button type="submit" style={{ padding: '8px 16px' }} disabled={!payStudentId || !payCourseId}>Record Payment</button>
      </form>
    </div>
  );
}