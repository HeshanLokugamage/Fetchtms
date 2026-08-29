import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function CertificatePage() {
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);

  const [studentSearch, setStudentSearch] = useState('');
  const [courseSearch, setCourseSearch] = useState('');
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
    axios.get('https://fetchtms.onrender.com/courses', { headers: getHeaders() })
      .then(res => setCourses(res.data))
      .catch(() => {});
  }, []);

  const studentMatches = studentSearch
    ? students.filter(s =>
        String(s.student_id).includes(studentSearch) ||
        s.full_name.toLowerCase().includes(studentSearch.toLowerCase())
      ).slice(0, 5)
    : [];

  const courseMatches = courseSearch
    ? courses.filter(c =>
        String(c.course_id).includes(courseSearch) ||
        c.name.toLowerCase().includes(courseSearch.toLowerCase()) ||
        c.code.toLowerCase().includes(courseSearch.toLowerCase())
      ).slice(0, 5)
    : [];

  const selectedStudent = students.find(s => s.student_id === Number(certStudentId));
  const selectedCourse = courses.find(c => c.course_id === Number(certCourseId));

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
      setStudentSearch(''); setCourseSearch('');
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

        <div style={{ marginBottom: '10px', position: 'relative' }}>
          <label>Course (search by ID, code, or name)</label><br />
          <input
            value={courseSearch}
            onChange={e => { setCourseSearch(e.target.value); setCertCourseId(''); }}
            style={{ width: '100%', padding: '8px' }}
            placeholder="Type ID, code, or name..."
          />
          {courseMatches.length > 0 && (
            <div style={{ border: '1px solid #ccc', borderRadius: '4px', marginTop: '2px' }}>
              {courseMatches.map(c => (
                <div
                  key={c.course_id}
                  onClick={() => { setCertCourseId(c.course_id); setCourseSearch(`${c.name} (${c.code})`); }}
                  style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                >
                  {c.code} — {c.name} — ID: {c.course_id}
                </div>
              ))}
            </div>
          )}
          {selectedCourse && (
            <p style={{ fontSize: '13px', color: 'gray', marginTop: '4px' }}>
              Selected: {selectedCourse.code} — {selectedCourse.name}
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
