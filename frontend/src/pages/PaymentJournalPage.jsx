import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function PaymentJournalPage() {
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const [vendors, setVendors] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);

  const [entryDate, setEntryDate] = useState('');
  const [category, setCategory] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [description, setDescription] = useState('');

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    axios.get('https://fetchtms.onrender.com/vendors', { headers: getHeaders() })
      .then(res => setVendors(res.data))
      .catch(() => {});

    axios.get('https://fetchtms.onrender.com/payment-methods', { headers: getHeaders() })
      .then(res => setPaymentMethods(res.data))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(''); setError('');
    try {
      await axios.post('https://fetchtms.onrender.com/journal/payment', {
        entry_date: entryDate,
        category,
        vendor_id: vendorId,
        amount,
        payment_method_id: paymentMethodId,
        description
      }, { headers: getHeaders() });
      setMessage('Payment recorded successfully');
      setEntryDate(''); setCategory(''); setVendorId(''); setAmount(''); setPaymentMethodId(''); setDescription('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record payment');
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Payment Journal</h2>
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
          <label>Category</label><br />
          <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', padding: '8px' }} required>
            <option value="">Select Category</option>
            <option value="fixed_assets">Fixed Assets Purchasing</option>
            <option value="other_purchases">Other Purchases</option>
            <option value="resource_person_payment">Resource Person Payment</option>
          </select>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Vendor</label><br />
          <select value={vendorId} onChange={e => setVendorId(e.target.value)} style={{ width: '100%', padding: '8px' }} required>
            <option value="">Select Vendor</option>
            {vendors.map(v => (
              <option key={v.vendor_id} value={v.vendor_id}>{v.name}</option>
            ))}
          </select>
          {vendors.length === 0 && (
            <p style={{ fontSize: '13px', color: 'gray', marginTop: '4px' }}>
              No vendors found. Add one first via Manage Vendors.
            </p>
          )}
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
        <button type="submit" style={{ padding: '8px 16px' }}>Record Payment</button>
      </form>
    </div>
  );
}