import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function ProfitLossPage() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const params = {};
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
      const res = await axios.get('https://fetchtms.onrender.com/reports/profit-loss', { headers: getHeaders(), params });
      setReport(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate report');
      setReport(null);
    }
  };

  return (
    <div style={{ maxWidth: '700px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Profit & Loss</h2>
        <button onClick={() => navigate('/admin/reports')} style={{ padding: '8px 16px' }}>← Back</button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleGenerate} style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'end' }}>
        <div>
          <label>From Date (optional)</label><br />
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={{ padding: '8px' }} />
        </div>
        <div>
          <label>To Date (optional)</label><br />
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={{ padding: '8px' }} />
        </div>
        <button type="submit" style={{ padding: '8px 16px' }}>Generate</button>
      </form>

      {report && (
        <>
          <h3>Income</h3>
          <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '20px' }}>
            <tbody>
              {report.accounts.filter(a => a.type === 'Income').map(a => (
                <tr key={a.account_id}><td>{a.code} — {a.name}</td><td style={{ textAlign: 'right' }}>{a.balance.toFixed(2)}</td></tr>
              ))}
              <tr style={{ fontWeight: 'bold' }}><td>Total Income</td><td style={{ textAlign: 'right' }}>{report.totalIncome.toFixed(2)}</td></tr>
            </tbody>
          </table>

          <h3>Expenses</h3>
          <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '20px' }}>
            <tbody>
              {report.accounts.filter(a => a.type === 'Expense').map(a => (
                <tr key={a.account_id}><td>{a.code} — {a.name}</td><td style={{ textAlign: 'right' }}>{a.balance.toFixed(2)}</td></tr>
              ))}
              <tr style={{ fontWeight: 'bold' }}><td>Total Expenses</td><td style={{ textAlign: 'right' }}>{report.totalExpense.toFixed(2)}</td></tr>
            </tbody>
          </table>

          <h3 style={{ color: report.netProfit >= 0 ? 'green' : 'red' }}>
            Net {report.netProfit >= 0 ? 'Profit' : 'Loss'}: {report.netProfit.toFixed(2)}
          </h3>
        </>
      )}
    </div>
  );
}