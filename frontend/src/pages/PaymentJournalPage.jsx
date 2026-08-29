import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function PaymentJournalPage() {
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const [vendors, setVendors] = useState([]);
  const [resourcePersons, setResourcePersons] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);

  const [entryDate, setEntryDate] = useState('');
  const [category, setCategory] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [resourcePersonId, setResourcePersonId] = useState('');
  const [staffUserId, setStaffUserId] = useState('');
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

    axios.get('https://fetchtms.onrender.com/resource-persons', { headers: getHeaders() })
      .then(res => setResourcePersons(res.data))
      .catch(() => {});

    axios.get('https://fetchtms.onrender.com/users', { headers: getHeaders() })
      .then(res => setStaffUsers(res.data.filter(u => u.role === 'staff')))
      .catch(() => {});

    axios.get('https://fetchtms.onrender.com/payment-methods', { headers: getHeaders() })
      .then(res => setPaymentMethods(res.data))
      .catch(() => {});
  }, []);

  const isResourcePersonCategory = category === 'resource_person_payment';
  const isStaffCategory = category === 'staff_payment';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(''); setError('');
    try {
      await axios.post('https://fetchtms.onrender.com/journal/payment', {
        entry_date: entryDate,
        category,
        vendor_id: (isResourcePersonCategory || isStaffCategory) ? null : vendorId,
        resource_person_id: isResourcePersonCategory ? resourcePersonId : null,
        staff_user_id: isStaffCategory ? staffUserId : null,
        amount,
        payment_method_id: paymentMethodId,
        description
      }, { headers: getHeaders() });
      setMessage('Payment recorded successfully');
      setEntryDate(''); setCategory(''); setVendorId(''); setResourcePersonId(''); setStaffUserId('');
      setAmount(''); setPaymentMethodId(''); setDescription('');
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
            <option value="staff_payment">Staff Payment</option>
            <option value="other_expenses">Other Expenses</option>
          </select>
        </div>

        {isResourcePersonCategory ? (
          <div style={{ marginBottom: '10px' }}>
            <label>Resource Person</label><br />
            <select value={resourcePersonId} onChange={e => setResourcePersonId(e.target.value)} style={{ width: '100%', padding: '8px' }} required>
              <option value="">Select Resource Person</option>
              {resourcePersons.map(rp => (
                <option key={rp.trainer_id} value={rp.trainer_id}>{rp.name}</option>
              ))}
            </select>
          </div>
        ) : isStaffCategory ? (
          <div style={{ marginBottom: '10px' }}>
            <label>Staff</label><br />
            <select value={staffUserId} onChange={e => setStaffUserId(e.target.value)} style={{ width: '100%', padding: '8px' }} required>
              <option value="">Select Staff</option>
              {staffUsers.map(u => (
                <option key={u.user_id} value={u.user_id}>{u.username}</option>
              ))}
            </select>
            {staffUsers.length === 0 && (
              <p style={{ fontSize: '13px', color: 'gray', marginTop: '4px' }}>
                No staff accounts found. Create one first via Create User Account (role: Staff).
              </p>
            )}
          </div>
        ) : (
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
        )}

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