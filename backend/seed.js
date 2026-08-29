// One-time data seeding script for FetchTMS.
// Run with: node seed.js   (from inside the backend folder, after `npm install`)
// Uses the same SUPABASE_URL / SUPABASE_SERVICE_KEY from your .env file.
//
// This version is SAFE TO RE-RUN: it checks whether each resource person,
// course, student, and registration already exists before inserting, and
// skips anything that's already there instead of failing or duplicating it.

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const resourcePersonsData = [
  { name: 'Dr. Ruwan K Ranasinghe', title: 'PhD', organization: 'University of Colombo', qualifications: 'PhD, M Phil, BSc, MACS, MRCS', available_dates: 'Mon-Fri', subjects: 'Chemical Safety, Risk Mitigation', fee_per_hour: 5000 },
  { name: 'Nadeeka Silva', title: 'MBA', organization: 'SLIIT', qualifications: 'MBA, BSc (Hons) Management', available_dates: 'Weekends', subjects: 'Project Management, Leadership', fee_per_hour: 4000 },
  { name: 'Kasun Perera', title: 'Chartered Engineer', organization: 'IESL', qualifications: 'BSc Eng (Hons), C.Eng, MIESL', available_dates: 'Mon, Wed, Fri', subjects: 'Industrial Safety, HSE', fee_per_hour: 4500 },
  { name: 'Chamari Fernando', title: 'ACMA, CGMA', organization: 'Fetch Consultants (Pvt) Ltd', qualifications: 'ACMA, CGMA', available_dates: 'Tue, Thu', subjects: 'Financial Accounting, Bookkeeping', fee_per_hour: 3500 },
  { name: 'Ashan Jayasuriya', title: 'Certified IT Trainer', organization: 'ICTA', qualifications: 'MSc IT, MCSE', available_dates: 'Weekdays', subjects: 'IT Fundamentals, Digital Literacy', fee_per_hour: 4000 }
];

// NOTE: codes prefixed with "TR-" to avoid clashing with any course codes
// you already created while testing (e.g. CS101).
const coursesData = [
  { code: 'TR-CHS101', name: 'Safe Chemical Handling and Risk Mitigation', category: 'Health & Safety', description: 'One-day awareness training on safe handling of chemicals and risk mitigation.', duration: '1 day', sessions_count: 1, training_mode: 'in-person', venue: 'Hector Kobbekaduwa Agrarian Research and Training Institute, Colombo 07', start_date: '2026-09-10', end_date: '2026-09-10', max_participants: 30, fee: 8000, certificate_type: 'Participation', level: 'Certificate' },
  { code: 'TR-PMF201', name: 'Project Management Fundamentals', category: 'Management', description: 'Four-week diploma covering core project management principles.', duration: '4 weeks', sessions_count: 8, training_mode: 'hybrid', venue: 'Fetch Consultants Training Center, Nugegoda', start_date: '2026-09-15', end_date: '2026-10-10', max_participants: 25, fee: 35000, certificate_type: 'Diploma', level: 'Diploma' },
  { code: 'TR-IHS110', name: 'Industrial Health & Safety Essentials', category: 'Health & Safety', description: 'NVQ-aligned industrial health and safety essentials course.', duration: '2 weeks', sessions_count: 6, training_mode: 'in-person', venue: 'Fetch Consultants Training Center, Nugegoda', start_date: '2026-09-20', end_date: '2026-10-03', max_participants: 20, fee: 22000, certificate_type: 'NVQ', level: 'NVQ Level 3' },
  { code: 'TR-FAC105', name: 'Financial Accounting for Non-Accountants', category: 'Finance', description: 'Three-day practical course on financial accounting basics.', duration: '3 days', sessions_count: 3, training_mode: 'in-person', venue: 'Fetch Consultants Training Center, Nugegoda', start_date: '2026-09-25', end_date: '2026-09-27', max_participants: 25, fee: 15000, certificate_type: 'Participation', level: 'Certificate' },
  { code: 'TR-ITF100', name: 'IT Fundamentals & Digital Literacy', category: 'Information Technology', description: 'Two-week online course on IT fundamentals and digital literacy.', duration: '2 weeks', sessions_count: 5, training_mode: 'online', venue: 'Online (Zoom)', start_date: '2026-10-01', end_date: '2026-10-14', max_participants: 40, fee: 10000, certificate_type: 'Participation', level: 'Certificate' },
  { code: 'TR-LPM220', name: 'Leadership & People Management', category: 'Management', description: 'Six-week higher diploma in leadership and people management.', duration: '6 weeks', sessions_count: 10, training_mode: 'hybrid', venue: 'Fetch Consultants Training Center, Nugegoda', start_date: '2026-10-05', end_date: '2026-11-15', max_participants: 20, fee: 45000, certificate_type: 'Higher Diploma', level: 'Higher Diploma' },
  // Demo course already completed (past dates) so it can demonstrate a full paid + graded + certificate-eligible record
  { code: 'TR-COM101', name: 'Effective Workplace Communication', category: 'Communication Skills', description: 'Two-week certificate course on verbal, written, and presentation communication skills.', duration: '2 weeks', sessions_count: 4, training_mode: 'in-person', venue: 'Fetch Consultants Training Center, Nugegoda', start_date: '2026-06-01', end_date: '2026-06-12', max_participants: 20, fee: 12000, certificate_type: 'Participation', level: 'Certificate' }
];

