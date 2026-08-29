import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function TranscriptPage() {
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [courseSearch, setCourseSearch] = useState('');
  const [studentId, setStudentId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [transcript, setTranscript] = useState(null);

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

  const selectedStudent = students.find(s => s.student_id === Number(studentId));
  const selectedCourse = courses.find(c => c.course_id === Number(courseId));

  const loadTranscript = async (e) => {
    e.preventDefault();
    setError(''); setTranscript(null);
    try {
      const res = await axios.get(`https://fetchtms.onrender.com/transcript/${studentId}/${courseId}`, { headers: getHeaders() });
      setTranscript(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load transcript');
    }
  };

  const downloadPdf = async () => {
    setError('');
    try {
      const res = await axios.get(`https://fetchtms.onrender.com/transcript/${studentId}/${courseId}/pdf`, {
        headers: getHeaders(),
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transcript-${studentId}-${courseId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download transcript PDF');
    }
  };

  return (
    <div style={{ maxWidth: '700px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Student Transcript</h2>
        <button onClick={() => navigate('/admin/operations')} style={{ padding: '8px 16px' }}>← Back</button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={loadTranscript}>
        <div style={{ marginBottom: '10px', position: 'relative' }}>
          <label>Student (search by ID or name)</label><br />
          <input
            value={studentSearch}
            onChange={e => { setStudentSearch(e.target.value); setStudentId(''); }}
            style={{ width: '100%', padding: '8px' }}
            placeholder="Type ID or name..."
          />
          {studentMatches.length > 0 && (
            <div style={{ border: '1px solid #ccc', borderRadius: '4px', marginTop: '2px' }}>
              {studentMatches.map(s => (
                <div
                  key={s.student_id}
                  onClick={() => { setStudentId(s.student_id); setStudentSearch(`${s.full_name} (ID: ${s.student_id})`); }}
                  style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                >
                  {s.full_name} — ID: {s.student_id}
                </div>
              ))}
            </div>
          )}
          {selectedStudent && (
            <p style={{ fontSize: '13px', color: 'gray', marginTop: '4px' }}>Selected: {selectedStudent.full_name}</p>
          )}
        </div>

        <div style={{ marginBottom: '10px', position: 'relative' }}>
          <label>Course (search by ID, code, or name)</label><br />
          <input
            value={courseSearch}
            onChange={e => { setCourseSearch(e.target.value); setCourseId(''); }}
            style={{ width: '100%', padding: '8px' }}
            placeholder="Type ID, code, or name..."
          />
          {courseMatches.length > 0 && (
            <div style={{ border: '1px solid #ccc', borderRadius: '4px', marginTop: '2px' }}>
              {courseMatches.map(c => (
                <div
                  key={c.course_id}
                  onClick={() => { setCourseId(c.course_id); setCourseSearch(`${c.name} (${c.code})`); }}
                  style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                >
                  {c.code} — {c.name} — ID: {c.course_id}
                </div>
              ))}
            </div>
          )}
          {selectedCourse && (
            <p style={{ fontSize: '13px', color: 'gray', marginTop: '4px' }}>Selected: {selectedCourse.code} — {selectedCourse.name}</p>
          )}
        </div>

        <button type="submit" style={{ padding: '8px 16px' }} disabled={!studentId || !courseId}>
          Load Transcript
        </button>
      </form>

      {transcript && (
        <div style={{ marginTop: '30px' }}>
          <h3>{transcript.studentName} — {transcript.courseCode ? `${transcript.courseCode} — ` : ''}{transcript.courseName}</h3>
          <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '15px' }}>
            <thead>
              <tr><th>Module</th><th>Credits</th><th>Type</th><th>Marks</th><th>Grade</th></tr>
            </thead>
            <tbody>
              {transcript.moduleRows.map((r, i) => (
                <tr key={i}>
                  <td>{r.module_name}</td>
                  <td>{r.credits ?? '—'}</td>
                  <td style={{ textTransform: 'capitalize' }}>{r.eval_type || '—'}</td>
                  <td>{r.marks !== null ? r.marks : 'Pending'}</td>
                  <td>{r.grade || '—'}</td>
                </tr>
              ))}
              {transcript.moduleRows.length === 0 && (
                <tr><td colSpan="5">No modules defined for this course.</td></tr>
              )}
            </tbody>
          </table>
          <p><strong>Overall Result:</strong> {transcript.overallResult}</p>
          <button onClick={downloadPdf} style={{ padding: '8px 16px' }}>Download Transcript PDF</button>
        </div>
      )}
    </div>
  );
}
