import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function ManageVendorsPage() {
  const [vendors, setVendors] = useState([]);
  const [vendorName, setVendorName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const loadVendors = () => {
    axios.get('https://fetchtms.onrender.com/vendors', { headers: getHeaders() })
      .then(res => setVendors(res.data))
      .catch(err => setError(err.response?.data?.error || 'Failed to load vendors'));
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const handleAddVendor = async (e) => {
    e.preventDefault();
    setMessage(''); setError('');
    try {
      await axios.post('https://fetchtms.onrender.com/vendors', {
        name: vendorName
      }, { headers: getHeaders() });
      setMessage('Vendor added successfully');
      setVendorName('');
      loadVendors();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add vendor');
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Manage Vendors</h2>
        <button onClick={() => navigate('/admin/operations')} style={{ padding: '8px 16px' }}>← Back</button>
      </div>

      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h3>Add New Vendor</h3>
      <form onSubmit={handleAddVendor} style={{ marginBottom: '30px' }}>
        <div style={{ marginBottom: '10px' }}>
          <label>Vendor Name</label><br />
          <input value={vendorName} onChange={e => setVendorName(e.target.value)} style={{ width: '100%', padding: '8px' }} required />
        </div>
        <button type="submit" style={{ padding: '8px 16px' }}>Add Vendor</button>
      </form>

      <h3>Vendors ({vendors.length})</h3>
      <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr><th>ID</th><th>Name</th></tr>
        </thead>
        <tbody>
          {vendors.map(v => (
            <tr key={v.vendor_id}>
              <td>{v.vendor_id}</td>
              <td>{v.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}