const modulesData = [
  { courseCode: 'TR-CHS101', module_name: 'Chemical Hazard Identification', credits: 2 },
  { courseCode: 'TR-CHS101', module_name: 'Risk Mitigation Techniques', credits: 2 },
  { courseCode: 'TR-PMF201', module_name: 'Project Planning & Scheduling', credits: 3 },
  { courseCode: 'TR-PMF201', module_name: 'Risk & Stakeholder Management', credits: 3 },
  { courseCode: 'TR-IHS110', module_name: 'Workplace Hazard Assessment', credits: 2 },
  { courseCode: 'TR-IHS110', module_name: 'Emergency Response Procedures', credits: 2 },
  { courseCode: 'TR-COM101', module_name: 'Verbal & Written Communication', credits: 2 },
  { courseCode: 'TR-COM101', module_name: 'Presentation Skills', credits: 2 }
];

const courseResourcePersonAssignments = [
  { courseCode: 'TR-CHS101', rpName: 'Dr. Ruwan K Ranasinghe' },
  { courseCode: 'TR-PMF201', rpName: 'Nadeeka Silva' },
  { courseCode: 'TR-IHS110', rpName: 'Kasun Perera' },
  { courseCode: 'TR-FAC105', rpName: 'Chamari Fernando' },
  { courseCode: 'TR-ITF100', rpName: 'Ashan Jayasuriya' },
  { courseCode: 'TR-LPM220', rpName: 'Nadeeka Silva' },
  { courseCode: 'TR-COM101', rpName: 'Nadeeka Silva' }
];

