require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateCertificatePdf } = require('./certificate');

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

app.get('/', (req, res) => {
  res.send('FetchTMS backend is running!');
});

app.get('/test-db', async (req, res) => {
  const { data, error } = await supabase.from('courses').select('*').limit(5);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Database connection successful!', data });
});

app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();

  if (error || !user) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const token = jwt.sign(
    { userId: user.user_id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({
    token,
    role: user.role,
    forcePasswordReset: user.force_password_reset
  });
});

function authenticate(allowedRoles = []) {
  return (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (allowedRoles.length && !allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ error: 'Access denied for this role' });
      }
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
}

async function getStudentIdForUser(userId) {
  const { data, error } = await supabase
    .from('students')
    .select('student_id')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return data.student_id;
}

async function getTrainerIdForUser(userId) {
  const { data, error } = await supabase
    .from('resource_persons')
    .select('trainer_id')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return data.trainer_id;
}

async function isCoordinatorForCourse(userId, courseId) {
  const { data, error } = await supabase
    .from('course_coordinators')
    .select('*')
    .eq('coordinator_id', userId)
    .eq('course_id', courseId)
    .single();

  return !error && !!data;
}

// ===== ACCOUNTING MODULE =====

app.get('/accounts', authenticate(['admin']), async (req, res) => {
  const { data, error } = await supabase.from('chart_of_accounts').select('*').order('code');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.get('/payment-methods', authenticate(['admin']), async (req, res) => {
  const { data, error } = await supabase.from('payment_methods').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/payment-methods', authenticate(['admin']), async (req, res) => {
  const { name } = req.body;
  const { data, error } = await supabase.from('payment_methods').insert([{ name }]).select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ message: 'Payment method added', method: data[0] });
});

app.get('/vendors', authenticate(['admin']), async (req, res) => {
  const { data, error } = await supabase.from('vendors').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/vendors', authenticate(['admin']), async (req, res) => {
  const { name } = req.body;
  const { data, error } = await supabase.from('vendors').insert([{ name }]).select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ message: 'Vendor added', vendor: data[0] });
});

async function getAccountIdByCode(code) {
  const { data, error } = await supabase
    .from('chart_of_accounts')
    .select('account_id')
    .eq('code', code)
    .single();
  if (error || !data) return null;
  return data.account_id;
}

app.post('/journal/receipt', authenticate(['admin']), async (req, res) => {
  const { entry_date, student_id, amount, payment_method_id, description } = req.body;

  const cashAccountId = await getAccountIdByCode('1000');
  const arAccountId = await getAccountIdByCode('1100');

  if (!cashAccountId || !arAccountId) {
    return res.status(500).json({ error: 'Required chart of accounts entries not found (1000 Cash, 1100 AR-Students)' });
  }

  const { data: entry, error: entryError } = await supabase
    .from('journal_entries')
    .insert([{
      entry_date,
      description: description || 'Student payment receipt',
      entry_type: 'receipt',
      created_by: req.user.userId,
      reversed: false
    }])
    .select()
    .single();

  if (entryError) return res.status(500).json({ error: entryError.message });

  const { error: linesError } = await supabase
    .from('journal_lines')
    .insert([
      { entry_id: entry.entry_id, account_id: cashAccountId, debit_amount: amount, credit_amount: 0, student_id },
      { entry_id: entry.entry_id, account_id: arAccountId, debit_amount: 0, credit_amount: amount, student_id }
    ]);

  if (linesError) return res.status(500).json({ error: linesError.message });

  res.status(201).json({ message: 'Receipt recorded', entry });
});

app.post('/journal/payment', authenticate(['admin']), async (req, res) => {
  const { entry_date, category, vendor_id, resource_person_id, staff_user_id, amount, payment_method_id, description } = req.body;

  const categoryToCode = {
    'fixed_assets': '1500',
    'other_purchases': '5100',
    'resource_person_payment': '5000',
    'staff_payment': '5200',
    'other_expenses': '5300'
  };
  const debitCode = categoryToCode[category];
  if (!debitCode) return res.status(400).json({ error: 'Invalid category' });

  const debitAccountId = await getAccountIdByCode(debitCode);
  const cashAccountId = await getAccountIdByCode('1000');

  if (!debitAccountId || !cashAccountId) {
    return res.status(500).json({ error: 'Required chart of accounts entries not found' });
  }

  const { data: entry, error: entryError } = await supabase
    .from('journal_entries')
    .insert([{
      entry_date,
      description: description || `Payment - ${category}`,
      entry_type: 'payment',
      created_by: req.user.userId,
      reversed: false
    }])
    .select()
    .single();

  if (entryError) return res.status(500).json({ error: entryError.message });

  const lineExtras = {
    vendor_id: category === 'staff_payment' || category === 'resource_person_payment' ? null : (vendor_id || null),
    resource_person_id: category === 'resource_person_payment' ? (resource_person_id || null) : null,
    staff_user_id: category === 'staff_payment' ? (staff_user_id || null) : null
  };

  const { error: linesError } = await supabase
    .from('journal_lines')
    .insert([
      { entry_id: entry.entry_id, account_id: debitAccountId, debit_amount: amount, credit_amount: 0, ...lineExtras },
      { entry_id: entry.entry_id, account_id: cashAccountId, debit_amount: 0, credit_amount: amount, ...lineExtras }
    ]);

  if (linesError) return res.status(500).json({ error: linesError.message });

  res.status(201).json({ message: 'Payment recorded', entry });
});

