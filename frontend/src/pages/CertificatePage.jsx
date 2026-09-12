import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function CertificatePage() {
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [studentCourses, setStudentCourses] = useState([]);

  const [studentSearch, setStudentSearch] = useState('');
  const [certStudentId, setCertStudentId] = useState('');
  const [certCourseId, setCertCourseId] = useState('');
  const [issuedCode, setIssuedCode] = useState('');

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    axios.get('https://fetchtms.onrender.com/students', { headers: getHeaders() })
      .then(res => setStudents(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (certStudentId) {
      axios.get(`https://fetchtms.onrender.com/registrations/student/${certStudentId}`, { headers: getHeaders() })
        .then(res => setStudentCourses(res.data))
        .catch(() => setStudentCourses([]));
    } else {
      setStudentCourses([]);
    }
    setCertCourseId('');
  }, [certStudentId]);

  const studentMatches = studentSearch
    ? students.filter(s =>
        String(s.student_id).includes(studentSearch) ||
        s.full_name.toLowerCase().includes(studentSearch.toLowerCase())
      ).slice(0, 5)
    : [];

  const selectedStudent = students.find(s => s.student_id === Number(certStudentId));
  const selectedCourse = studentCourses.find(c => c.course_id === Number(certCourseId));

  const handleIssueCertificate = async (e) => {
    e.preventDefault();
    setMessage(''); setError(''); setIssuedCode('');
    try {
      const res = await axios.post('https://fetchtms.onrender.com/certificates', {
        student_id: certStudentId, course_id: certCourseId
      }, { headers: getHeaders() });
      setMessage(`Certificate issued! Verification code: ${res.data.certificate.verification_code}`);
      setIssuedCode(res.data.certificate.verification_code);
      setCertStudentId(''); setCertCourseId('');
      setStudentSearch(''); setStudentCourses([]);
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
      {issuedCode && (
        <p>
          <a
            href={`https://fetchtms.onrender.com/certificates/${issuedCode}/pdf`}
            target="_blank"
            rel="noreferrer"
            style={{ padding: '8px 16px', display: 'inline-block', background: '#2e7d32', color: 'white', borderRadius: '4px', textDecoration: 'none' }}
          >
            Download Certificate PDF
          </a>
        </p>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleIssueCertificate}>
        <div style={{ marginBottom: '10px', position: 'relative' }}>
          <label>Student (search by ID or name)</label><br />
          <input
            value={studentSearch}
            onChange={e => { setStudentSearch(e.target.value); setCertStudentId(''); }}
            style={{ width: '100%', padding: '8px' }}
            placeholder="Type ID or name..."
          />
          {studentMatches.length > 0 && (
            <div style={{ border: '1px solid #ccc', borderRadius: '4px', marginTop: '2px' }}>
              {studentMatches.map(s => (
                <div
                  key={s.student_id}
                  onClick={() => { setCertStudentId(s.student_id); setStudentSearch(`${s.full_name} (ID: ${s.student_id})`); }}
                  style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                >
                  {s.full_name} — ID: {s.student_id} — {s.email}
                </div>
              ))}
            </div>
          )}
          {selectedStudent && (
            <p style={{ fontSize: '13px', color: 'gray', marginTop: '4px' }}>
              Selected: {selectedStudent.full_name}, Status: {selectedStudent.registration_status}
            </p>
          )}
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Course (only shows this student's registered courses)</label><br />
          <select
            value={certCourseId}
            onChange={e => setCertCourseId(e.target.value)}
            style={{ width: '100%', padding: '8px' }}
            required
            disabled={!certStudentId}
          >
            <option value="">{certStudentId ? 'Select Course' : 'Select a student first'}</option>
            {studentCourses.map(c => (
              <option key={c.course_id} value={c.course_id}>
                {c.course_code ? `${c.course_code} — ${c.course_name}` : (c.course_name || c.course_id)}
              </option>
            ))}
          </select>
          {certStudentId && studentCourses.length === 0 && (
            <p style={{ fontSize: '13px', color: 'gray', marginTop: '4px' }}>
              This student isn't registered for any course yet.
            </p>
          )}
          {selectedCourse && (
            <p style={{ fontSize: '13px', color: 'gray', marginTop: '4px' }}>
              Selected: {selectedCourse.course_code} — {selectedCourse.course_name}
            </p>
          )}
        </div>

        <button type="submit" style={{ padding: '8px 16px' }} disabled={!certStudentId || !certCourseId}>
          Issue Certificate
        </button>
      </form>
    </div>
  );
}
