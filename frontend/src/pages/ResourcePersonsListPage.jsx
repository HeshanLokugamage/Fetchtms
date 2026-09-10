import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function ResourcePersonsListPage() {
  const [resourcePersons, setResourcePersons] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get('https://fetchtms.onrender.com/resource-persons', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setResourcePersons(res.data))
      .catch(err => setError(err.response?.data?.error || 'Failed to load resource persons'));
  }, []);

  const filtered = search
    ? resourcePersons.filter(rp =>
        rp.name.toLowerCase().includes(search.toLowerCase()) ||
        String(rp.trainer_id).includes(search) ||
        (rp.subjects || '').toLowerCase().includes(search.toLowerCase())
      )
    : resourcePersons;

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Resource Persons</h2>
        <button onClick={() => navigate('/admin/operations/create-resource-person')}>← Back</button>
      </div>
      <span className="page-subtitle">All trainers registered in the system, with amount earned, paid, and outstanding</span>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ marginBottom: '15px' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, ID, or subject..."
          style={{ width: '100%', padding: '8px' }}
        />
      </div>

      <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th>ID</th><th>Name</th><th>Title</th><th>Organization</th><th>Subjects</th><th>Fee/Hour</th>
            <th>Hours Delivered</th><th>Amount Earned</th><th>Amount Paid</th><th>Outstanding</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(rp => (
            <tr key={rp.trainer_id}>
              <td>{rp.trainer_id}</td>
              <td>{rp.name}</td>
              <td>{rp.title || '—'}</td>
              <td>{rp.organization || '—'}</td>
              <td>{rp.subjects || '—'}</td>
              <td>{rp.fee_per_hour || '—'}</td>
              <td>{rp.hoursDelivered ?? 0}</td>
              <td>{rp.amountEarned ?? 0}</td>
              <td>{rp.amountPaid ?? 0}</td>
              <td style={{ fontWeight: 'bold', color: (rp.outstanding || 0) > 0 ? '#c62828' : '#2e7d32' }}>
                {rp.outstanding ?? 0}
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr><td colSpan="10">No resource persons found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
