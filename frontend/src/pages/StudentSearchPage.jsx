import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function StudentSearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [paymentsByStudent, setPaymentsByStudent] = useState({});
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setSearched(true);
    setPaymentsByStudent({});
    try {
      const res = await axios.get('https://fetchtms.onrender.com/students', { headers: getHeaders() });
      const term = searchTerm.trim().toLowerCase();
      const matches = res.data.filter(s =>
        String(s.student_id) === term ||
        (s.full_name && s.full_name.toLowerCase().includes(term))
      );
      setResults(matches);

      const paymentsMap = {};
      for (const s of matches) {
        try {
          const payRes = await axios.get(`https://fetchtms.onrender.com/payments/student/${s.student_id}`, { headers: getHeaders() });
          paymentsMap[s.student_id] = payRes.data;
        } catch {
          paymentsMap[s.student_id] = null;
        }
      }
      setPaymentsByStudent(paymentsMap);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to search students');
    }
  };

  return (
    <div style={{ maxWidth: '700px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Search Student</h2>
        <button onClick={() => navigate('/admin/students')} style={{ padding: '8px 16px' }}>← Back</button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Enter Student ID or Name"
          style={{ flex: 1, padding: '8px' }}
          required
        />
        <button type="submit" style={{ padding: '8px 16px' }}>Search</button>
      </form>

      {searched && results.length === 0 && !error && (
        <p>No student found matching "{searchTerm}".</p>
      )}

      {results.map(s => {
        const payInfo = paymentsByStudent[s.student_id];
        return (
          <div key={s.student_id} style={{ border: '1px solid #ccc', borderRadius: '6px', padding: '16px', marginBottom: '16px', textAlign: 'left' }}>
            <h3 style={{ marginTop: 0 }}>{s.full_name} (ID: {s.student_id})</h3>
            <p><strong>NIC/Passport:</strong> {s.nic_passport || '—'}</p>
            <p><strong>Date of Birth:</strong> {s.dob || '—'}</p>
            <p><strong>Gender:</strong> {s.gender || '—'}</p>
            <p><strong>Address:</strong> {s.address || '—'}</p>
            <p><strong>Contact Number:</strong> {s.contact_number || '—'}</p>
            <p><strong>Email:</strong> {s.email}</p>
            <p><strong>Organization:</strong> {s.organization || '—'}</p>
            <p><strong>Job Title:</strong> {s.job_title || '—'}</p>
            <p><strong>Qualification:</strong> {s.qualification || '—'}</p>
            <p><strong>Emergency Contact:</strong> {s.emergency_contact || '—'}</p>
            <p><strong>Registration Status:</strong> {s.registration_status}</p>

            <h4>Payment Status</h4>
            {payInfo ? (
              <>
                <p><strong>Outstanding Balance:</strong> {payInfo.outstanding}</p>
                <p><strong>Total Debit:</strong> {payInfo.totalDebit} | <strong>Total Credit:</strong> {payInfo.totalCredit}</p>
                {payInfo.payments.length > 0 ? (
                  <table border="1" cellPadding="6" style={{ borderCollapse: 'collapse', width: '100%', marginTop: '8px' }}>
                    <thead>
                      <tr><th>Course ID</th><th>Type</th><th>Amount</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {payInfo.payments.map(p => (
                        <tr key={p.payment_id}>
                          <td>{p.course_id}</td>
                          <td>{p.type}</td>
                          <td>{p.amount}</td>
                          <td>{p.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>No payment records yet.</p>
                )}
              </>
            ) : (
              <p>Payment info unavailable.</p>
            )}
          </div>
        );
      })}
    </div>
  );
}