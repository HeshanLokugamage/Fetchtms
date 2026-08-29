import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

export default function CourseDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [details, setDetails] = useState(null);
  const [allResourcePersons, setAllResourcePersons] = useState([]);
  const [allCoordinators, setAllCoordinators] = useState([]);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);

  const [selectedRp, setSelectedRp] = useState('');
  const [selectedCoordinator, setSelectedCoordinator] = useState('');

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const loadDetails = () => {
    axios.get(`https://fetchtms.onrender.com/courses/${id}/details`, { headers: getHeaders() })
      .then(res => {
        setDetails(res.data);
        setForm(res.data.course);
        setSelectedRp(res.data.resourcePersons[0]?.trainer_id || '');
        setSelectedCoordinator(res.data.coordinators[0]?.coordinator_id || '');
      })
      .catch(err => setError(err.response?.data?.error || 'Failed to load course details'));
  };

  useEffect(() => {
    loadDetails();
    axios.get('https://fetchtms.onrender.com/resource-persons', { headers: getHeaders() })
      .then(res => setAllResourcePersons(res.data))
      .catch(() => {});
    axios.get('https://fetchtms.onrender.com/users', { headers: getHeaders() })
      .then(res => setAllCoordinators(res.data.filter(u => u.role === 'coordinator')))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSaveCourse = async (e) => {
    e.preventDefault();
    setMessage(''); setError('');
    try {
      await axios.put(`https://fetchtms.onrender.com/courses/${id}`, form, { headers: getHeaders() });
      setMessage('Course updated successfully');
      setEditing(false);
      loadDetails();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update course');
    }
  };

  const handleChangeResourcePerson = async () => {
    setMessage(''); setError('');
    try {
      await axios.put(`https://fetchtms.onrender.com/courses/${id}/assign-resource-person`,
        { trainer_id: selectedRp }, { headers: getHeaders() });
      setMessage('Resource person updated');
      loadDetails();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update resource person');
    }
  };

  const handleChangeCoordinator = async () => {
    setMessage(''); setError('');
    try {
      await axios.put(`https://fetchtms.onrender.com/courses/${id}/assign-coordinator`,
        { coordinator_id: selectedCoordinator }, { headers: getHeaders() });
      setMessage('Coordinator updated');
      loadDetails();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update coordinator');
    }
  };

  const handleCancelRegistration = async (registrationId) => {
    setMessage(''); setError('');
    try {
      await axios.delete(`https://fetchtms.onrender.com/registrations/${registrationId}`, { headers: getHeaders() });
      setMessage('Registration cancelled and fee reversed');
      loadDetails();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel registration');
    }
  };

  if (!details || !form) {
    return (
      <div style={{ maxWidth: '900px', margin: '40px auto', fontFamily: 'sans-serif' }}>
        {error ? <p style={{ color: 'red' }}>{error}</p> : <p>Loading...</p>}
      </div>
    );
  }

  const { course, modules, students } = details;

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>{course.code} — {course.name}</h2>
        <button onClick={() => navigate('/admin/courses')} style={{ padding: '8px 16px' }}>← Back to Courses</button>
      </div>

      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
        <h3>Course Details</h3>
        <button onClick={() => setEditing(!editing)} style={{ padding: '6px 12px' }}>
          {editing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      {!editing ? (
        <table cellPadding="6" style={{ width: '100%', marginBottom: '20px' }}>
          <tbody>
            <tr><td><strong>Level</strong></td><td>{course.level || '—'}</td></tr>
            <tr><td><strong>Category</strong></td><td>{course.category || '—'}</td></tr>
            <tr><td><strong>Description</strong></td><td>{course.description || '—'}</td></tr>
            <tr><td><strong>Duration</strong></td><td>{course.duration || '—'}</td></tr>
            <tr><td><strong>Training Mode</strong></td><td>{course.training_mode || '—'}</td></tr>
            <tr><td><strong>Venue</strong></td><td>{course.venue || '—'}</td></tr>
            <tr><td><strong>Start Date</strong></td><td>{course.start_date || '—'}</td></tr>
            <tr><td><strong>End Date</strong></td><td>{course.end_date || '—'}</td></tr>
            <tr><td><strong>Max Participants</strong></td><td>{course.max_participants || '—'}</td></tr>
            <tr><td><strong>Fee</strong></td><td>{course.fee || 0}</td></tr>
            <tr><td><strong>Status</strong></td><td>{course.status}</td></tr>
          </tbody>
        </table>
      ) : (
        <form onSubmit={handleSaveCourse} style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '12px', color: 'gray' }}>
            Note: changing the Fee only applies to students registered after this change. Students already
            registered keep the fee amount recorded at the time they registered.
          </p>
          {[
            ['name', 'Name'], ['category', 'Category'], ['duration', 'Duration'],
            ['venue', 'Venue'], ['fee', 'Fee'], ['max_participants', 'Max Participants']
          ].map(([field, label]) => (
            <div key={field} style={{ marginBottom: '10px' }}>
              <label>{label}</label><br />
              <input
                value={form[field] || ''}
                onChange={e => setForm({ ...form, [field]: e.target.value })}
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
          ))}
          <div style={{ marginBottom: '10px' }}>
            <label>Description</label><br />
            <textarea
              value={form.description || ''}
              onChange={e => setForm({ ...form, description: e.target.value })}
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
          <button type="submit" style={{ padding: '8px 16px' }}>Save Changes</button>
        </form>
      )}

      <h3>Resource Person</h3>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <select value={selectedRp} onChange={e => setSelectedRp(e.target.value)} style={{ flex: 1, padding: '8px' }}>
          <option value="">None assigned</option>
          {allResourcePersons.map(rp => (
            <option key={rp.trainer_id} value={rp.trainer_id}>{rp.name}</option>
          ))}
        </select>
        <button onClick={handleChangeResourcePerson} style={{ padding: '8px 16px' }}>Update</button>
      </div>

      <h3>Course Coordinator</h3>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <select value={selectedCoordinator} onChange={e => setSelectedCoordinator(e.target.value)} style={{ flex: 1, padding: '8px' }}>
          <option value="">None assigned</option>
          {allCoordinators.map(c => (
            <option key={c.user_id} value={c.user_id}>{c.username}</option>
          ))}
        </select>
        <button onClick={handleChangeCoordinator} style={{ padding: '8px 16px' }}>Update</button>
      </div>

      <h3>Modules ({modules.length})</h3>
      <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '30px' }}>
        <thead><tr><th>Module ID</th><th>Name</th><th>Credits</th></tr></thead>
        <tbody>
          {modules.map(m => (
            <tr key={m.module_id}><td>{m.module_id}</td><td>{m.module_name}</td><td>{m.credits}</td></tr>
          ))}
          {modules.length === 0 && <tr><td colSpan="3">No modules created yet.</td></tr>}
        </tbody>
      </table>

      <h3>Registered Students ({students.length})</h3>
      <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead><tr><th>Student</th><th>Fee</th><th>Paid</th><th>Balance</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>
          {students.map(s => (
            <tr key={s.registration.registration_id}>
              <td>{s.student?.full_name || s.registration.student_id}</td>
              <td>{s.fee}</td>
              <td>{s.paid}</td>
              <td>{s.balance}</td>
              <td>{s.registration.status}</td>
              <td>
                <div className="btn-row">
                  <a
                    href={`https://fetchtms.onrender.com/registrations/${s.registration.registration_id}/invoice/pdf`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Invoice
                  </a>
                  {s.paid > 0 ? (
                    <span style={{ color: 'gray', fontSize: '12px' }}>Payments made — cannot cancel</span>
                  ) : (
                    <button
                      onClick={() => {
                        if (window.confirm(`Cancel ${s.student?.full_name || 'this student'}'s registration and reverse the fee?`)) {
                          handleCancelRegistration(s.registration.registration_id);
                        }
                      }}
                    >
                      Cancel Registration
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {students.length === 0 && <tr><td colSpan="6">No students registered yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
