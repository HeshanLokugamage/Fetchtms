export default function Header() {
  return (
    <header className="app-header" style={{ position: 'relative' }}>
      <div style={{ width: '60px' }}></div>
      <h1 style={{ flex: 1, textAlign: 'center' }}>Fetch Consultants (Pvt) Ltd</h1>
      <img src="/logo.jpg" alt="Company Logo" style={{ width: '50px', height: '50px', objectFit: 'contain', borderRadius: '4px', background: '#fff', padding: '2px' }} />
    </header>
  );
}