import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function StudentsPage() {
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [nicPassport, setNicPassport] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [qualification, setQualification] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const handleRegisterStudent = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      await axios.post('https://fetchtms.onrender.com/students', {
        full_name: fullName,
        nic_passport: nicPassport,
        dob,
        gender,
        address,
        contact_number: contactNumber,
        email,
        organization,
        job_title: jobTitle,
        qualification,
        emergency_contact: emergencyContact
      }, { headers: getHeaders() });

      setMessage('Student registered successfully');
      setFullName(''); setNicPassport(''); setDob(''); setGender('');
      setAddress(''); setContactNumber(''); setEmail(''); setOrganization('');
      setJobTitle(''); setQualification(''); setEmergencyContact('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register student');
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Students</h2>
        <div>
          <button onClick={() => navigate('/admin/students/list')} style={{ padding: '8px 16px', marginRight: '10px' }}>View Students List</button>
          <button onClick={() => navigate('/admin/students/search')} style={{ padding: '8px 16px', marginRight: '10px' }}>Search Student</button>
          <button onClick={() => navigate('/admin')} style={{ padding: '8px 16px' }}>← Back to Dashboard</button>
        </div>
      </div>

      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h3>Register New Student</h3>
      <form onSubmit={handleRegisterStudent}>
        <div style={{ marginBottom: '10px' }}>
          <label>Full Name</label><br />
          <input value={fullName} onChange={e => setFullName(e.target.value)} style={{ width: '100%', padding: '8px' }} required />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>NIC / Passport</label><br />
          <input value={nicPassport} onChange={e => setNicPassport(e.target.value)} style={{ width: '100%', padding: '8px' }} />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Date of Birth</label><br />
          <input type="date" value={dob} onChange={e => setDob(e.target.value)} style={{ width: '100%', padding: '8px' }} />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Gender</label><br />
          <select value={gender} onChange={e => setGender(e.target.value)} style={{ width: '100%', padding: '8px' }}>
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Address</label><br />
          <input value={address} onChange={e => setAddress(e.target.value)} style={{ width: '100%', padding: '8px' }} />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Contact Number</label><br />
          <input value={contactNumber} onChange={e => setContactNumber(e.target.value)} style={{ width: '100%', padding: '8px' }} />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Email</label><br />
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '8px' }} required />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Organization</label><br />
          <input value={organization} onChange={e => setOrganization(e.target.value)} style={{ width: '100%', padding: '8px' }} />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Job Title</label><br />
          <input value={jobTitle} onChange={e => setJobTitle(e.target.value)} style={{ width: '100%', padding: '8px' }} />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Qualification</label><br />
          <input value={qualification} onChange={e => setQualification(e.target.value)} style={{ width: '100%', padding: '8px' }} />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Emergency Contact</label><br />
          <input value={emergencyContact} onChange={e => setEmergencyContact(e.target.value)} style={{ width: '100%', padding: '8px' }} />
        </div>
        <button type="submit" style={{ padding: '8px 16px' }}>Register Student</button>
      </form>
    </div>
  );
}