import { useNavigate } from 'react-router-dom';

export default function AdminHome() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const items = [
    { icon: '📋', title: 'Students', desc: 'Register, search, and manage student records', path: '/admin/students' },
    { icon: '📚', title: 'Courses', desc: 'Create courses, modules, and view details', path: '/admin/courses' },
    { icon: '⚙️', title: 'Operations', desc: 'Payments, certificates, assignments, and accounts', path: '/admin/operations' },
    { icon: '📊', title: 'Reports', desc: 'Financial and academic reports', path: '/admin/reports' }
  ];

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h2>Admin Dashboard</h2>
        <button onClick={handleLogout}>Log Out</button>
      </div>

      <div className="menu-grid">
        {items.map(item => (
          <button key={item.path} className="menu-card" onClick={() => navigate(item.path)}>
            <span className="menu-icon">{item.icon}</span>
            <span>{item.title}</span>
            <span className="menu-desc">{item.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
