import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const TITLE_OPTIONS = ['Mr', 'Mrs', 'Ms', 'Miss', 'Dr', 'Prof', 'Eng.', 'Rev.', 'Other'];
const QUALIFICATION_OPTIONS = ['GCE O/L', 'GCE A/L', 'Associate Diploma', 'Diploma', 'Higher Diploma', 'Degree', 'Masters', 'PhD', 'NVQ'];
const DAY_OPTIONS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CreateResourcePersonPage() {
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);

  const [rpName, setRpName] = useState('');
  const [rpTitle, setRpTitle] = useState('');
  const [rpOrganization, setRpOrganization] = useState('');
  const [rpQualification, setRpQualification] = useState('');
  const [rpDays, setRpDays] = useState([]);
  const [rpCourses, setRpCourses] = useState([]);
  const [rpFeePerHour, setRpFeePerHour] = useState('');

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    axios.get('https://fetchtms.onrender.com/courses', { headers: getHeaders() })
      .then(res => setCourses(res.data))
      .catch(() => {});
  }, []);

  const toggleDay = (day) => {
    setRpDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const toggleCourse = (name) => {
    setRpCourses(prev => prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]);
  };

  const handleCreateResourcePerson = async (e) => {
    e.preventDefault();
    setMessage(''); setError('');
    try {
      const res = await axios.post('https://fetchtms.onrender.com/resource-persons', {
        name: rpName,
        title: rpTitle,
        organization: rpOrganization,
        qualifications: rpQualification,
        available_dates: rpDays.join(', '),
        subjects: rpCourses.join(', '),
        fee_per_hour: rpFeePerHour
      }, { headers: getHeaders() });
      setMessage(`Resource person created! Trainer ID: ${res.data.resourcePerson.trainer_id}`);
      setRpName(''); setRpTitle(''); setRpOrganization(''); setRpQualification('');
      setRpDays([]); setRpCourses([]); setRpFeePerHour('');
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
          <select value={rpTitle} onChange={e => setRpTitle(e.target.value)} style={{ width: '100%', padding: '8px' }}>
            <option value="">Select Title</option>
            {TITLE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Organization</label><br />
          <input value={rpOrganization} onChange={e => setRpOrganization(e.target.value)} style={{ width: '100%', padding: '8px' }} />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Qualification</label><br />
          <select value={rpQualification} onChange={e => setRpQualification(e.target.value)} style={{ width: '100%', padding: '8px' }}>
            <option value="">Select Qualification</option>
            {QUALIFICATION_OPTIONS.map(q => <option key={q} value={q}>{q}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Available Days</label><br />
          <div className="btn-row">
            {DAY_OPTIONS.map(day => (
              <label key={day} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', border: '1px solid #ccc', borderRadius: '6px', padding: '6px 10px' }}>
                <input type="checkbox" checked={rpDays.includes(day)} onChange={() => toggleDay(day)} />
                {day}
              </label>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Course(s)</label><br />
          <div style={{ maxHeight: '160px', overflowY: 'auto', border: '1px solid #ccc', borderRadius: '6px', padding: '8px' }}>
            {courses.map(c => (
              <label key={c.course_id} style={{ display: 'block', marginBottom: '6px' }}>
                <input
                  type="checkbox"
                  checked={rpCourses.includes(c.name)}
                  onChange={() => toggleCourse(c.name)}
                  style={{ marginRight: '6px' }}
                />
                {c.code} — {c.name}
              </label>
            ))}
            {courses.length === 0 && <p style={{ fontSize: '13px', color: 'gray' }}>No courses found — create a course first.</p>}
          </div>
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
