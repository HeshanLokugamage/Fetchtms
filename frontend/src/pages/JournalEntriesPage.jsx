import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function JournalEntriesPage() {
  const [entries, setEntries] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [linesByEntry, setLinesByEntry] = useState({});
  const [accounts, setAccounts] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const loadEntries = () => {
    axios.get('https://fetchtms.onrender.com/journal/entries', { headers: getHeaders() })
      .then(res => setEntries(res.data))
      .catch(err => setError(err.response?.data?.error || 'Failed to load journal entries'));
  };

  useEffect(() => {
    loadEntries();
    axios.get('https://fetchtms.onrender.com/accounts', { headers: getHeaders() })
      .then(res => setAccounts(res.data))
      .catch(() => {});
  }, []);

  const getAccountLabel = (accountId) => {
    const acc = accounts.find(a => a.account_id === accountId);
    return acc ? `${acc.code} — ${acc.name}` : accountId;
  };

  const toggleExpand = async (entryId) => {
    if (expandedId === entryId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(entryId);
    if (!linesByEntry[entryId]) {
      try {
        const res = await axios.get(`https://fetchtms.onrender.com/journal/entries/${entryId}/lines`, { headers: getHeaders() });
        setLinesByEntry(prev => ({ ...prev, [entryId]: res.data }));
      } catch (err) {
        setError('Failed to load lines for this entry');
      }
    }
  };

  const handleReverse = async (entryId) => {
    setMessage(''); setError('');
    try {
      await axios.post(`https://fetchtms.onrender.com/journal/entries/${entryId}/reverse`, {}, { headers: getHeaders() });
      setMessage('Entry reversed successfully');
      loadEntries();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reverse entry');
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Journal Entries</h2>
        <button onClick={() => navigate('/admin/operations')} style={{ padding: '8px 16px' }}>← Back</button>
      </div>

      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr><th>ID</th><th>Date</th><th>Type</th><th>Description</th><th>Reversed</th><th>Action</th></tr>
        </thead>
        <tbody>
          {entries.map(entry => (
            <>
              <tr key={entry.entry_id}>
                <td>{entry.entry_id}</td>
                <td>{entry.entry_date}</td>
                <td>{entry.entry_type}</td>
                <td>{entry.description}</td>
                <td>{entry.reversed ? 'Yes' : 'No'}</td>
                <td>
                  <button onClick={() => toggleExpand(entry.entry_id)} style={{ padding: '4px 8px', marginRight: '6px' }}>
                    {expandedId === entry.entry_id ? 'Hide' : 'View'}
                  </button>
                  {!entry.reversed && (
                    <button onClick={() => handleReverse(entry.entry_id)} style={{ padding: '4px 8px' }}>
                      Reverse
                    </button>
                  )}
                </td>
              </tr>
              {expandedId === entry.entry_id && linesByEntry[entry.entry_id] && (
                <tr>
                  <td colSpan="6" style={{ background: '#f9f9f9' }}>
                    <table border="1" cellPadding="6" style={{ borderCollapse: 'collapse', width: '100%' }}>
                      <thead>
                        <tr><th>Account</th><th>Debit</th><th>Credit</th></tr>
                      </thead>
                      <tbody>
                        {linesByEntry[entry.entry_id].map(line => (
                          <tr key={line.line_id}>
                            <td>{getAccountLabel(line.account_id)}</td>
                            <td>{line.debit_amount}</td>
                            <td>{line.credit_amount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}