const studentsData = [
  { full_name: 'Kavindu Wickramasinghe', nic_passport: '200012345671', dob: '2000-03-14', gender: 'male', address: '12 Galle Road, Colombo 06', contact_number: '0771234501', email: 'kavindu.w@example.com', organization: 'Self-Employed', job_title: 'Technician', qualification: 'GCE A/L', emergency_contact: '0771234601' },
  { full_name: 'Sanduni Rajapaksha', nic_passport: '199845678912', dob: '1998-07-22', gender: 'female', address: '45 Temple Road, Kandy', contact_number: '0771234502', email: 'sanduni.r@example.com', organization: 'ABC Holdings', job_title: 'Project Coordinator', qualification: 'Diploma', emergency_contact: '0771234602' },
  { full_name: 'Tharindu Bandara', nic_passport: '199534567823', dob: '1995-11-02', gender: 'male', address: '8 Main Street, Negombo', contact_number: '0771234503', email: 'tharindu.b@example.com', organization: 'BuildRight Engineering', job_title: 'Site Engineer', qualification: 'Degree', emergency_contact: '0771234603' },
  { full_name: 'Nimesha Kodithuwakku', nic_passport: '200223456734', dob: '2002-01-19', gender: 'female', address: '23 Lake Road, Kurunegala', contact_number: '0771234504', email: 'nimesha.k@example.com', organization: 'N/A', job_title: 'Trainee', qualification: 'GCE O/L', emergency_contact: '0771234604' },
  { full_name: 'Isuru Madushanka', nic_passport: '199756789034', dob: '1997-05-30', gender: 'male', address: '67 Station Road, Matara', contact_number: '0771234505', email: 'isuru.m@example.com', organization: 'Southern Textiles', job_title: 'Safety Officer', qualification: 'NVQ', emergency_contact: '0771234605' },
  { full_name: 'Dulani Weerasinghe', nic_passport: '199912345645', dob: '1999-09-08', gender: 'female', address: '19 Colombo Road, Gampaha', contact_number: '0771234506', email: 'dulani.w@example.com', organization: 'Weerasinghe Traders', job_title: 'Office Manager', qualification: 'Higher Diploma', emergency_contact: '0771234606' },
  { full_name: 'Ravindu Gunasekara', nic_passport: '199667891256', dob: '1996-02-27', gender: 'male', address: '5 Beach Road, Kalutara', contact_number: '0771234507', email: 'ravindu.g@example.com', organization: 'CoastalWorks Ltd', job_title: 'Supervisor', qualification: 'Associate Diploma', emergency_contact: '0771234607' },
  { full_name: 'Chathurika Abeysekara', nic_passport: '199378912367', dob: '1993-12-11', gender: 'female', address: '31 Hill Street, Badulla', contact_number: '0771234508', email: 'chathurika.a@example.com', organization: 'Uva Consulting', job_title: 'HR Manager', qualification: 'Masters', emergency_contact: '0771234608' },
  { full_name: 'Malith Senanayake', nic_passport: '199489012378', dob: '1994-06-16', gender: 'male', address: '14 River Road, Ratnapura', contact_number: '0771234509', email: 'malith.s@example.com', organization: 'Gem City Exports', job_title: 'Quality Analyst', qualification: 'Degree', emergency_contact: '0771234609' },
  { full_name: 'Piumi Karunarathne', nic_passport: '200156789089', dob: '2001-04-05', gender: 'female', address: '2 Fort Road, Jaffna', contact_number: '0771234510', email: 'piumi.k@example.com', organization: 'N/A', job_title: 'Trainee', qualification: 'GCE A/L', emergency_contact: '0771234610' },
  { full_name: 'Nuwan Dissanayake', nic_passport: '199523456790', dob: '1995-08-23', gender: 'male', address: '9 Sacred City Road, Anuradhapura', contact_number: '0771234511', email: 'nuwan.d@example.com', organization: 'Rajarata Agro', job_title: 'Field Officer', qualification: 'Diploma', emergency_contact: '0771234611' },
  { full_name: 'Achini Ekanayake', nic_passport: '199067891201', dob: '1990-10-30', gender: 'female', address: '27 University Road, Colombo 07', contact_number: '0771234512', email: 'achini.e@example.com', organization: 'National Research Council', job_title: 'Research Fellow', qualification: 'PhD', emergency_contact: '0771234612' },
  { full_name: 'Yasodha Perumal', nic_passport: '199678912389', dob: '1996-02-14', gender: 'female', address: '11 Duplication Road, Colombo 04', contact_number: '0771234513', email: 'yasodha.p@example.com', organization: 'Ceylon Insurance Co', job_title: 'Customer Relations Executive', qualification: 'Diploma', emergency_contact: '0771234613' },
  { full_name: 'Chanaka Wijesuriya', nic_passport: '199345678990', dob: '1993-07-19', gender: 'male', address: '4 Peradeniya Road, Kandy', contact_number: '0771234514', email: 'chanaka.w@example.com', organization: 'Hillside Motors', job_title: 'Sales Executive', qualification: 'Degree', emergency_contact: '0771234614' }
];

