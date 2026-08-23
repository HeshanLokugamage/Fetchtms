import { useNavigate } from 'react-router-dom';

export default function OperationsHome() {
  const navigate = useNavigate();

  const linkStyle = {
    display: 'block',
    padding: '16px',
    marginBottom: '12px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    textDecoration: 'none',
    color: '#333',
    fontSize: '18px',
    cursor: 'pointer',
    background: 'none',
    width: '100%',
    textAlign: 'left'
  };

  return (
    <div style={{ maxWidth: '500px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2>Operations</h2>
        <button onClick={() => navigate('/admin')} style={{ padding: '8px 16px' }}>← Back to Dashboard</button>
      </div>

      <button style={linkStyle} onClick={() => navigate('/admin/operations/payment')}>💰 Record Payment</button>
      <button style={linkStyle} onClick={() => navigate('/admin/operations/certificate')}>🎓 Issue Certificate</button>
      <button style={linkStyle} onClick={() => navigate('/admin/operations/assign-resource-person')}>🔗 Assign Resource Person to Course</button>
      <button style={linkStyle} onClick={() => navigate('/admin/operations/register-course')}>📋 Register Student for Course</button>
      <button style={linkStyle} onClick={() => navigate('/admin/operations/create-resource-person')}>👤 Create Resource Person</button>
      <button style={linkStyle} onClick={() => navigate('/admin/operations/create-user')}>🔑 Create User Account</button>
      <button style={linkStyle} onClick={() => navigate('/admin/operations/assign-coordinator')}>🧑‍🏫 Assign Coordinator to Course</button>
    </div>
  );
}