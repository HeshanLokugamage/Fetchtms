import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function VerifyCertificatePage() {
  const [mode, setMode] = useState('code');
  const [certCode, setCertCode] = useState('');
  const [studentId, setStudentId] = useState('');
  const [fullName, setFullName] = useState('');
  const [result, setResult] = useState(null);
  const [certList, setCertList] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleVerifyByCode = async (e) => {
    e.preventDefault();
    setError(''); setResult(null); setCertList(null);
    try {
      const res = await axios.get(`https://fetchtms.onrender.com/certificates/verify/${certCode}`);
      setResult(res.data.certificate);
    } catch (err) {
      setError(err.response?.data?.error || 'Certificate not found');
    }
  };

  const handleVerifyByStudent = async (e) => {
    e.preventDefault();
    setError(''); setResult(null); setCertList(null);
    try {
      const params = {};
      if (studentId) params.student_id = studentId;
      if (fullName) params.full_name = fullName;
      const res = await axios.get('https://fetchtms.onrender.com/certificates/find-by-student', { params });
      setCertList(res.data.certificates);
    } catch (err) {
      setError(err.response?.data?.error || 'No certificate found for this student');
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Certificate Verification</h2>
        <button onClick={() => navigate('/login')} style={{ padding: '8px 16px' }}>Go to Login</button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => { setMode('code'); setError(''); setResult(null); setCertList(null); }} style={{ padding: '8px 16px', marginRight: '10px', fontWeight: mode === 'code' ? 'bold' : 'normal' }}>
          Search by Certificate Number
        </button>
        <button onClick={() => { setMode('student'); setError(''); setResult(null); setCertList(null); }} style={{ padding: '8px 16px', fontWeight: mode === 'student' ? 'bold' : 'normal' }}>
          Search by Student
        </button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {mode === 'code' && (
        <form onSubmit={handleVerifyByCode} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <input
            value={certCode}
            onChange={e => setCertCode(e.target.value)}
            placeholder="Enter Certificate Number (e.g. CERT-1234567890)"
            style={{ flex: 1, padding: '8px' }}
            required
          />
          <button type="submit" style={{ padding: '8px 16px' }}>Verify</button>
        </form>
      )}

      {mode === 'student' && (
        <form onSubmit={handleVerifyByStudent} style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '10px' }}>
            <label>Student ID</label><br />
            <input value={studentId} onChange={e => setStudentId(e.target.value)} style={{ width: '100%', padding: '8px' }} placeholder="Enter exact Student ID" />
          </div>
          <p style={{ textAlign: 'center', color: 'gray' }}>— or —</p>
          <div style={{ marginBottom: '10px' }}>
            <label>Full Name</label><br />
            <input value={fullName} onChange={e => setFullName(e.target.value)} style={{ width: '100%', padding: '8px' }} placeholder="Enter exact full name" />
          </div>
          <button type="submit" style={{ padding: '8px 16px' }}>Search</button>
        </form>
      )}

      {result && (
        <div style={{ border: '2px solid green', borderRadius: '6px', padding: '20px', textAlign: 'left' }}>
          <h3 style={{ color: 'green' }}>✓ Valid Certificate</h3>
          <p><strong>Verification Code:</strong> {result.verification_code}</p>
          <p><strong>Student ID:</strong> {result.student_id}</p>
          <p><strong>Course ID:</strong> {result.course_id}</p>
          <p><strong>Issue Date:</strong> {result.issue_date}</p>
        </div>
      )}

      {certList && certList.length > 0 && (
        <>
          <h3>Certificates Found</h3>
          {certList.map(cert => (
            <div key={cert.certificate_id} style={{ border: '1px solid #ccc', borderRadius: '6px', padding: '16px', marginBottom: '12px', textAlign: 'left' }}>
              <p><strong>Student:</strong> {cert.student_name}</p>
              <p><strong>Verification Code:</strong> {cert.verification_code}</p>
              <p><strong>Course ID:</strong> {cert.course_id}</p>
              <p><strong>Issue Date:</strong> {cert.issue_date}</p>
            </div>
          ))}
        </>
      )}
    </div>
  );
}