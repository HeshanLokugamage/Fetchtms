import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const todayISO = () => new Date().toISOString().split('T')[0];

export default function ReceiptJournalPage() {
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);

  const [entryDate, setEntryDate] = useState(todayISO());
  const [studentId, setStudentId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [description, setDescription] = useState('');

  const [overallOutstanding, setOverallOutstanding] = useState(null);
  const [courseBalance, setCourseBalance] = useState(null);
  const [issuedEntryId, setIssuedEntryId] = useState('');

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

    axios.get('https://fetchtms.onrender.com/payment-methods', { headers: getHeaders() })
      .then(res => setPaymentMethods(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!studentId) { setOverallOutstanding(null); return; }
    axios.get(`https://fetchtms.onrender.com/payments/student/${studentId}`, { headers: getHeaders() })
      .then(res => setOverallOutstanding(res.data.outstanding))
      .catch(() => setOverallOutstanding(null));
  }, [studentId]);

  useEffect(() => {
    if (!studentId || !courseId) { setCourseBalance(null); return; }
    axios.get(`https://fetchtms.onrender.com/courses/${courseId}/balance/${studentId}`, { headers: getHeaders() })
      .then(res => setCourseBalance(res.data))
      .catch(() => setCourseBalance(null));
  }, [studentId, courseId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(''); setError(''); setIssuedEntryId('');

    if (courseBalance && Number(amount) > courseBalance.balance) {
      setError(`Amount cannot exceed this student's outstanding balance of ${courseBalance.balance} for this course`);
      return;
    }

    try {
      const res = await axios.post('https://fetchtms.onrender.com/journal/receipt', {
        entry_date: entryDate,
        student_id: studentId,
        course_id: courseId,
        amount,
        payment_method_id: paymentMethodId,
        description
      }, { headers: getHeaders() });
      setMessage('Receipt recorded successfully and the student\u2019s course balance has been updated');
      setIssuedEntryId(res.data.entry.entry_id);
      setStudentId(''); setCourseId(''); setAmount(''); setPaymentMethodId(''); setDescription(''); setEntryDate(todayISO());
      setCourseBalance(null); setOverallOutstanding(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record receipt');
    }
  };

  const downloadReceipt = async (entryId) => {
    setError('');
    try {
      const res = await axios.get(`https://fetchtms.onrender.com/journal/receipt/${entryId}/pdf`, {
        headers: getHeaders(),
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      window.open(url, '_blank');
    } catch (err) {
      setError('Failed to open receipt');
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Receipt Journal</h2>
        <button onClick={() => navigate('/admin/operations')}>← Back</button>
      </div>

      {message && <p style={{ color: 'green' }}>{message}</p>}
      {issuedEntryId && (
        <p>
          <button onClick={() => downloadReceipt(issuedEntryId)}>
            View / Print Receipt
          </button>
        </p>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label>Date</label><br />
          <input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} style={{ width: '100%', padding: '8px' }} required />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Student</label><br />
          <select value={studentId} onChange={e => setStudentId(e.target.value)} style={{ width: '100%', padding: '8px' }} required>
            <option value="">Select Student</option>
            {students.map(s => (
              <option key={s.student_id} value={s.student_id}>{s.full_name}</option>
            ))}
          </select>
          {overallOutstanding !== null && (
            <p style={{ fontSize: '13px', color: 'gray', marginTop: '4px' }}>
              Outstanding balance (all courses): {overallOutstanding}
            </p>
          )}
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Course</label><br />
          <select value={courseId} onChange={e => setCourseId(e.target.value)} style={{ width: '100%', padding: '8px' }} required>
            <option value="">Select Course</option>
            {courses.map(c => (
              <option key={c.course_id} value={c.course_id}>{c.code} — {c.name}</option>
            ))}
          </select>
          {courseBalance && (
            <p style={{ fontSize: '13px', color: 'gray', marginTop: '4px' }}>
              This course — Fee: {courseBalance.fee}, Paid: {courseBalance.paid}, Balance: {courseBalance.balance}
            </p>
          )}
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Amount</label><br />
          <input
            type="number"
            min="0.01"
            step="0.01"
            max={courseBalance ? courseBalance.balance : undefined}
            value={amount}
            onChange={e => setAmount(e.target.value)}
            style={{ width: '100%', padding: '8px' }}
            required
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Payment Method</label><br />
          <select value={paymentMethodId} onChange={e => setPaymentMethodId(e.target.value)} style={{ width: '100%', padding: '8px' }} required>
            <option value="">Select Method</option>
            {paymentMethods.map(m => (
              <option key={m.method_id} value={m.method_id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Description (optional)</label><br />
          <input value={description} onChange={e => setDescription(e.target.value)} style={{ width: '100%', padding: '8px' }} />
        </div>
        <button type="submit">Record Receipt</button>
      </form>
    </div>
  );
}
