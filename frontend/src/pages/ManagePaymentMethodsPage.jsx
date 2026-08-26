import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function ManagePaymentMethodsPage() {
  const [methods, setMethods] = useState([]);
  const [methodName, setMethodName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const loadMethods = () => {
    axios.get('https://fetchtms.onrender.com/payment-methods', { headers: getHeaders() })
      .then(res => setMethods(res.data))
      .catch(err => setError(err.response?.data?.error || 'Failed to load payment methods'));
  };

  useEffect(() => {
    loadMethods();
  }, []);

  const handleAddMethod = async (e) => {
    e.preventDefault();
    setMessage(''); setError('');
    try {
      await axios.post('https://fetchtms.onrender.com/payment-methods', {
        name: methodName
      }, { headers: getHeaders() });
      setMessage('Payment method added successfully');
      setMethodName('');
      loadMethods();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add payment method');
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Manage Payment Methods</h2>
        <button onClick={() => navigate('/admin/operations')} style={{ padding: '8px 16px' }}>← Back</button>
      </div>

      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h3>Add New Payment Method</h3>
      <form onSubmit={handleAddMethod} style={{ marginBottom: '30px' }}>
        <div style={{ marginBottom: '10px' }}>
          <label>Method Name</label><br />
          <input value={methodName} onChange={e => setMethodName(e.target.value)} style={{ width: '100%', padding: '8px' }} required />
        </div>
        <button type="submit" style={{ padding: '8px 16px' }}>Add Method</button>
      </form>

      <h3>Payment Methods ({methods.length})</h3>
      <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr><th>ID</th><th>Name</th></tr>
        </thead>
        <tbody>
          {methods.map(m => (
            <tr key={m.method_id}>
              <td>{m.method_id}</td>
              <td>{m.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}