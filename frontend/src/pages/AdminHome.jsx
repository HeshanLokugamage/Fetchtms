import { useNavigate } from 'react-router-dom';

export default function AdminHome() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const linkStyle = {
    display: 'block',
    padding: '16px',
    marginBottom: '12px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    textDecoration: 'none',
    color: '#333',
    fontSize: '18px'
  };

  return (
    <div style={{ maxWidth: '500px', margin: '60px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2>Admin Dashboard</h2>
        <button onClick={handleLogout} style={{ padding: '8px 16px' }}>Log Out</button>
      </div>

      <a href="/admin/students" style={linkStyle} onClick={e => { e.preventDefault(); navigate('/admin/students'); }}>
        📋 Students
      </a>
      <a href="/admin/courses" style={linkStyle} onClick={e => { e.preventDefault(); navigate('/admin/courses'); }}>
        📚 Courses
      </a>
      <a href="/admin/operations" style={linkStyle} onClick={e => { e.preventDefault(); navigate('/admin/operations'); }}>
        ⚙️ Operations (Payments, Certificates, Assignments, Users)
      </a>
      <a href="/admin/reports" style={linkStyle} onClick={e => { e.preventDefault(); navigate('/admin/reports'); }}>
        📊 Reports
      </a>
    </div>
  );
}