import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function CertificatePage() {
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const [certStudentId, setCertStudentId] = useState('');
  const [certCourseId, setCertCourseId] = useState('');

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const handleIssueCertificate = async (e) => {
    e.preventDefault();
    setMessage(''); setError('');
    try {
      const res = await axios.post('https://fetchtms.onrender.com/certificates', {
        student_id: certStudentId, course_id: certCourseId
      }, { headers: getHeaders() });
      setMessage(`Certificate issued! Verification code: ${res.data.certificate.verification_code}`);
      setCertStudentId(''); setCertCourseId('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to issue certificate');
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Issue Certificate</h2>
        <button onClick={() => navigate('/admin/operations')} style={{ padding: '8px 16px' }}>← Back</button>
      </div>

      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleIssueCertificate}>
        <div style={{ marginBottom: '10px' }}>
          <label>Student ID</label><br />
          <input value={certStudentId} onChange={e => setCertStudentId(e.target.value)} style={{ width: '100%', padding: '8px' }} required />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Course ID</label><br />
          <input value={certCourseId} onChange={e => setCertCourseId(e.target.value)} style={{ width: '100%', padding: '8px' }} required />
        </div>
        <button type="submit" style={{ padding: '8px 16px' }}>Issue Certificate</button>
      </form>
    </div>
  );
}