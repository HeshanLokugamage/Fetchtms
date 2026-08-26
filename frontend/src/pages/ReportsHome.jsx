import { useNavigate } from 'react-router-dom';

export default function ReportsHome() {
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
        <h2>Reports</h2>
        <button onClick={() => navigate('/admin')} style={{ padding: '8px 16px' }}>← Back to Dashboard</button>
      </div>

      <button style={linkStyle} onClick={() => navigate('/admin/reports/profit-loss')}>📈 Profit & Loss</button>
      <button style={linkStyle} onClick={() => navigate('/admin/reports/balance-sheet')}>⚖️ Balance Sheet</button>
      <button style={linkStyle} onClick={() => navigate('/admin/reports/outstanding')}>💰 Outstanding Report</button>
      <button style={linkStyle} onClick={() => navigate('/admin/reports/student-balance-summary')}>🧑‍🎓 Student Balance Summary</button>
      <button style={linkStyle} onClick={() => navigate('/admin/reports/resource-person-summary')}>👨‍🏫 Resource Person Payment Summary</button>
    </div>
  );
}