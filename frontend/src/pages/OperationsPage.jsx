import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function OperationsPage() {
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const [payStudentId, setPayStudentId] = useState('');
  const [payCourseId, setPayCourseId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payType, setPayType] = useState('debit');
  const [payStatus, setPayStatus] = useState('pending');

  const [certStudentId, setCertStudentId] = useState('');
  const [certCourseId, setCertCourseId] = useState('');

  const [assignCourseId, setAssignCourseId] = useState('');
  const [assignTrainerId, setAssignTrainerId] = useState('');

  const [regStudentId, setRegStudentId] = useState('');
  const [regCourseId, setRegCourseId] = useState('');

  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('student');
  const [newUserStudentId, setNewUserStudentId] = useState('');

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setMessage(''); setError('');
    try {
      await axios.post('https://fetchtms.onrender.com/payments', {
        student_id: payStudentId, course_id: payCourseId, amount: payAmount, type: payType, status: payStatus
      }, { headers: getHeaders() });
      setMessage('Payment recorded successfully');
      setPayStudentId(''); setPayCourseId(''); setPayAmount(''); setPayType('debit'); setPayStatus('pending');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record payment');
    }
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

  const handleAssignResourcePerson = async (e) => {
    e.preventDefault();
    setMessage(''); setError('');
    try {
      await axios.post('https://fetchtms.onrender.com/course-resource-persons', {
        course_id: assignCourseId, trainer_id: assignTrainerId
      }, { headers: getHeaders() });
      setMessage('Resource person assigned successfully');
      setAssignCourseId(''); setAssignTrainerId('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to assign resource person');
    }
  };

  const handleRegisterForCourse = async (e) => {
    e.preventDefault();
    setMessage(''); setError('');
    try {
      await axios.post('https://fetchtms.onrender.com/registrations', {
        student_id: regStudentId, course_id: regCourseId
      }, { headers: getHeaders() });
      setMessage('Student registered for course successfully');
      setRegStudentId(''); setRegCourseId('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register student for course');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setMessage(''); setError('');
    try {
      await axios.post('https://fetchtms.onrender.com/users', {
        username: newUsername, password: newPassword, role: newUserRole,
        student_id: newUserRole === 'student' ? newUserStudentId : undefined
      }, { headers: getHeaders() });
      setMessage(`User account "${newUsername}" created successfully`);
      setNewUsername(''); setNewPassword(''); setNewUserRole('student'); setNewUserStudentId('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user account');
    }
  };

  return (
    <div style={{ maxWidth: '700px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Operations</h2>
        <button onClick={() => navigate('/admin')} style={{ padding: '8px 16px' }}>← Back to Dashboard</button>
      </div>

      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

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
      <form onSubmit={handleRegisterForCourse} style={{ marginBottom: '40px' }}>
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

      <h3>Create User Account</h3>
      <form onSubmit={handleCreateUser}>
        <div style={{ marginBottom: '10px' }}>
          <label>Username</label><br />
          <input value={newUsername} onChange={e => setNewUsername(e.target.value)} style={{ width: '100%', padding: '8px' }} required />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Password</label><br />
          <input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ width: '100%', padding: '8px' }} required />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Role</label><br />
          <select value={newUserRole} onChange={e => setNewUserRole(e.target.value)} style={{ width: '100%', padding: '8px' }}>
            <option value="student">Student</option>
            <option value="resource_person">Resource Person</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        {newUserRole === 'student' && (
          <div style={{ marginBottom: '10px' }}>
            <label>Link to Student ID</label><br />
            <input value={newUserStudentId} onChange={e => setNewUserStudentId(e.target.value)} style={{ width: '100%', padding: '8px' }} placeholder="e.g. 3 (from Students page)" required />
          </div>
        )}
        <button type="submit" style={{ padding: '8px 16px' }}>Create User Account</button>
      </form>
    </div>
  );
}