const registrationPlan = [
  { student: 'Kavindu Wickramasinghe', course: 'TR-CHS101', paid: 8000 },
  { student: 'Sanduni Rajapaksha', course: 'TR-PMF201', paid: 15000 },
  { student: 'Tharindu Bandara', course: 'TR-IHS110', paid: 0 },
  { student: 'Nimesha Kodithuwakku', course: 'TR-CHS101', paid: 8000 },
  { student: 'Isuru Madushanka', course: 'TR-FAC105', paid: 5000 },
  { student: 'Dulani Weerasinghe', course: 'TR-ITF100', paid: 0 },
  { student: 'Ravindu Gunasekara', course: 'TR-PMF201', paid: 35000 },
  { student: 'Chathurika Abeysekara', course: 'TR-LPM220', paid: 20000 },
  { student: 'Malith Senanayake', course: 'TR-IHS110', paid: 22000 },
  { student: 'Piumi Karunarathne', course: 'TR-FAC105', paid: 0 },
  { student: 'Nuwan Dissanayake', course: 'TR-CHS101', paid: 4000 },
  { student: 'Achini Ekanayake', course: 'TR-LPM220', paid: 45000 },
  { student: 'Yasodha Perumal', course: 'TR-COM101', paid: 12000 },
  { student: 'Chanaka Wijesuriya', course: 'TR-COM101', paid: 12000 }
];

// Assessments for the demo course — all published + reviewed + passing, so it is certificate-eligible
const assessmentPlan = [
  { student: 'Yasodha Perumal', course: 'TR-COM101', module: 'Verbal & Written Communication', eval_type: 'assignment', marks: 68 },
  { student: 'Yasodha Perumal', course: 'TR-COM101', module: 'Presentation Skills', eval_type: 'exam', marks: 74 },
  { student: 'Chanaka Wijesuriya', course: 'TR-COM101', module: 'Verbal & Written Communication', eval_type: 'assignment', marks: 55 },
  { student: 'Chanaka Wijesuriya', course: 'TR-COM101', module: 'Presentation Skills', eval_type: 'exam', marks: 81 }
];

// Formal double-entry Receipt Journal records for the same demo-course payments
// (separate from the payments table above, which only drives the per-course balance)
const receiptPlan = [
  { student: 'Yasodha Perumal', amount: 12000, entry_date: '2026-06-01', description: 'Receipt - Yasodha Perumal - TR-COM101 course fee' },
  { student: 'Chanaka Wijesuriya', amount: 12000, entry_date: '2026-06-01', description: 'Receipt - Chanaka Wijesuriya - TR-COM101 course fee' }
];

function computeGrade(marks) {
  const m = Number(marks);
  if (m < 50) return 'Fail';
  if (m <= 60) return 'Pass';
  if (m <= 69) return 'Excellent';
  return 'Merit';
}

async function getAccountIdByCode(code) {
  const { data } = await supabase.from('chart_of_accounts').select('account_id').eq('code', code).single();
  return data ? data.account_id : null;
}

