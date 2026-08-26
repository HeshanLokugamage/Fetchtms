import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function BalanceSheetPage() {
  const [asOfDate, setAsOfDate] = useState('');
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
      if (asOfDate) params.as_of_date = asOfDate;
      const res = await axios.get('https://fetchtms.onrender.com/reports/balance-sheet', { headers: getHeaders(), params });
      setReport(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate report');
      setReport(null);
    }
  };

  return (
    <div style={{ maxWidth: '700px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Balance Sheet</h2>
        <button onClick={() => navigate('/admin/reports')} style={{ padding: '8px 16px' }}>← Back</button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleGenerate} style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'end' }}>
        <div>
          <label>As Of Date (optional)</label><br />
          <input type="date" value={asOfDate} onChange={e => setAsOfDate(e.target.value)} style={{ padding: '8px' }} />
        </div>
        <button type="submit" style={{ padding: '8px 16px' }}>Generate</button>
      </form>

      {report && (
        <>
          <h3>Assets</h3>
          <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '20px' }}>
            <tbody>
              {report.accounts.filter(a => a.type === 'Asset').map(a => (
                <tr key={a.account_id}><td>{a.code} — {a.name}</td><td style={{ textAlign: 'right' }}>{a.balance.toFixed(2)}</td></tr>
              ))}
              <tr style={{ fontWeight: 'bold' }}><td>Total Assets</td><td style={{ textAlign: 'right' }}>{report.totalAssets.toFixed(2)}</td></tr>
            </tbody>
          </table>

          <h3>Liabilities</h3>
          <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '20px' }}>
            <tbody>
              {report.accounts.filter(a => a.type === 'Liability').map(a => (
                <tr key={a.account_id}><td>{a.code} — {a.name}</td><td style={{ textAlign: 'right' }}>{a.balance.toFixed(2)}</td></tr>
              ))}
              <tr style={{ fontWeight: 'bold' }}><td>Total Liabilities</td><td style={{ textAlign: 'right' }}>{report.totalLiabilities.toFixed(2)}</td></tr>
            </tbody>
          </table>

          <h3>Equity</h3>
          <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '20px' }}>
            <tbody>
              {report.accounts.filter(a => a.type === 'Equity').map(a => (
                <tr key={a.account_id}><td>{a.code} — {a.name}</td><td style={{ textAlign: 'right' }}>{a.balance.toFixed(2)}</td></tr>
              ))}
              <tr style={{ fontWeight: 'bold' }}><td>Total Equity</td><td style={{ textAlign: 'right' }}>{report.totalEquity.toFixed(2)}</td></tr>
            </tbody>
          </table>

          <h4 style={{ color: (report.totalAssets === report.totalLiabilities + report.totalEquity) ? 'green' : 'red' }}>
            Assets ({report.totalAssets.toFixed(2)}) {report.totalAssets === report.totalLiabilities + report.totalEquity ? '=' : '≠'} Liabilities + Equity ({(report.totalLiabilities + report.totalEquity).toFixed(2)})
          </h4>
        </>
      )}
    </div>
  );
}