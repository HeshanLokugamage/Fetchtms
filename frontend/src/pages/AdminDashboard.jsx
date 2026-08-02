import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // Student registration form state
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

  // Course registration form state
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

  // Payment recording form state
  const [payStudentId, setPayStudentId] = useState('');
  const [payCourseId, setPayCourseId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payType, setPayType] = useState('debit');
  const [payStatus, setPayStatus] = useState('pending');

  // Certificate issuance form state
  const [certStudentId, setCertStudentId] = useState('');
  const [certCourseId, setCertCourseId] = useState('');

  // Assign resource person form state
  const [assignCourseId, setAssignCourseId] = useState('');
  const [assignTrainerId, setAssignTrainerId] = useState('');

  // Register student for course form state
  const [regStudentId, setRegStudentId] = useState('');
  const [regCourseId, setRegCourseId] = useState('');

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const loadStudents = () => {
    axios.get('https://fetchtms.onrender.com/students', { headers: getHeaders() })
      .then(res => setStudents(res.data))
      .catch(err => setError(err.response?.data?.error || 'Failed to load students'));
  };

  const loadCourses = () => {
    axios.get('https://fetchtms.onrender.com/courses', { headers: getHeaders() })
      .then(res => setCourses(res.data))
      .catch(err => setError(err.response?.data?.error || 'Failed to load courses'));
  };

  useEffect(() => {
    loadStudents();
    loadCourses();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

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
      loadStudents();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register student');
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
        certificate_type: certificateType
      }, { headers: getHeaders() });

      setMessage('Course created successfully');
      setCode(''); setName(''); setCategory(''); setDescription('');
      setDuration(''); setSessionsCount(''); setTrainingMode(''); setVenue('');
      setStartDate(''); setEndDate(''); setMaxParticipants(''); setFee(''); setCertificateType('');
      loadCourses();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create course');
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      await axios.post('https://fetchtms.onrender.com/payments', {
        student_id: payStudentId,
        course_id: payCourseId,
        amount: payAmount,
        type: payType,
        status: payStatus
      }, { headers: getHeaders() });
      setMessage('Payment recorded successfully');
      setPayStudentId(''); setPayCourseId(''); setPayAmount(''); setPayType('debit'); setPayStatus('pending');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record payment');
    }
  };

  const handleIssueCertificate = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const res = await axios.post('https://fetchtms.onrender.com/certificates', {
        student_id: certStudentId,
        course_id: certCourseId
      }, { headers: getHeaders() });
      setMessage(`Certificate issued! Verification code: ${res.data.certificate.verification_code}`);
      setCertStudentId('');
      setCertCourseId('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to issue certificate');
    }
  };

  const handleAssignResourcePerson = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      await axios.post('https://fetchtms.onrender.com/course-resource-persons', {
        course_id: assignCourseId,
        trainer_id: assignTrainerId
      }, { headers: getHeaders() });
      setMessage('Resource person assigned successfully');
      setAssignCourseId('');
      setAssignTrainerId('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to assign resource person');
    }
  };

  const handleRegisterForCourse = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      await axios.post('https://fetchtms.onrender.com/registrations', {
        student_id: regStudentId,
        course_id: regCourseId
      }, { headers: getHeaders() });
      setMessage('Student registered for course successfully');
      setRegStudentId('');
      setRegCourseId('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register student for course');
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Admin Dashboard</h2>
        <button onClick={handleLogout} style={{ padding: '8px 16px' }}>Log Out</button>
      </div>

      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h3>Students ({students.length})</h3>
      <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '20px' }}>
        <thead>
          <tr><th>ID</th><th>Full Name</th><th>Email</th><th>Status</th></tr>
        </thead>
        <tbody>
          {students.map(s => (
            <tr key={s.student_id}>
              <td>{s.student_id}</td><td>{s.full_name}</td><td>{s.email}</td><td>{s.registration_status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Register New Student</h3>
      <form onSubmit={handleRegisterStudent} style={{ marginBottom: '40px' }}>
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

      <h3>Courses ({courses.length})</h3>
      <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '20px' }}>
        <thead>
          <tr><th>ID</th><th>Code</th><th>Name</th><th>Status</th><th>Action</th></tr>
        </thead>
        <tbody>
          {courses.map(c => (
            <tr key={c.course_id}>
              <td>{c.course_id}</td>
              <td>{c.code}</td>
              <td>{c.name}</td>
              <td>{c.status}</td>
              <td>
                {c.status !== 'published' ? (
                  <button onClick={() => handlePublishCourse(c.course_id)} style={{ padding: '4px 10px' }}>
                    Publish
                  </button>
                ) : (
                  <span style={{ color: 'gray' }}>—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

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

      <h3>Record Payment</h3>
      <form onSubmit={handleRecordPayment} style={{ marginBottom: '40px' }}>
        <div style={{ marginBottom: '10px' }}>
          <label>Student ID</label><br />
          <input value={payStudentId} onChange={e => setPayStudentId(e.target.value)} style={{ width: '100%', padding: '8px' }} required />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Course ID</label><br />
          <input value={payCourseId} onChange={e => setPayCourseId(e.target.value)} style={{ width: '100%', padding: '8px' }} required />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Amount</label><br />
          <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} style={{ width: '100%', padding: '8px' }} required />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Type</label><br />
          <select value={payType} onChange={e => setPayType(e.target.value)} style={{ width: '100%', padding: '8px' }}>
            <option value="debit">Debit (fee owed)</option>
            <option value="credit">Credit (payment made)</option>
          </select>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Status</label><br />
          <select value={payStatus} onChange={e => setPayStatus(e.target.value)} style={{ width: '100%', padding: '8px' }}>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <button type="submit" style={{ padding: '8px 16px' }}>Record Payment</button>
      </form>

      <h3>Issue Certificate</h3>
      <form onSubmit={handleIssueCertificate} style={{ marginBottom: '40px' }}>
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

      <h3>Assign Resource Person to Course</h3>
      <form onSubmit={handleAssignResourcePerson} style={{ marginBottom: '40px' }}>
        <div style={{ marginBottom: '10px' }}>
          <label>Course ID</label><br />
          <input value={assignCourseId} onChange={e => setAssignCourseId(e.target.value)} style={{ width: '100%', padding: '8px' }} required />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Trainer ID</label><br />
          <input value={assignTrainerId} onChange={e => setAssignTrainerId(e.target.value)} style={{ width: '100%', padding: '8px' }} required />
        </div>
        <button type="submit" style={{ padding: '8px 16px' }}>Assign</button>
      </form>

      <h3>Register Student for Course</h3>
      <form onSubmit={handleRegisterForCourse}>
        <div style={{ marginBottom: '10px' }}>
          <label>Student ID</label><br />
          <input value={regStudentId} onChange={e => setRegStudentId(e.target.value)} style={{ width: '100%', padding: '8px' }} required />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Course ID</label><br />
          <input value={regCourseId} onChange={e => setRegCourseId(e.target.value)} style={{ width: '100%', padding: '8px' }} required />
        </div>
        <button type="submit" style={{ padding: '8px 16px' }}>Register</button>
      </form>
    </div>
  );
}