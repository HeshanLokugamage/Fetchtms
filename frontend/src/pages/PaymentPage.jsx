import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function PaymentPage() {
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const [payStudentId, setPayStudentId] = useState('');
  const [payCourseId, setPayCourseId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payType, setPayType] = useState('debit');
  const [payStatus, setPayStatus] = useState('pending');

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setMessage(''); setError('');
    try {
      await axios.post('https://fetchtms.onrender.com/payments', {
        student_id: payStudentId, course_id: payCourseId, amount: payAmount, type: payType, status: payStatus
      }, { headers: getHeaders() });
      setMessage('Payment recorded successfully');
      setPayStudentId(''); setPayCourseId(''); setPayAmount(''); setPayType('debit'); setPayStatus('pending');
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
        <div style={{ marginBottom: '10px' }}>
          <label>Student ID</label><br />
          <input value={payStudentId} onChange={e => setPayStudentId(e.target.value)} style={{ width: '100%', padding: '8px' }} required />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Course ID</label><br />
          <input value={payCourseId} onChange={e => setPayCourseId(e.target.value)} style={{ width: '100%', padding: '8px' }} required />
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
        <button type="submit" style={{ padding: '8px 16px' }}>Record Payment</button>
      </form>
    </div>
  );
}