app.post('/journal/general', authenticate(['admin']), async (req, res) => {
  const { entry_date, description, lines } = req.body;

  if (!lines || lines.length < 2) {
    return res.status(400).json({ error: 'At least two lines required for a journal entry' });
  }

  const totalDebit = lines.reduce((sum, l) => sum + Number(l.debit_amount || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + Number(l.credit_amount || 0), 0);

  if (totalDebit !== totalCredit) {
    return res.status(400).json({ error: `Entry does not balance: Debit ${totalDebit} vs Credit ${totalCredit}` });
  }

  const { data: entry, error: entryError } = await supabase
    .from('journal_entries')
    .insert([{
      entry_date,
      description,
      entry_type: 'general',
      created_by: req.user.userId,
      reversed: false
    }])
    .select()
    .single();

  if (entryError) return res.status(500).json({ error: entryError.message });

  const linesToInsert = lines.map(l => ({
    entry_id: entry.entry_id,
    account_id: l.account_id,
    debit_amount: l.debit_amount || 0,
    credit_amount: l.credit_amount || 0
  }));

  const { error: linesError } = await supabase.from('journal_lines').insert(linesToInsert);
  if (linesError) return res.status(500).json({ error: linesError.message });

  res.status(201).json({ message: 'General journal entry recorded', entry });
});

app.get('/journal/entries', authenticate(['admin']), async (req, res) => {
  const { data: entries, error } = await supabase
    .from('journal_entries')
    .select('*')
    .order('entry_date', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(entries);
});

app.get('/journal/entries/:id/lines', authenticate(['admin']), async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('journal_lines')
    .select('*')
    .eq('entry_id', id);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/journal/entries/:id/reverse', authenticate(['admin']), async (req, res) => {
  const { id } = req.params;

  const { data: originalEntry, error: fetchError } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('entry_id', id)
    .single();

  if (fetchError || !originalEntry) return res.status(404).json({ error: 'Journal entry not found' });
  if (originalEntry.reversed) return res.status(400).json({ error: 'This entry has already been reversed' });

  const { data: originalLines, error: linesFetchError } = await supabase
    .from('journal_lines')
    .select('*')
    .eq('entry_id', id);

  if (linesFetchError) return res.status(500).json({ error: linesFetchError.message });

  const { data: reversalEntry, error: reversalError } = await supabase
    .from('journal_entries')
    .insert([{
      entry_date: new Date().toISOString().split('T')[0],
      description: `Reversal of entry #${id}: ${originalEntry.description}`,
      entry_type: originalEntry.entry_type,
      created_by: req.user.userId,
      reversed: false
    }])
    .select()
    .single();

  if (reversalError) return res.status(500).json({ error: reversalError.message });

  const reversalLines = originalLines.map(l => ({
    entry_id: reversalEntry.entry_id,
    account_id: l.account_id,
    debit_amount: l.credit_amount,
    credit_amount: l.debit_amount,
    student_id: l.student_id,
    vendor_id: l.vendor_id,
    resource_person_id: l.resource_person_id
  }));

  const { error: reversalLinesError } = await supabase.from('journal_lines').insert(reversalLines);
  if (reversalLinesError) return res.status(500).json({ error: reversalLinesError.message });

  await supabase
    .from('journal_entries')
    .update({ reversed: true, reversed_by_entry_id: reversalEntry.entry_id })
    .eq('entry_id', id);

  res.json({ message: 'Entry reversed successfully', reversalEntry });
});

app.get('/reports/profit-loss', authenticate(['admin']), async (req, res) => {
  const { from_date, to_date } = req.query;

  const { data: accounts, error: accError } = await supabase
    .from('chart_of_accounts')
    .select('*')
    .in('type', ['Income', 'Expense']);

  if (accError) return res.status(500).json({ error: accError.message });

  const { data: lines, error: linesError } = await supabase
    .from('journal_lines')
    .select('*, journal_entries!inner(entry_date, reversed)');

  if (linesError) return res.status(500).json({ error: linesError.message });

  const filteredLines = lines.filter(l => {
    const d = l.journal_entries.entry_date;
    if (from_date && d < from_date) return false;
    if (to_date && d > to_date) return false;
    return true;
  });

  const results = accounts.map(acc => {
    const accLines = filteredLines.filter(l => l.account_id === acc.account_id);
    const totalDebit = accLines.reduce((sum, l) => sum + Number(l.debit_amount), 0);
    const totalCredit = accLines.reduce((sum, l) => sum + Number(l.credit_amount), 0);
    const balance = acc.type === 'Income' ? (totalCredit - totalDebit) : (totalDebit - totalCredit);
    return { account_id: acc.account_id, code: acc.code, name: acc.name, type: acc.type, balance };
  });

  const totalIncome = results.filter(r => r.type === 'Income').reduce((sum, r) => sum + r.balance, 0);
  const totalExpense = results.filter(r => r.type === 'Expense').reduce((sum, r) => sum + r.balance, 0);
  const netProfit = totalIncome - totalExpense;

  res.json({ accounts: results, totalIncome, totalExpense, netProfit });
});

app.get('/reports/balance-sheet', authenticate(['admin']), async (req, res) => {
  const { as_of_date } = req.query;

  const { data: accounts, error: accError } = await supabase
    .from('chart_of_accounts')
    .select('*')
    .in('type', ['Asset', 'Liability', 'Equity']);

  if (accError) return res.status(500).json({ error: accError.message });

  const { data: lines, error: linesError } = await supabase
    .from('journal_lines')
    .select('*, journal_entries!inner(entry_date, reversed)');

  if (linesError) return res.status(500).json({ error: linesError.message });

  const filteredLines = lines.filter(l => {
    if (as_of_date && l.journal_entries.entry_date > as_of_date) return false;
    return true;
  });

  const results = accounts.map(acc => {
    const accLines = filteredLines.filter(l => l.account_id === acc.account_id);
    const totalDebit = accLines.reduce((sum, l) => sum + Number(l.debit_amount), 0);
    const totalCredit = accLines.reduce((sum, l) => sum + Number(l.credit_amount), 0);
    const balance = (acc.type === 'Asset') ? (totalDebit - totalCredit) : (totalCredit - totalDebit);
    return { account_id: acc.account_id, code: acc.code, name: acc.name, type: acc.type, balance };
  });

  const totalAssets = results.filter(r => r.type === 'Asset').reduce((sum, r) => sum + r.balance, 0);
  const totalLiabilities = results.filter(r => r.type === 'Liability').reduce((sum, r) => sum + r.balance, 0);
  const totalEquity = results.filter(r => r.type === 'Equity').reduce((sum, r) => sum + r.balance, 0);

  res.json({ accounts: results, totalAssets, totalLiabilities, totalEquity });
});

app.get('/reports/outstanding/student/:studentId', authenticate(['admin', 'device']), async (req, res) => {
  const { studentId } = req.params;
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('student_id', studentId);

  if (error) return res.status(500).json({ error: error.message });

  const totalDebit = data.filter(p => p.type === 'debit').reduce((sum, p) => sum + Number(p.amount), 0);
  const totalCredit = data.filter(p => p.type === 'credit').reduce((sum, p) => sum + Number(p.amount), 0);

  res.json({
    payments: data,
    totalDebit,
    totalCredit,
    outstanding: totalDebit - totalCredit
  });
});

app.get('/reports/student-balance-summary', authenticate(['admin', 'device']), async (req, res) => {
  const { data: students, error: studentsError } = await supabase.from('students').select('*');
  if (studentsError) return res.status(500).json({ error: studentsError.message });

  const { data: payments, error: paymentsError } = await supabase.from('payments').select('*');
  if (paymentsError) return res.status(500).json({ error: paymentsError.message });

  const summary = students.map(s => {
    const studentPayments = payments.filter(p => p.student_id === s.student_id);
    const debit = studentPayments.filter(p => p.type === 'debit').reduce((sum, p) => sum + Number(p.amount), 0);
    const credit = studentPayments.filter(p => p.type === 'credit').reduce((sum, p) => sum + Number(p.amount), 0);
    return {
      student_id: s.student_id,
      full_name: s.full_name,
      debit,
      credit,
      balance: debit - credit
    };
  });

  res.json(summary);
});

app.get('/reports/resource-person-summary', authenticate(['admin']), async (req, res) => {
  const { data: resourcePersons, error: rpError } = await supabase.from('resource_persons').select('*');
  if (rpError) return res.status(500).json({ error: rpError.message });

  const { data: lines, error: linesError } = await supabase
    .from('journal_lines')
    .select('*')
    .not('resource_person_id', 'is', null);

  if (linesError) return res.status(500).json({ error: linesError.message });

  const summary = resourcePersons.map(rp => {
    const rpLines = lines.filter(l => l.resource_person_id === rp.trainer_id);
    const debit = rpLines.reduce((sum, l) => sum + Number(l.debit_amount), 0);
    const credit = rpLines.reduce((sum, l) => sum + Number(l.credit_amount), 0);
    return {
      trainer_id: rp.trainer_id,
      name: rp.name,
      debit,
      credit,
      balance: debit - credit
    };
  });

  res.json(summary);
});

// ===== END ACCOUNTING MODULE =====

app.get('/users', authenticate(['admin']), async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('user_id, username, role, is_active');

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.patch('/users/change-password', authenticate([]), async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', req.user.userId)
    .single();

  if (error || !user) return res.status(404).json({ error: 'User not found' });

  const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
  if (!validPassword) return res.status(401).json({ error: 'Current password is incorrect' });

  const newHash = await bcrypt.hash(newPassword, 10);

  const { error: updateError } = await supabase
    .from('users')
    .update({ password_hash: newHash, force_password_reset: false })
    .eq('user_id', req.user.userId);

  if (updateError) return res.status(500).json({ error: updateError.message });

  res.json({ message: 'Password changed successfully' });
});

app.post('/users', authenticate(['admin']), async (req, res) => {
  const { username, password, role, student_id } = req.body;

  const password_hash = await bcrypt.hash(password, 10);

  const { data: newUser, error } = await supabase
    .from('users')
    .insert([{
      username,
      password_hash,
      role,
      force_password_reset: true,
      is_active: true
    }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  if (role === 'student' && student_id) {
    const { error: linkError } = await supabase
      .from('students')
      .update({ user_id: newUser.user_id })
      .eq('student_id', student_id);

    if (linkError) return res.status(500).json({ error: `User created but linking failed: ${linkError.message}` });
  }

  res.status(201).json({ message: 'User account created', user: { user_id: newUser.user_id, username: newUser.username, role: newUser.role } });
});

app.post('/resource-persons', authenticate(['admin']), async (req, res) => {
  const { name, title, organization, qualifications, user_id, available_dates, subjects, fee_per_hour } = req.body;

  const { data, error } = await supabase
    .from('resource_persons')
    .insert([{ name, title, organization, qualifications, user_id: user_id || null, available_dates, subjects, fee_per_hour }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ message: 'Resource person created', resourcePerson: data[0] });
});

app.get('/resource-persons', authenticate(['admin']), async (req, res) => {
  const { data, error } = await supabase.from('resource_persons').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Bulk import students from Excel (admin only)
app.post('/students/bulk-import', authenticate(['admin']), async (req, res) => {
  const { students } = req.body;

  if (!Array.isArray(students) || students.length === 0) {
    return res.status(400).json({ error: 'No student data provided' });
  }

  const rowsToInsert = students.map(s => ({
    full_name: s.full_name,
    nic_passport: s.nic_passport || null,
    dob: s.dob || null,
    gender: s.gender || null,
    address: s.address || null,
    contact_number: s.contact_number || null,
    email: s.email,
    organization: s.organization || null,
    job_title: s.job_title || null,
    qualification: s.qualification || null,
    emergency_contact: s.emergency_contact || null,
    registration_status: 'pending'
  }));

  const { data, error } = await supabase
    .from('students')
    .insert(rowsToInsert)
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ message: `${data.length} students imported successfully`, students: data });
});

app.post('/students', authenticate(['admin', 'device']), async (req, res) => {
  const {
    full_name, nic_passport, dob, gender, address,
    contact_number, email, organization, job_title,
    qualification, emergency_contact
  } = req.body;

  const { data, error } = await supabase
    .from('students')
    .insert([{
      full_name, nic_passport, dob, gender, address,
      contact_number, email, organization, job_title,
      qualification, emergency_contact,
      registration_status: 'pending'
    }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ message: 'Student registered successfully', student: data[0] });
});

app.get('/students', authenticate(['admin', 'device']), async (req, res) => {
  const { data, error } = await supabase.from('students').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/courses', authenticate(['admin', 'device']), async (req, res) => {
  const {
    code, name, category, description, duration, sessions_count,
    training_mode, venue, start_date, end_date, max_participants,
    fee, certificate_type, level
  } = req.body;

  const { data, error } = await supabase
    .from('courses')
    .insert([{
      code, name, category, description, duration, sessions_count,
      training_mode, venue, start_date, end_date, max_participants,
      fee, certificate_type, level,
      status: 'draft'
    }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ message: 'Course created successfully', course: data[0] });
});

app.get('/courses', authenticate([]), async (req, res) => {
  const { data, error } = await supabase.from('courses').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.patch('/courses/:id/publish', authenticate(['admin', 'device']), async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('courses')
    .update({ status: 'published' })
    .eq('course_id', id)
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Course published', course: data[0] });
});

app.put('/courses/:id', authenticate(['admin', 'device']), async (req, res) => {
  const { id } = req.params;
  const {
    code, name, category, description, duration, sessions_count,
    training_mode, venue, start_date, end_date, max_participants,
    fee, certificate_type, level
  } = req.body;

  const { data, error } = await supabase
    .from('courses')
    .update({
      code, name, category, description, duration, sessions_count,
      training_mode, venue, start_date, end_date, max_participants,
      fee, certificate_type, level
    })
    .eq('course_id', id)
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Course updated', course: data[0] });
});

// Full detail view of a course: assigned resource person(s), coordinator, modules, registered students
app.get('/courses/:id/details', authenticate(['admin', 'device']), async (req, res) => {
  const { id } = req.params;

  const { data: course, error: courseError } = await supabase
    .from('courses').select('*').eq('course_id', id).single();
  if (courseError || !course) return res.status(404).json({ error: 'Course not found' });

  const { data: rpLinks } = await supabase
    .from('course_resource_persons').select('*').eq('course_id', id);
  const { data: allResourcePersons } = await supabase.from('resource_persons').select('*');
  const resourcePersons = (rpLinks || []).map(link => ({
    ...link,
    resource_person: (allResourcePersons || []).find(rp => rp.trainer_id === link.trainer_id) || null
  }));

  const { data: coordLinks } = await supabase
    .from('course_coordinators').select('*').eq('course_id', id);
  const { data: allUsers } = await supabase.from('users').select('user_id, username, role');
  const coordinators = (coordLinks || []).map(link => ({
    ...link,
    coordinator: (allUsers || []).find(u => u.user_id === link.coordinator_id) || null
  }));

  const { data: modules } = await supabase.from('modules').select('*').eq('course_id', id);

  const { data: registrations } = await supabase.from('registrations').select('*').eq('course_id', id);
  const { data: allStudents } = await supabase.from('students').select('*');
  const { data: allPayments } = await supabase.from('payments').select('*').eq('course_id', id);

  const students = (registrations || []).map(r => {
    const student = (allStudents || []).find(s => s.student_id === r.student_id) || null;
    const studentPayments = (allPayments || []).filter(p => p.student_id === r.student_id);
    const debit = studentPayments.filter(p => p.type === 'debit').reduce((sum, p) => sum + Number(p.amount), 0);
    const credit = studentPayments.filter(p => p.type === 'credit').reduce((sum, p) => sum + Number(p.amount), 0);
    return {
      registration: r,
      student,
      fee: Number(course.fee) || 0,
      paid: credit,
      balance: Math.max(debit - credit, 0)
    };
  });

  res.json({ course, resourcePersons, coordinators, modules: modules || [], students });
});

// Replace the resource person assigned to a course
app.put('/courses/:id/assign-resource-person', authenticate(['admin', 'device']), async (req, res) => {
  const { id } = req.params;
  const { trainer_id } = req.body;

  await supabase.from('course_resource_persons').delete().eq('course_id', id);

  const { data, error } = await supabase
    .from('course_resource_persons')
    .insert([{ course_id: id, trainer_id }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Resource person updated', assignment: data[0] });
});

// Replace the coordinator assigned to a course
app.put('/courses/:id/assign-coordinator', authenticate(['admin', 'device']), async (req, res) => {
  const { id } = req.params;
  const { coordinator_id } = req.body;

  await supabase.from('course_coordinators').delete().eq('course_id', id);

  const { data, error } = await supabase
    .from('course_coordinators')
    .insert([{ course_id: id, coordinator_id }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Coordinator updated', assignment: data[0] });
});

// Fee/balance for a specific student in a specific course
app.get('/courses/:courseId/balance/:studentId', authenticate(['admin', 'device', 'student']), async (req, res) => {
  const { courseId, studentId } = req.params;

  if (req.user.role === 'student') {
    const ownStudentId = await getStudentIdForUser(req.user.userId);
    if (String(ownStudentId) !== String(studentId)) {
      return res.status(403).json({ error: 'Not your record' });
    }
  }

  const { data: course, error: courseError } = await supabase
    .from('courses').select('fee').eq('course_id', courseId).single();
  if (courseError || !course) return res.status(404).json({ error: 'Course not found' });

  const { data: payments, error: payError } = await supabase
    .from('payments').select('*').eq('course_id', courseId).eq('student_id', studentId);
  if (payError) return res.status(500).json({ error: payError.message });

  const debit = payments.filter(p => p.type === 'debit').reduce((sum, p) => sum + Number(p.amount), 0);
  const credit = payments.filter(p => p.type === 'credit').reduce((sum, p) => sum + Number(p.amount), 0);
  const fee = Number(course.fee) || 0;
  const balance = Math.max(debit - credit, 0);

  res.json({ fee, debit, paid: credit, balance });
});

app.post('/modules', authenticate(['admin']), async (req, res) => {
  const { course_id, module_name, credits } = req.body;

  const { data, error } = await supabase
    .from('modules')
    .insert([{ course_id, module_name, credits }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ message: 'Module created', module: data[0] });
});

app.get('/modules/:courseId', authenticate([]), async (req, res) => {
  const { courseId } = req.params;
  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .eq('course_id', courseId);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/course-coordinators', authenticate(['admin']), async (req, res) => {
  const { course_id, coordinator_id } = req.body;

  const { data, error } = await supabase
    .from('course_coordinators')
    .insert([{ course_id, coordinator_id }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ message: 'Coordinator assigned', assignment: data[0] });
});

app.get('/course-coordinators/my', authenticate(['coordinator']), async (req, res) => {
  const { data, error } = await supabase
    .from('course_coordinators')
    .select('*')
    .eq('coordinator_id', req.user.userId);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/course-sessions', authenticate(['admin', 'device', 'resource_person']), async (req, res) => {
  const { course_id, session_date, start_time, end_time, venue } = req.body;

  const { data, error } = await supabase
    .from('course_sessions')
    .insert([{ course_id, session_date, start_time, end_time, venue }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ message: 'Session created', session: data[0] });
});

app.get('/course-sessions/:courseId', authenticate([]), async (req, res) => {
  const { courseId } = req.params;
  const { data, error } = await supabase
    .from('course_sessions')
    .select('*')
    .eq('course_id', courseId);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/course-resource-persons', authenticate(['admin', 'device']), async (req, res) => {
  const { course_id, trainer_id } = req.body;

  const { data, error } = await supabase
    .from('course_resource_persons')
    .insert([{ course_id, trainer_id }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ message: 'Resource person assigned', assignment: data[0] });
});

app.get('/course-resource-persons/:courseId', authenticate([]), async (req, res) => {
  const { courseId } = req.params;
  const { data, error } = await supabase
    .from('course_resource_persons')
    .select('*')
    .eq('course_id', courseId);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.get('/registrations/my', authenticate(['student']), async (req, res) => {
  const studentId = await getStudentIdForUser(req.user.userId);
  if (!studentId) return res.status(404).json({ error: 'No student record linked to this account' });

  const { data: registrations, error } = await supabase
    .from('registrations')
    .select('*')
    .eq('student_id', studentId);

  if (error) return res.status(500).json({ error: error.message });

  const { data: payments } = await supabase
    .from('payments').select('*').eq('student_id', studentId);

  const result = await Promise.all(registrations.map(async (r) => {
    const { data: course } = await supabase
      .from('courses').select('name, code, fee').eq('course_id', r.course_id).single();

    const coursePayments = (payments || []).filter(p => p.course_id === r.course_id);
    const debit = coursePayments.filter(p => p.type === 'debit').reduce((sum, p) => sum + Number(p.amount), 0);
    const credit = coursePayments.filter(p => p.type === 'credit').reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      ...r,
      course_name: course?.name || null,
      course_code: course?.code || null,
      fee: Number(course?.fee) || 0,
      paid: credit,
      balance: Math.max(debit - credit, 0)
    };
  }));

  res.json(result);
});

app.get('/registrations/student/:studentId', authenticate(['admin', 'device']), async (req, res) => {
  const { studentId } = req.params;
  const { data, error } = await supabase
    .from('registrations')
    .select('*')
    .eq('student_id', studentId);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.get('/assessments/student/:studentId', authenticate(['admin', 'device']), async (req, res) => {
  const { studentId } = req.params;
  const { data, error } = await supabase
    .from('assessments')
    .select('*')
    .eq('student_id', studentId);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.get('/certificates/student/:studentId', authenticate(['admin', 'device']), async (req, res) => {
  const { studentId } = req.params;
  const { data, error } = await supabase
    .from('certificates')
    .select('*')
    .eq('student_id', studentId);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/registrations', authenticate(['admin', 'device']), async (req, res) => {
  const { student_id, course_id } = req.body;

  const { data: existing } = await supabase
    .from('registrations')
    .select('registration_id')
    .eq('student_id', student_id)
    .eq('course_id', course_id);
  if (existing && existing.length > 0) {
    return res.status(400).json({ error: 'Student is already registered for this course' });
  }

  const { data, error } = await supabase
    .from('registrations')
    .insert([{ student_id, course_id, status: 'registered' }])
    .select();

  if (error) return res.status(500).json({ error: error.message });

  await supabase
    .from('students')
    .update({ registration_status: 'active' })
    .eq('student_id', student_id);

  // Automatically record the course fee as an amount owed, so balance can be tracked from here on
  const { data: course } = await supabase.from('courses').select('fee').eq('course_id', course_id).single();
  const fee = Number(course?.fee) || 0;
  if (fee > 0) {
    await supabase
      .from('payments')
      .insert([{ student_id, course_id, amount: fee, type: 'debit', status: 'completed' }]);
  }

  res.status(201).json({ message: 'Student registered for course', registration: data[0], fee });
});

app.get('/registrations/:courseId', authenticate(['admin', 'device', 'coordinator']), async (req, res) => {
  const { courseId } = req.params;

  if (req.user.role === 'coordinator') {
    const allowed = await isCoordinatorForCourse(req.user.userId, courseId);
    if (!allowed) return res.status(403).json({ error: 'You are not assigned as coordinator for this course' });
  }

  const { data: registrations, error } = await supabase
    .from('registrations')
    .select('*')
    .eq('course_id', courseId);

  if (error) return res.status(500).json({ error: error.message });

  const { data: students } = await supabase.from('students').select('student_id, full_name, email');
  const result = registrations.map(r => ({
    ...r,
    student: (students || []).find(s => s.student_id === r.student_id) || null
  }));

  res.json(result);
});

app.post('/attendance', authenticate(['resource_person', 'admin', 'device', 'coordinator']), async (req, res) => {
  const { session_id, student_id, status } = req.body;

  const { data, error } = await supabase
    .from('attendance')
    .insert([{ session_id, student_id, status }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ message: 'Attendance marked', attendance: data[0] });
});

app.get('/attendance/my', authenticate(['student']), async (req, res) => {
  const studentId = await getStudentIdForUser(req.user.userId);
  if (!studentId) return res.status(404).json({ error: 'No student record linked to this account' });

  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('student_id', studentId);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

function computeGrade(marks) {
  const m = Number(marks);
  if (m < 50) return 'Fail';
  if (m <= 60) return 'Pass';
  if (m <= 69) return 'Excellent';
  return 'Merit';
}

app.post('/assessments', authenticate(['resource_person', 'admin']), async (req, res) => {
  const { student_id, course_id, module_id, marks, eval_type } = req.body;

  if (!['assignment', 'exam'].includes(eval_type)) {
    return res.status(400).json({ error: 'eval_type must be "assignment" or "exam"' });
  }

  let markedBy = req.user.userId;
  if (req.user.role === 'resource_person') {
    const trainerId = await getTrainerIdForUser(req.user.userId);
    if (!trainerId) return res.status(404).json({ error: 'No resource person record linked to this account' });
    markedBy = trainerId;
  }

  const grade = computeGrade(marks);

  const { data, error } = await supabase
    .from('assessments')
    .insert([{
      student_id, course_id, module_id, marks, grade, eval_type,
      published: false,
      reviewed: false,
      marked_by: markedBy
    }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ message: 'Marks recorded (pending review)', assessment: data[0] });
});

app.get('/assessments/pending-review/:courseId', authenticate(['coordinator']), async (req, res) => {
  const { courseId } = req.params;

  const allowed = await isCoordinatorForCourse(req.user.userId, courseId);
  if (!allowed) return res.status(403).json({ error: 'You are not assigned as coordinator for this course' });

  const { data, error } = await supabase
    .from('assessments')
    .select('*')
    .eq('course_id', courseId)
    .eq('reviewed', false);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.patch('/assessments/:id/review', authenticate(['coordinator']), async (req, res) => {
  const { id } = req.params;

  const { data: assessment, error: fetchError } = await supabase
    .from('assessments')
    .select('*')
    .eq('assessment_id', id)
    .single();

  if (fetchError || !assessment) return res.status(404).json({ error: 'Assessment not found' });

  const allowed = await isCoordinatorForCourse(req.user.userId, assessment.course_id);
  if (!allowed) return res.status(403).json({ error: 'You are not assigned as coordinator for this course' });

  const { data, error } = await supabase
    .from('assessments')
    .update({ reviewed: true, reviewed_by: req.user.userId, published: true })
    .eq('assessment_id', id)
    .select();

  if (error) return res.status(500).json({ error: error.message });

  const { data: allModules } = await supabase
    .from('modules')
    .select('module_id')
    .eq('course_id', assessment.course_id);

  const { data: allAssessments } = await supabase
    .from('assessments')
    .select('*')
    .eq('student_id', assessment.student_id)
    .eq('course_id', assessment.course_id)
    .eq('reviewed', true);

  const moduleIdsWithPassingMarks = allAssessments
    .filter(a => Number(a.marks) >= 50)
    .map(a => a.module_id);

  const allModulesCovered = allModules.every(m => moduleIdsWithPassingMarks.includes(m.module_id));

  if (allModules.length > 0 && allModulesCovered) {
    await supabase
      .from('students')
      .update({ registration_status: 'eligible_for_certificate' })
      .eq('student_id', assessment.student_id);
  }

  res.json({ message: 'Marks reviewed and published', assessment: data[0] });
});

app.patch('/assessments/:id/publish', authenticate(['admin']), async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('assessments')
    .update({ published: true, reviewed: true })
    .eq('assessment_id', id)
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Marks published', assessment: data[0] });
});

app.get('/assessments/my', authenticate(['student']), async (req, res) => {
  const studentId = await getStudentIdForUser(req.user.userId);
  if (!studentId) return res.status(404).json({ error: 'No student record linked to this account' });

  const { data, error } = await supabase
    .from('assessments')
    .select('*')
    .eq('student_id', studentId)
    .eq('published', true);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/payments', authenticate(['admin', 'device']), async (req, res) => {
  const { student_id, course_id, amount, type, status } = req.body;

  const numAmount = Number(amount);
  if (!numAmount || numAmount <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number' });
  }

  if (type === 'credit') {
    const { data: existingPayments, error: payError } = await supabase
      .from('payments').select('*').eq('student_id', student_id).eq('course_id', course_id);
    if (payError) return res.status(500).json({ error: payError.message });

    const debit = existingPayments.filter(p => p.type === 'debit').reduce((sum, p) => sum + Number(p.amount), 0);
    const credit = existingPayments.filter(p => p.type === 'credit').reduce((sum, p) => sum + Number(p.amount), 0);
    const remainingBalance = debit - credit;

    if (numAmount > remainingBalance) {
      return res.status(400).json({ error: `Payment exceeds outstanding balance of ${remainingBalance}` });
    }
  }

  const { data, error } = await supabase
    .from('payments')
    .insert([{ student_id, course_id, amount: numAmount, type, status }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ message: 'Payment recorded', payment: data[0] });
});

app.get('/payments/my', authenticate(['student']), async (req, res) => {
  const studentId = await getStudentIdForUser(req.user.userId);
  if (!studentId) return res.status(404).json({ error: 'No student record linked to this account' });

  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('student_id', studentId);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.get('/payments/student/:studentId', authenticate(['admin', 'device']), async (req, res) => {
  const { studentId } = req.params;
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('student_id', studentId);

  if (error) return res.status(500).json({ error: error.message });

  const totalDebit = data.filter(p => p.type === 'debit').reduce((sum, p) => sum + Number(p.amount), 0);
  const totalCredit = data.filter(p => p.type === 'credit').reduce((sum, p) => sum + Number(p.amount), 0);

  res.json({
    payments: data,
    totalDebit,
    totalCredit,
    outstanding: totalDebit - totalCredit
  });
});

app.get('/reports/outstanding', authenticate(['admin', 'device']), async (req, res) => {
  const { data, error } = await supabase.from('payments').select('*');
  if (error) return res.status(500).json({ error: error.message });

  const totalDebit = data.filter(p => p.type === 'debit').reduce((sum, p) => sum + Number(p.amount), 0);
  const totalCredit = data.filter(p => p.type === 'credit').reduce((sum, p) => sum + Number(p.amount), 0);

  res.json({
    totalDebit,
    totalCredit,
    outstanding: totalDebit - totalCredit
  });
});

app.post('/certificates', authenticate(['admin']), async (req, res) => {
  const { student_id, course_id } = req.body;

  const { data: modules } = await supabase
    .from('modules')
    .select('module_id')
    .eq('course_id', course_id);

  const { data: assessments, error: assessError } = await supabase
    .from('assessments')
    .select('*')
    .eq('student_id', student_id)
    .eq('course_id', course_id)
    .eq('published', true)
    .eq('reviewed', true);

  if (assessError) return res.status(500).json({ error: assessError.message });

  if (modules && modules.length > 0) {
    const passingModuleIds = assessments.filter(a => Number(a.marks) >= 50).map(a => a.module_id);
    const allCovered = modules.every(m => passingModuleIds.includes(m.module_id));
    if (!allCovered) {
      return res.status(400).json({ error: 'Student has not passed all modules with reviewed, published marks' });
    }
  } else {
    if (!assessments || assessments.length === 0) {
      return res.status(400).json({ error: 'No published passing assessment found for this student/course' });
    }
  }

  const { data: payments, error: payError } = await supabase
    .from('payments')
    .select('*')
    .eq('student_id', student_id)
    .eq('course_id', course_id);

  if (payError) return res.status(500).json({ error: payError.message });

  const totalDebit = payments.filter(p => p.type === 'debit').reduce((sum, p) => sum + Number(p.amount), 0);
  const totalCredit = payments.filter(p => p.type === 'credit').reduce((sum, p) => sum + Number(p.amount), 0);

  if (totalDebit - totalCredit > 0) {
    return res.status(400).json({ error: 'Student has outstanding balance; certificate cannot be issued yet' });
  }

  const today = new Date();
  const datePart = today.toISOString().split('T')[0].replace(/-/g, '');
  const { data: todaysCerts } = await supabase
    .from('certificates')
    .select('verification_code')
    .like('verification_code', `FCPL${datePart}%`);
  const seq = String((todaysCerts ? todaysCerts.length : 0) + 1).padStart(2, '0');
  const verificationCode = `FCPL${datePart}${seq}`;

  const { data, error } = await supabase
    .from('certificates')
    .insert([{
      student_id, course_id,
      issue_date: today.toISOString().split('T')[0],
      verification_code: verificationCode
    }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ message: 'Certificate issued', certificate: data[0] });
});

// Public: download the certificate as a formatted PDF, by verification code
app.get('/certificates/:code/pdf', async (req, res) => {
  const { code } = req.params;

  const { data: cert, error } = await supabase
    .from('certificates').select('*').eq('verification_code', code).single();
  if (error || !cert) return res.status(404).json({ error: 'Certificate not found' });

  const { data: student } = await supabase
    .from('students').select('full_name').eq('student_id', cert.student_id).single();
  const { data: course } = await supabase
    .from('courses').select('*').eq('course_id', cert.course_id).single();
  const { data: rpLinks } = await supabase
    .from('course_resource_persons').select('trainer_id').eq('course_id', cert.course_id);
  let resourcePerson = null;
  if (rpLinks && rpLinks.length > 0) {
    const { data: rp } = await supabase
      .from('resource_persons').select('*').eq('trainer_id', rpLinks[0].trainer_id).single();
    resourcePerson = rp;
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${code}.pdf"`);

  generateCertificatePdf({
    certificateNo: cert.verification_code,
    studentName: student?.full_name || 'Participant',
    programTitle: course?.name || 'Training Program',
    durationLabel: course?.duration ? `${course.duration} Training Program on` : 'Training Program on',
    eventDate: course?.start_date
      ? new Date(course.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      : new Date(cert.issue_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
    venue: course?.venue || '—',
    resourcePersonName: resourcePerson?.name,
    resourcePersonQualifications: resourcePerson?.qualifications
  }, res);
});
// Public: find a student's certificate by exact student_id or exact full_name match
app.get('/certificates/find-by-student', async (req, res) => {
  const { student_id, full_name } = req.query;

  if (!student_id && !full_name) {
    return res.status(400).json({ error: 'Provide student_id or full_name' });
  }

  let studentQuery = supabase.from('students').select('student_id, full_name');
  if (student_id) studentQuery = studentQuery.eq('student_id', student_id);
  if (full_name) studentQuery = studentQuery.ilike('full_name', full_name);

  const { data: students, error: studentError } = await studentQuery;
  if (studentError) return res.status(500).json({ error: studentError.message });
  if (!students || students.length === 0) {
    return res.status(404).json({ error: 'No matching student found' });
  }

  const studentIds = students.map(s => s.student_id);
  const { data: certificates, error: certError } = await supabase
    .from('certificates')
    .select('*')
    .in('student_id', studentIds);

  if (certError) return res.status(500).json({ error: certError.message });

  const results = certificates.map(cert => {
    const student = students.find(s => s.student_id === cert.student_id);
    return { ...cert, student_name: student ? student.full_name : null };
  });

  res.json({ certificates: results });
});
app.get('/certificates/verify/:code', async (req, res) => {
  const { code } = req.params;
  const { data, error } = await supabase
    .from('certificates')
    .select('*')
    .eq('verification_code', code)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Certificate not found' });
  res.json({ valid: true, certificate: data });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

