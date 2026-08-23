import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function ReceiptJournalPage() {
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);

  const [entryDate, setEntryDate] = useState('');
  const [studentId, setStudentId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [description, setDescription] = useState('');

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    axios.get('https://fetchtms.onrender.com/students', { headers: getHeaders() })
      .then(res => setStudents(res.data))
      .catch(() => {});

    axios.get('https://fetchtms.onrender.com/payment-methods', { headers: getHeaders() })
      .then(res => setPaymentMethods(res.data))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(''); setError('');
    try {
      await axios.post('https://fetchtms.onrender.com/journal/receipt', {
        entry_date: entryDate,
        student_id: studentId,
        amount,
        payment_method_id: paymentMethodId,
        description
      }, { headers: getHeaders() });
      setMessage('Receipt recorded successfully');
      setEntryDate(''); setStudentId(''); setAmount(''); setPaymentMethodId(''); setDescription('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record receipt');
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Receipt Journal</h2>
        <button onClick={() => navigate('/admin/operations')} style={{ padding: '8px 16px' }}>← Back</button>
      </div>

      {message && <p style={{ color: 'green' }}>{message}</p>}
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
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Amount</label><br />
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} style={{ width: '100%', padding: '8px' }} required />
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
        <button type="submit" style={{ padding: '8px 16px' }}>Record Receipt</button>
      </form>
    </div>
  );
}