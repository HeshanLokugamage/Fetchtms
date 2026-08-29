import { useNavigate } from 'react-router-dom';

export default function OperationsHome() {
  const navigate = useNavigate();

  const items = [
    { icon: '💰', title: 'Record Payment', desc: 'Log a student payment against a course', path: '/admin/operations/payment' },
    { icon: '🎓', title: 'Issue Certificate', desc: 'Generate a certificate of participation', path: '/admin/operations/certificate' },
    { icon: '📄', title: 'View / Download Transcript', desc: 'Module marks and grades per student', path: '/admin/operations/transcript' },
    { icon: '🔗', title: 'Assign Resource Person to Course', desc: 'Link a trainer to a course', path: '/admin/operations/assign-resource-person' },
    { icon: '📋', title: 'Register Student for Course', desc: 'Enroll a student and record the fee owed', path: '/admin/operations/register-course' },
    { icon: '👤', title: 'Create Resource Person', desc: 'Add a new trainer profile', path: '/admin/operations/create-resource-person' },
    { icon: '🔑', title: 'Create User Account', desc: 'Create a login for a student, trainer, or staff member', path: '/admin/operations/create-user' },
    { icon: '🧑‍🏫', title: 'Assign Coordinator to Course', desc: 'Set who reviews marks for a course', path: '/admin/operations/assign-coordinator' },
    { icon: '🧾', title: 'Receipt Journal', desc: 'Record a student fee receipt', path: '/admin/operations/receipt-journal' },
    { icon: '💸', title: 'Payment Journal', desc: 'Record company payments and expenses', path: '/admin/operations/payment-journal' },
    { icon: '🏢', title: 'Manage Vendors', desc: 'Add or view vendors for payments', path: '/admin/operations/manage-vendors' },
    { icon: '📖', title: 'General Journal Entry', desc: 'Record a manual balanced journal entry', path: '/admin/operations/general-journal' },
    { icon: '📚', title: 'Journal Entries', desc: 'View or reverse past journal entries', path: '/admin/operations/journal-entries' },
    { icon: '💳', title: 'Manage Payment Methods', desc: 'Add or view accepted payment methods', path: '/admin/operations/manage-payment-methods' }
  ];

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h2>Operations</h2>
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
