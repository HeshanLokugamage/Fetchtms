require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

// Middleware: verify JWT and check role
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

// Helper: get student_id linked to a logged-in user
async function getStudentIdForUser(userId) {
  const { data, error } = await supabase
    .from('students')
    .select('student_id')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return data.student_id;
}

// Helper: get trainer_id linked to a logged-in user
async function getTrainerIdForUser(userId) {
  const { data, error } = await supabase
    .from('resource_persons')
    .select('trainer_id')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return data.trainer_id;
}

// Helper: check if a coordinator is assigned to a course
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

// Get chart of accounts (admin only)
app.get('/accounts', authenticate(['admin']), async (req, res) => {
  const { data, error } = await supabase.from('chart_of_accounts').select('*').order('code');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Get payment methods (admin only)
app.get('/payment-methods', authenticate(['admin']), async (req, res) => {
  const { data, error } = await supabase.from('payment_methods').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Add a new payment method (admin only)
app.post('/payment-methods', authenticate(['admin']), async (req, res) => {
  const { name } = req.body;
  const { data, error } = await supabase.from('payment_methods').insert([{ name }]).select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ message: 'Payment method added', method: data[0] });
});

// Get vendors (admin only)
app.get('/vendors', authenticate(['admin']), async (req, res) => {
  const { data, error } = await supabase.from('vendors').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Add a new vendor (admin only)
app.post('/vendors', authenticate(['admin']), async (req, res) => {
  const { name } = req.body;
  const { data, error } = await supabase.from('vendors').insert([{ name }]).select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ message: 'Vendor added', vendor: data[0] });
});

// Helper: get account_id by code
async function getAccountIdByCode(code) {
  const { data, error } = await supabase
    .from('chart_of_accounts')
    .select('account_id')
    .eq('code', code)
    .single();
  if (error || !data) return null;
  return data.account_id;
}

// Create a Receipt Journal entry (student payment received) — admin only
// Debit: Cash/Bank (based on payment method), Credit: Accounts Receivable — Students
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

// Create a Payment Journal entry (company payment made) — admin only
// Debit: expense/asset account (based on category), Credit: Cash/Bank
app.post('/journal/payment', authenticate(['admin']), async (req, res) => {
  const { entry_date, category, vendor_id, amount, payment_method_id, description } = req.body;

  // Map category to account code
  const categoryToCode = {
    'fixed_assets': '1500',
    'other_purchases': '5100',
    'resource_person_payment': '5000'
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

  const { error: linesError } = await supabase
    .from('journal_lines')
    .insert([
      { entry_id: entry.entry_id, account_id: debitAccountId, debit_amount: amount, credit_amount: 0, vendor_id },
      { entry_id: entry.entry_id, account_id: cashAccountId, debit_amount: 0, credit_amount: amount, vendor_id }
    ]);

  if (linesError) return res.status(500).json({ error: linesError.message });

  res.status(201).json({ message: 'Payment recorded', entry });
});

// Create a General Journal entry (manual, any two accounts) — admin only
app.post('/journal/general', authenticate(['admin']), async (req, res) => {
  const { entry_date, description, lines } = req.body;
  // lines: [{ account_id, debit_amount, credit_amount }, ...]

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

// Get all journal entries with their lines (admin only)
app.get('/journal/entries', authenticate(['admin']), async (req, res) => {
  const { data: entries, error } = await supabase
    .from('journal_entries')
    .select('*')
    .order('entry_date', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(entries);
});

// Get lines for a specific journal entry (admin only)
app.get('/journal/entries/:id/lines', authenticate(['admin']), async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('journal_lines')
    .select('*')
    .eq('entry_id', id);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Reverse a journal entry (admin only) — creates a new entry with swapped debit/credit
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
    vendor_id: l.vendor_id
  }));

  const { error: reversalLinesError } = await supabase.from('journal_lines').insert(reversalLines);
  if (reversalLinesError) return res.status(500).json({ error: reversalLinesError.message });

  await supabase
    .from('journal_entries')
    .update({ reversed: true, reversed_by_entry_id: reversalEntry.entry_id })
    .eq('entry_id', id);

  res.json({ message: 'Entry reversed successfully', reversalEntry });
});

// ===== END ACCOUNTING MODULE =====

// Get all users (admin only) — for populating name-based dropdowns; excludes password_hash
app.get('/users', authenticate(['admin']), async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('user_id, username, role, is_active');

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Change own password (any logged-in user)
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

// Create a user login account (admin only) — hashes password and optionally links to a student
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

// Create a resource person record (admin only) — optionally links to a user login
app.post('/resource-persons', authenticate(['admin']), async (req, res) => {
  const { name, title, organization, qualifications, user_id, available_dates, subjects, fee_per_hour } = req.body;

  const { data, error } = await supabase
    .from('resource_persons')
    .insert([{ name, title, organization, qualifications, user_id: user_id || null, available_dates, subjects, fee_per_hour }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ message: 'Resource person created', resourcePerson: data[0] });
});

// Get all resource persons (admin only)
app.get('/resource-persons', authenticate(['admin']), async (req, res) => {
  const { data, error } = await supabase.from('resource_persons').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Create a new student (admin or device user only)
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

// Get all students (admin or device user only)
app.get('/students', authenticate(['admin', 'device']), async (req, res) => {
  const { data, error } = await supabase.from('students').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Create a new course (admin or device user only)
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

// Get all courses (any logged-in user)
app.get('/courses', authenticate([]), async (req, res) => {
  const { data, error } = await supabase.from('courses').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Publish a course (admin or device user only)
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

// Create a module for a course (admin only)
app.post('/modules', authenticate(['admin']), async (req, res) => {
  const { course_id, module_name, credits } = req.body;

  const { data, error } = await supabase
    .from('modules')
    .insert([{ course_id, module_name, credits }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ message: 'Module created', module: data[0] });
});

// Get modules for a course (any logged-in user)
app.get('/modules/:courseId', authenticate([]), async (req, res) => {
  const { courseId } = req.params;
  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .eq('course_id', courseId);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Assign a coordinator to a course (admin only)
app.post('/course-coordinators', authenticate(['admin']), async (req, res) => {
  const { course_id, coordinator_id } = req.body;

  const { data, error } = await supabase
    .from('course_coordinators')
    .insert([{ course_id, coordinator_id }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ message: 'Coordinator assigned', assignment: data[0] });
});

// Get courses assigned to the logged-in coordinator
app.get('/course-coordinators/my', authenticate(['coordinator']), async (req, res) => {
  const { data, error } = await supabase
    .from('course_coordinators')
    .select('*')
    .eq('coordinator_id', req.user.userId);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Create a course session (admin, device, or resource person)
app.post('/course-sessions', authenticate(['admin', 'device', 'resource_person']), async (req, res) => {
  const { course_id, session_date, start_time, end_time, venue } = req.body;

  const { data, error } = await supabase
    .from('course_sessions')
    .insert([{ course_id, session_date, start_time, end_time, venue }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ message: 'Session created', session: data[0] });
});

// Get sessions for a course (any logged-in user)
app.get('/course-sessions/:courseId', authenticate([]), async (req, res) => {
  const { courseId } = req.params;
  const { data, error } = await supabase
    .from('course_sessions')
    .select('*')
    .eq('course_id', courseId);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Assign a resource person to a course (admin or device user only)
app.post('/course-resource-persons', authenticate(['admin', 'device']), async (req, res) => {
  const { course_id, trainer_id } = req.body;

  const { data, error } = await supabase
    .from('course_resource_persons')
    .insert([{ course_id, trainer_id }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ message: 'Resource person assigned', assignment: data[0] });
});

// Get resource persons assigned to a course (any logged-in user)
app.get('/course-resource-persons/:courseId', authenticate([]), async (req, res) => {
  const { courseId } = req.params;
  const { data, error } = await supabase
    .from('course_resource_persons')
    .select('*')
    .eq('course_id', courseId);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Get own registrations (student only) — MUST come before /registrations/:courseId
app.get('/registrations/my', authenticate(['student']), async (req, res) => {
  const studentId = await getStudentIdForUser(req.user.userId);
  if (!studentId) return res.status(404).json({ error: 'No student record linked to this account' });

  const { data, error } = await supabase
    .from('registrations')
    .select('*')
    .eq('student_id', studentId);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Get registrations for a specific student (admin or device user only)
app.get('/registrations/student/:studentId', authenticate(['admin', 'device']), async (req, res) => {
  const { studentId } = req.params;
  const { data, error } = await supabase
    .from('registrations')
    .select('*')
    .eq('student_id', studentId);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Get assessments for a specific student (admin or device user only)
app.get('/assessments/student/:studentId', authenticate(['admin', 'device']), async (req, res) => {
  const { studentId } = req.params;
  const { data, error } = await supabase
    .from('assessments')
    .select('*')
    .eq('student_id', studentId);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Get certificates for a specific student (admin or device user only)
app.get('/certificates/student/:studentId', authenticate(['admin', 'device']), async (req, res) => {
  const { studentId } = req.params;
  const { data, error } = await supabase
    .from('certificates')
    .select('*')
    .eq('student_id', studentId);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Register a student for a course (admin or device user only)
app.post('/registrations', authenticate(['admin', 'device']), async (req, res) => {
  const { student_id, course_id } = req.body;

  const { data, error } = await supabase
    .from('registrations')
    .insert([{ student_id, course_id, status: 'registered' }])
    .select();

  if (error) return res.status(500).json({ error: error.message });

  await supabase
    .from('students')
    .update({ registration_status: 'active' })
    .eq('student_id', student_id);

  res.status(201).json({ message: 'Student registered for course', registration: data[0] });
});

// Get registrations for a course (admin or device user only)
app.get('/registrations/:courseId', authenticate(['admin', 'device']), async (req, res) => {
  const { courseId } = req.params;
  const { data, error } = await supabase
    .from('registrations')
    .select('*')
    .eq('course_id', courseId);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Mark attendance (resource person, admin, or device user)
app.post('/attendance', authenticate(['resource_person', 'admin', 'device']), async (req, res) => {
  const { session_id, student_id, status } = req.body;

  const { data, error } = await supabase
    .from('attendance')
    .insert([{ session_id, student_id, status }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ message: 'Attendance marked', attendance: data[0] });
});

// Get own attendance (student only)
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

// Helper: compute grade band from marks
function computeGrade(marks) {
  const m = Number(marks);
  if (m < 50) return 'Fail';
  if (m <= 60) return 'Pass';
  if (m <= 69) return 'Excellent';
  return 'Merit';
}

// Enter module marks (resource person or admin)
app.post('/assessments', authenticate(['resource_person', 'admin']), async (req, res) => {
  const { student_id, course_id, module_id, marks } = req.body;

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
      student_id, course_id, module_id, marks, grade,
      published: false,
      reviewed: false,
      marked_by: markedBy
    }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ message: 'Marks recorded (pending review)', assessment: data[0] });
});

// Get unreviewed assessments for a course (coordinator only, must be assigned to that course)
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

// Review and publish an assessment (coordinator only, must be assigned to that course)
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

// Publish marks (admin can bypass review — kept for backward compatibility)
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

// Get own published marks (student only)
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

// Record a payment (admin or device user)
app.post('/payments', authenticate(['admin', 'device']), async (req, res) => {
  const { student_id, course_id, amount, type, status } = req.body;

  const { data, error } = await supabase
    .from('payments')
    .insert([{ student_id, course_id, amount, type, status }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ message: 'Payment recorded', payment: data[0] });
});

// Get own payments / outstanding balance (student only)
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

// Get payments for a specific student (admin or device user only)
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

// Total outstanding report (admin or device user)
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

// Issue a certificate (admin only) — checks academic + financial clearance first
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

  const verificationCode = 'CERT-' + Date.now();
  const { data, error } = await supabase
    .from('certificates')
    .insert([{
      student_id, course_id,
      issue_date: new Date().toISOString().split('T')[0],
      verification_code: verificationCode
    }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ message: 'Certificate issued', certificate: data[0] });
});

// Verify a certificate (public route, no login needed)
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