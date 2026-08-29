import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function ImportStudentsPage() {
  const [previewData, setPreviewData] = useState([]);
  const [existingStudents, setExistingStudents] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    axios.get('https://fetchtms.onrender.com/students', { headers: getHeaders() })
      .then(res => setExistingStudents(res.data))
      .catch(() => {});
  }, []);

  const downloadTemplate = () => {
    const templateData = [
      {
        full_name: 'John Doe',
        nic_passport: '123456789V',
        dob: '1990-01-15',
        gender: 'male',
        address: '123 Main St',
        contact_number: '0771234567',
        email: 'john@example.com',
        organization: 'ABC Ltd',
        job_title: 'Manager',
        qualification: 'BSc',
        emergency_contact: '0777654321'
      }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    XLSX.writeFile(wb, 'student_import_template.xlsx');
  };

  const downloadExistingStudents = () => {
    const exportData = existingStudents.map(s => ({
      full_name: s.full_name,
      nic_passport: s.nic_passport,
      dob: s.dob,
      gender: s.gender,
      address: s.address,
      contact_number: s.contact_number,
      email: s.email,
      organization: s.organization,
      job_title: s.job_title,
      qualification: s.qualification,
      emergency_contact: s.emergency_contact
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    XLSX.writeFile(wb, 'existing_students_export.xlsx');
  };

  const handleFileUpload = (e) => {
    setError(''); setMessage('');
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'binary' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet);
        setPreviewData(json);
      } catch (err) {
        setError('Failed to read Excel file. Make sure it matches the template format.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    setError(''); setMessage('');
    if (previewData.length === 0) {
      setError('No data to import. Please upload a file first.');
      return;
    }
    try {
      const res = await axios.post('https://fetchtms.onrender.com/students/bulk-import', {
        students: previewData
      }, { headers: getHeaders() });
      setMessage(res.data.message);
      setPreviewData([]);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to import students');
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Import Students from Excel</h2>
        <button onClick={() => navigate('/admin/students')} style={{ padding: '8px 16px' }}>← Back</button>
      </div>

      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div className="btn-row" style={{ marginBottom: '20px', alignItems: 'center' }}>
        <button onClick={downloadTemplate}>
          Download Template
        </button>
        <button onClick={downloadExistingStudents}>
          Export Existing Students
        </button>
        <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} />
      </div>

      <h3>Already Registered Students ({existingStudents.length})</h3>
      <table border="1" cellPadding="6" style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '30px', fontSize: '13px' }}>
        <thead>
          <tr><th>ID</th><th>Name</th><th>Email</th><th>Status</th></tr>
        </thead>
        <tbody>
          {existingStudents.map(s => (
            <tr key={s.student_id}>
              <td>{s.student_id}</td><td>{s.full_name}</td><td>{s.email}</td><td>{s.registration_status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {previewData.length > 0 && (
        <>
          <h3>Preview ({previewData.length} rows)</h3>
          <table border="1" cellPadding="6" style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '20px', fontSize: '13px' }}>
            <thead>
              <tr>
                {Object.keys(previewData[0]).map(key => <th key={key}>{key}</th>)}
              </tr>
            </thead>
            <tbody>
              {previewData.map((row, i) => (
                <tr key={i}>
                  {Object.values(row).map((val, j) => <td key={j}>{val}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={handleImport} style={{ padding: '8px 16px' }}>Confirm Import</button>
        </>
      )}
    </div>
  );
}