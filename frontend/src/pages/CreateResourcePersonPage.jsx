import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function CreateResourcePersonPage() {
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const [rpName, setRpName] = useState('');
  const [rpTitle, setRpTitle] = useState('');
  const [rpOrganization, setRpOrganization] = useState('');
  const [rpQualifications, setRpQualifications] = useState('');

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const handleCreateResourcePerson = async (e) => {
    e.preventDefault();
    setMessage(''); setError('');
    try {
      const res = await axios.post('https://fetchtms.onrender.com/resource-persons', {
        name: rpName, title: rpTitle, organization: rpOrganization, qualifications: rpQualifications
      }, { headers: getHeaders() });
      setMessage(`Resource person created! Trainer ID: ${res.data.resourcePerson.trainer_id}`);
      setRpName(''); setRpTitle(''); setRpOrganization(''); setRpQualifications('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create resource person');
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Create Resource Person</h2>
        <button onClick={() => navigate('/admin/operations')} style={{ padding: '8px 16px' }}>← Back</button>
      </div>

      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleCreateResourcePerson}>
        <div style={{ marginBottom: '10px' }}>
          <label>Name</label><br />
          <input value={rpName} onChange={e => setRpName(e.target.value)} style={{ width: '100%', padding: '8px' }} required />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Title</label><br />
          <input value={rpTitle} onChange={e => setRpTitle(e.target.value)} style={{ width: '100%', padding: '8px' }} />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Organization</label><br />
          <input value={rpOrganization} onChange={e => setRpOrganization(e.target.value)} style={{ width: '100%', padding: '8px' }} />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Qualifications</label><br />
          <input value={rpQualifications} onChange={e => setRpQualifications(e.target.value)} style={{ width: '100%', padding: '8px' }} />
        </div>
        <button type="submit" style={{ padding: '8px 16px' }}>Create Resource Person</button>
      </form>
    </div>
  );
}