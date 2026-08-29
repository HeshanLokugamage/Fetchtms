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
  const [rpAvailableDates, setRpAvailableDates] = useState('');
  const [rpSubjects, setRpSubjects] = useState('');
  const [rpFeePerHour, setRpFeePerHour] = useState('');

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const handleCreateResourcePerson = async (e) => {
    e.preventDefault();
    setMessage(''); setError('');
    try {
      const res = await axios.post('https://fetchtms.onrender.com/resource-persons', {
        name: rpName,
        title: rpTitle,
        organization: rpOrganization,
        qualifications: rpQualifications,
        available_dates: rpAvailableDates,
        subjects: rpSubjects,
        fee_per_hour: rpFeePerHour
      }, { headers: getHeaders() });
      setMessage(`Resource person created! Trainer ID: ${res.data.resourcePerson.trainer_id}`);
      setRpName(''); setRpTitle(''); setRpOrganization(''); setRpQualifications('');
      setRpAvailableDates(''); setRpSubjects(''); setRpFeePerHour('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create resource person');
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Create Resource Person</h2>
        <div className="btn-row">
          <button onClick={() => navigate('/admin/operations/resource-persons')}>View List</button>
          <button onClick={() => navigate('/admin/operations')}>← Back</button>
        </div>
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
        <div style={{ marginBottom: '10px' }}>
          <label>Available Dates (e.g. Mon, Wed, Fri)</label><br />
          <input value={rpAvailableDates} onChange={e => setRpAvailableDates(e.target.value)} style={{ width: '100%', padding: '8px' }} placeholder="Mon, Wed, Fri" />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Subjects</label><br />
          <input value={rpSubjects} onChange={e => setRpSubjects(e.target.value)} style={{ width: '100%', padding: '8px' }} placeholder="e.g. Web Development, Data Structures" />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Fee Per Hour</label><br />
          <input type="number" value={rpFeePerHour} onChange={e => setRpFeePerHour(e.target.value)} style={{ width: '100%', padding: '8px' }} />
        </div>
        <button type="submit" style={{ padding: '8px 16px' }}>Create Resource Person</button>
      </form>
    </div>
  );
}