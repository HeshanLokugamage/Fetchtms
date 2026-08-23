import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function GeneralJournalPage() {
  const [accounts, setAccounts] = useState([]);
  const [entryDate, setEntryDate] = useState('');
  const [description, setDescription] = useState('');
  const [lines, setLines] = useState([
    { account_id: '', debit_amount: '', credit_amount: '' },
    { account_id: '', debit_amount: '', credit_amount: '' }
  ]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    axios.get('https://fetchtms.onrender.com/accounts', { headers: getHeaders() })
      .then(res => setAccounts(res.data))
      .catch(() => {});
  }, []);

  const updateLine = (index, field, value) => {
    const newLines = [...lines];
    newLines[index][field] = value;
    setLines(newLines);
  };

  const addLine = () => {
    setLines([...lines, { account_id: '', debit_amount: '', credit_amount: '' }]);
  };

  const removeLine = (index) => {
    if (lines.length <= 2) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  const totalDebit = lines.reduce((sum, l) => sum + Number(l.debit_amount || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + Number(l.credit_amount || 0), 0);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(''); setError('');
    try {
      await axios.post('https://fetchtms.onrender.com/journal/general', {
        entry_date: entryDate,
        description,
        lines: lines.map(l => ({
          account_id: l.account_id,
          debit_amount: Number(l.debit_amount || 0),
          credit_amount: Number(l.credit_amount || 0)
        }))
      }, { headers: getHeaders() });
      setMessage('General journal entry recorded successfully');
      setEntryDate(''); setDescription('');
      setLines([
        { account_id: '', debit_amount: '', credit_amount: '' },
        { account_id: '', debit_amount: '', credit_amount: '' }
      ]);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record journal entry');
    }
  };

  return (
    <div style={{ maxWidth: '700px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>General Journal Entry</h2>
        <button onClick={() => navigate('/admin/operations')} style={{ padding: '8px 16px' }}>← Back</button>
      </div>

      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label>Date</label><br />
          <input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} style={{ width: '100%', padding: '8px' }} required />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>Description</label><br />
          <input value={description} onChange={e => setDescription(e.target.value)} style={{ width: '100%', padding: '8px' }} required />
        </div>

        <h4>Lines</h4>
        {lines.map((line, index) => (
          <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '10px', alignItems: 'center' }}>
            <select
              value={line.account_id}
              onChange={e => updateLine(index, 'account_id', e.target.value)}
              style={{ flex: 2, padding: '8px' }}
              required
            >
              <option value="">Select Account</option>
              {accounts.map(a => (
                <option key={a.account_id} value={a.account_id}>{a.code} — {a.name}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Debit"
              value={line.debit_amount}
              onChange={e => updateLine(index, 'debit_amount', e.target.value)}
              style={{ flex: 1, padding: '8px' }}
            />
            <input
              type="number"
              placeholder="Credit"
              value={line.credit_amount}
              onChange={e => updateLine(index, 'credit_amount', e.target.value)}
              style={{ flex: 1, padding: '8px' }}
            />
            {lines.length > 2 && (
              <button type="button" onClick={() => removeLine(index)} style={{ padding: '4px 8px' }}>✕</button>
            )}
          </div>
        ))}

        <button type="button" onClick={addLine} style={{ padding: '6px 12px', marginBottom: '15px' }}>+ Add Line</button>

        <p style={{ fontWeight: 'bold', color: isBalanced ? 'green' : 'red' }}>
          Total Debit: {totalDebit} | Total Credit: {totalCredit} {isBalanced ? '✓ Balanced' : '✗ Not Balanced'}
        </p>

        <button type="submit" style={{ padding: '8px 16px' }} disabled={!isBalanced}>Submit Journal Entry</button>
      </form>
    </div>
  );
}