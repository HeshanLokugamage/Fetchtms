import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function ResourcePersonsListPage() {
  const [resourcePersons, setResourcePersons] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get('https://fetchtms.onrender.com/resource-persons', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setResourcePersons(res.data))
      .catch(err => setError(err.response?.data?.error || 'Failed to load resource persons'));
  }, []);

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Resource Persons</h2>
        <button onClick={() => navigate('/admin/operations/create-resource-person')}>← Back</button>
      </div>
      <span className="page-subtitle">All trainers registered in the system</span>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th>ID</th><th>Name</th><th>Title</th><th>Organization</th><th>Qualifications</th><th>Subjects</th><th>Available Dates</th><th>Fee/Hour</th>
          </tr>
        </thead>
        <tbody>
          {resourcePersons.map(rp => (
            <tr key={rp.trainer_id}>
              <td>{rp.trainer_id}</td>
              <td>{rp.name}</td>
              <td>{rp.title || '—'}</td>
              <td>{rp.organization || '—'}</td>
              <td>{rp.qualifications || '—'}</td>
              <td>{rp.subjects || '—'}</td>
              <td>{rp.available_dates || '—'}</td>
              <td>{rp.fee_per_hour || '—'}</td>
            </tr>
          ))}
          {resourcePersons.length === 0 && (
            <tr><td colSpan="8">No resource persons created yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
