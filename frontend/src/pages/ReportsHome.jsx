import { useNavigate } from 'react-router-dom';

export default function ReportsHome() {
  const navigate = useNavigate();

  const items = [
    { icon: '📈', title: 'Profit & Loss', desc: 'Income and expenses over a period', path: '/admin/reports/profit-loss' },
    { icon: '⚖️', title: 'Balance Sheet', desc: 'Assets, liabilities, and equity as of a date', path: '/admin/reports/balance-sheet' },
    { icon: '💰', title: 'Outstanding Report', desc: 'Unpaid balances across all students', path: '/admin/reports/outstanding' },
    { icon: '🧑‍🎓', title: 'Student Balance Summary', desc: 'Per-student fee, payment, and balance totals', path: '/admin/reports/student-balance-summary' },
    { icon: '👨‍🏫', title: 'Resource Person Payment Summary', desc: 'Per-trainer payment totals', path: '/admin/reports/resource-person-summary' }
  ];

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h2>Reports</h2>
        <button onClick={() => navigate('/admin')}>← Back to Dashboard</button>
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