async function seed() {
  console.log('Checking/seeding resource persons...');
  const { data: existingRPs } = await supabase.from('resource_persons').select('*');
  const rpToInsert = resourcePersonsData.filter(rp => !existingRPs.some(e => e.name === rp.name));
  let insertedRPs = [];
  if (rpToInsert.length > 0) {
    const { data, error } = await supabase.from('resource_persons').insert(rpToInsert).select();
    if (error) throw error;
    insertedRPs = data;
  }
  const resourcePersons = [...existingRPs, ...insertedRPs];
  console.log(`  ${insertedRPs.length} added, ${resourcePersons.length - insertedRPs.length} already existed.`);

  console.log('Checking/seeding courses...');
  const { data: existingCourses } = await supabase.from('courses').select('*');
  const coursesToInsert = coursesData.filter(c => !existingCourses.some(e => e.code === c.code));
  let insertedCourses = [];
  if (coursesToInsert.length > 0) {
    const { data, error } = await supabase
      .from('courses').insert(coursesToInsert.map(c => ({ ...c, status: 'published' }))).select();
    if (error) throw error;
    insertedCourses = data;
  }
  const courses = [...existingCourses, ...insertedCourses];
  console.log(`  ${insertedCourses.length} added, ${courses.length - insertedCourses.length} already existed.`);

  const courseByCode = code => courses.find(c => c.code === code);
  const rpByName = name => resourcePersons.find(rp => rp.name === name);

  console.log('Checking/seeding resource person assignments...');
  const { data: existingAssignments } = await supabase.from('course_resource_persons').select('*');
  const assignmentsToInsert = courseResourcePersonAssignments
    .map(a => ({ course_id: courseByCode(a.courseCode).course_id, trainer_id: rpByName(a.rpName).trainer_id }))
    .filter(a => !existingAssignments.some(e => e.course_id === a.course_id && e.trainer_id === a.trainer_id));
  if (assignmentsToInsert.length > 0) {
    const { error } = await supabase.from('course_resource_persons').insert(assignmentsToInsert);
    if (error) throw error;
  }
  console.log(`  ${assignmentsToInsert.length} added.`);

  console.log('Checking/seeding modules...');
  const { data: existingModules } = await supabase.from('modules').select('*');
  const modulesToInsert = modulesData
    .map(m => ({ course_id: courseByCode(m.courseCode).course_id, module_name: m.module_name, credits: m.credits }))
    .filter(m => !existingModules.some(e => e.course_id === m.course_id && e.module_name === m.module_name));
  if (modulesToInsert.length > 0) {
    const { error } = await supabase.from('modules').insert(modulesToInsert);
    if (error) throw error;
  }
  console.log(`  ${modulesToInsert.length} added.`);

  console.log('Checking/seeding students...');
  const { data: existingStudents } = await supabase.from('students').select('*');
  const studentsToInsert = studentsData.filter(s => !existingStudents.some(e => e.email === s.email));
  let insertedStudents = [];
  if (studentsToInsert.length > 0) {
    const { data, error } = await supabase
      .from('students').insert(studentsToInsert.map(s => ({ ...s, registration_status: 'pending' }))).select();
    if (error) throw error;
    insertedStudents = data;
  }
  const students = [...existingStudents, ...insertedStudents];
  console.log(`  ${insertedStudents.length} added, ${students.length - insertedStudents.length} already existed.`);

  const studentByEmail = email => students.find(s => s.email === email);
  const emailByName = {};
  studentsData.forEach(s => { emailByName[s.full_name] = s.email; });

  console.log('Checking/seeding registrations and payments...');
  const { data: existingRegs } = await supabase.from('registrations').select('*');
  let regCount = 0;
  for (const r of registrationPlan) {
    const student = studentByEmail(emailByName[r.student]);
    const course = courseByCode(r.course);
    if (!student || !course) continue;

    const alreadyRegistered = existingRegs.some(e => e.student_id === student.student_id && e.course_id === course.course_id);
    if (alreadyRegistered) continue;

    const fee = Number(course.fee) || 0;

    const { error: regError } = await supabase
      .from('registrations').insert([{ student_id: student.student_id, course_id: course.course_id, status: 'registered' }]);
    if (regError) throw regError;

    await supabase.from('students').update({ registration_status: 'active' }).eq('student_id', student.student_id);

    if (fee > 0) {
      const { error: debitError } = await supabase.from('payments').insert([{
        student_id: student.student_id, course_id: course.course_id, amount: fee, type: 'debit', status: 'completed'
      }]);
      if (debitError) throw debitError;
    }

    if (r.paid > 0) {
      const { error: creditError } = await supabase.from('payments').insert([{
        student_id: student.student_id, course_id: course.course_id, amount: r.paid, type: 'credit', status: 'completed'
      }]);
      if (creditError) throw creditError;
    }

    regCount++;
  }
  console.log(`  ${regCount} new registrations added.`);

  console.log('Checking/seeding assessments (assignment/exam marks)...');
  const { data: existingAssessments } = await supabase.from('assessments').select('*');
  const { data: allModules } = await supabase.from('modules').select('*');
  let assessCount = 0;
  for (const a of assessmentPlan) {
    const student = studentByEmail(emailByName[a.student]);
    const course = courseByCode(a.course);
    const moduleRow = allModules.find(m => m.course_id === course.course_id && m.module_name === a.module);
    if (!student || !course || !moduleRow) continue;

    const already = existingAssessments.some(e =>
      e.student_id === student.student_id && e.course_id === course.course_id &&
      e.module_id === moduleRow.module_id && e.eval_type === a.eval_type
    );
    if (already) continue;

    const rp = rpByName('Nadeeka Silva');
    const { error: assessError } = await supabase.from('assessments').insert([{
      student_id: student.student_id,
      course_id: course.course_id,
      module_id: moduleRow.module_id,
      marks: a.marks,
      grade: computeGrade(a.marks),
      eval_type: a.eval_type,
      published: true,
      reviewed: true,
      marked_by: rp ? rp.trainer_id : null
    }]);
    if (assessError) throw assessError;
    assessCount++;
  }
  console.log(`  ${assessCount} new assessments added.`);

  console.log('Checking/seeding Receipt Journal entries...');
  const cashAccountId = await getAccountIdByCode('1000');
  const arAccountId = await getAccountIdByCode('1100');
  const { data: adminUsers } = await supabase.from('users').select('user_id').eq('role', 'admin').limit(1);
  const adminUserId = adminUsers && adminUsers.length > 0 ? adminUsers[0].user_id : null;
  const { data: existingEntries } = await supabase.from('journal_entries').select('*').eq('entry_type', 'receipt');
  let receiptCount = 0;
  if (cashAccountId && arAccountId && adminUserId) {
    for (const r of receiptPlan) {
      const student = studentByEmail(emailByName[r.student]);
      if (!student) continue;

      const already = existingEntries.some(e => e.description === r.description);
      if (already) continue;

      const { data: entry, error: entryError } = await supabase
        .from('journal_entries')
        .insert([{ entry_date: r.entry_date, description: r.description, entry_type: 'receipt', created_by: adminUserId, reversed: false }])
        .select().single();
      if (entryError) throw entryError;

      const { error: linesError } = await supabase.from('journal_lines').insert([
        { entry_id: entry.entry_id, account_id: cashAccountId, debit_amount: r.amount, credit_amount: 0, student_id: student.student_id },
        { entry_id: entry.entry_id, account_id: arAccountId, debit_amount: 0, credit_amount: r.amount, student_id: student.student_id }
      ]);
      if (linesError) throw linesError;
      receiptCount++;
    }
  } else {
    console.log('  Skipped: chart_of_accounts codes 1000/1100 or an admin user account were not found.');
  }
  console.log(`  ${receiptCount} new receipt journal entries added.`);

  console.log('\nSeed complete!');
  console.log('\nCertificate-ready demo students: Yasodha Perumal and Chanaka Wijesuriya, course TR-COM101 (Effective Workplace Communication).');
  console.log('Both have full marks published/reviewed and the fee fully paid, so Issue Certificate should succeed for either of them.');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
