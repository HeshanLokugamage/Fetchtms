import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [sessionsCount, setSessionsCount] = useState('');
  const [trainingMode, setTrainingMode] = useState('');
  const [venue, setVenue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [fee, setFee] = useState('');
  const [certificateType, setCertificateType] = useState('');
  const [level, setLevel] = useState('');

  const [moduleCourseId, setModuleCourseId] = useState('');
  const [moduleName, setModuleName] = useState('');
  const [moduleCredits, setModuleCredits] = useState('');

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const loadCourses = () => {
    axios.get('https://fetchtms.onrender.com/courses', { headers: getHeaders() })
      .then(res => setCourses(res.data))
      .catch(err => setError(err.response?.data?.error || 'Failed to load courses'));
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handlePublishCourse = async (courseId) => {
    setMessage('');
    setError('');
    try {
      await axios.patch(`https://fetchtms.onrender.com/courses/${courseId}/publish`, {}, { headers: getHeaders() });
      setMessage('Course published successfully');
      loadCourses();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to publish course');
    }
  };

  const handleRegisterCourse = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      await axios.post('https://fetchtms.onrender.com/courses', {
        code,
        name,
        category,
        description,
        duration,
        sessions_count: sessionsCount,
        training_mode: trainingMode,
        venue,
        start_date: startDate,
        end_date: endDate,
        max_participants: maxParticipants,
        fee,
        certificate_type: certificateType,
        level
      }, { headers: getHeaders() });

      setMessage('Course created successfully');
      setCode(''); setName(''); setCategory(''); setDescription('');
      setDuration(''); setSessionsCount(''); setTrainingMode(''); setVenue('');
      setStartDate(''); setEndDate(''); setMaxParticipants(''); setFee(''); setCertificateType('');
      setLevel('');
      loadCourses();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create course');
    }
  };

  const handleCreateModule = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      await axios.post('https://fetchtms.onrender.com/modules', {
        course_id: moduleCourseId,
        module_name: moduleName,
        credits: moduleCredits
      }, { headers: getHeaders() });
      setMessage('Module created successfully');
      setModuleCourseId(''); setModuleName(''); setModuleCredits('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create module');
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Courses</h2>
        <button onClick={() => navigate('/admin')} style={{ padding: '8px 16px' }}>← Back to Dashboard</button>
      </div>

      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h3>Register New Course</h3>
      <form onSubmit={handleRegisterCourse} style={{ marginBottom: '40px' }}>
        <div style={{ marginBottom: '10px' }}>
          <label>Code</label><br />
          <input value={code} onChange={e => setCode(e.target.value)} style={{ width: '100%', padding: '8px' }} required />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Name</label><br />
          <input value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '8px' }} required />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Level</label><br />
          <select value={level} onChange={e => setLevel(e.target.value)} style={{ width: '100%', padding: '8px' }}>
            <option value="">Select Level</option>
            <option value="Certificate">Certificate</option>
            <option value="Diploma">Diploma</option>
            <option value="Degree">Degree</option>
            <option value="NVQ Level 1">NVQ Level 1</option>
            <option value="NVQ Level 2">NVQ Level 2</option>
            <option value="NVQ Level 3">NVQ Level 3</option>
          </select>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Category</label><br />
          <input value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', padding: '8px' }} />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Description</label><br />
          <textarea value={description} onChange={e => setDescription(e.target.value)} style={{ width: '100%', padding: '8px' }} />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Duration</label><br />
          <input value={duration} onChange={e => setDuration(e.target.value)} style={{ width: '100%', padding: '8px' }} placeholder="e.g. 6 weeks" />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Number of Sessions</label><br />
          <input type="number" value={sessionsCount} onChange={e => setSessionsCount(e.target.value)} style={{ width: '100%', padding: '8px' }} />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Training Mode</label><br />
          <select value={trainingMode} onChange={e => setTrainingMode(e.target.value)} style={{ width: '100%', padding: '8px' }}>
            <option value="">Select</option>
            <option value="online">Online</option>
            <option value="in-person">In-Person</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Venue</label><br />
          <input value={venue} onChange={e => setVenue(e.target.value)} style={{ width: '100%', padding: '8px' }} />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Start Date</label><br />
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ width: '100%', padding: '8px' }} />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>End Date</label><br />
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ width: '100%', padding: '8px' }} />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Max Participants</label><br />
          <input type="number" value={maxParticipants} onChange={e => setMaxParticipants(e.target.value)} style={{ width: '100%', padding: '8px' }} />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Fee</label><br />
          <input type="number" value={fee} onChange={e => setFee(e.target.value)} style={{ width: '100%', padding: '8px' }} />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Certificate Type</label><br />
          <input value={certificateType} onChange={e => setCertificateType(e.target.value)} style={{ width: '100%', padding: '8px' }} />
        </div>
        <button type="submit" style={{ padding: '8px 16px' }}>Register Course</button>
      </form>

      <h3>Courses ({courses.length})</h3>
      <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '40px' }}>
        <thead>
          <tr><th>ID</th><th>Code</th><th>Name</th><th>Level</th><th>Status</th><th>Action</th></tr>
        </thead>
        <tbody>
          {courses.map(c => (
            <tr key={c.course_id}>
              <td>{c.course_id}</td>
              <td>{c.code}</td>
              <td>{c.name}</td>
              <td>{c.level || '—'}</td>
              <td>{c.status}</td>
              <td>
                {c.status !== 'published' ? (
                  <button onClick={() => handlePublishCourse(c.course_id)} style={{ padding: '4px 10px', marginRight: '6px' }}>
                    Publish
                  </button>
                ) : (
                  <span style={{ color: 'gray', marginRight: '6px' }}>—</span>
                )}
                <button onClick={() => navigate(`/admin/courses/${c.course_id}`)} style={{ padding: '4px 10px' }}>
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Create Module for a Course</h3>
      <form onSubmit={handleCreateModule}>
        <div style={{ marginBottom: '10px' }}>
          <label>Course ID</label><br />
          <input value={moduleCourseId} onChange={e => setModuleCourseId(e.target.value)} style={{ width: '100%', padding: '8px' }} required />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Module Name</label><br />
          <input value={moduleName} onChange={e => setModuleName(e.target.value)} style={{ width: '100%', padding: '8px' }} required />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Credits</label><br />
          <input type="number" value={moduleCredits} onChange={e => setModuleCredits(e.target.value)} style={{ width: '100%', padding: '8px' }} required />
        </div>
        <button type="submit" style={{ padding: '8px 16px' }}>Create Module</button>
      </form>
    </div>
  );
}