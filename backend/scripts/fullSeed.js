/**
 * GYM-CRM — Full Seed Script v2.0
 * Seeds: Gym, Plans, Staff (trainers + receptionist), Members,
 *        Attendance, Payments, Expenses, Leads, Classes,
 *        Body Assessments, WorkoutTemplates, WorkoutPlans, DietPlans,
 *        PT Packages, PT Sessions, TrainerSalaries, TrainerAttendance,
 *        Payroll records.
 *
 * Usage:
 *   node scripts/fullSeed.js              → seeds into first admin's gym
 *   node scripts/fullSeed.js --wipe       → clears all seed data first
 */

const dotenv = require('dotenv');
dotenv.config({ path: require('path').resolve(__dirname, '../.env') });

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min, max) => parseFloat((Math.random() * (max - min) + min).toFixed(1));
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };
const daysFrom = (base, n) => { const d = new Date(base); d.setDate(d.getDate() + n); return d; };

// ─── Fake data pools ──────────────────────────────────────────────────────────
const FIRST_NAMES = [
  'Arjun','Priya','Rohit','Sneha','Vikram','Ananya','Karthik','Divya','Rajesh','Meera',
  'Suresh','Lakshmi','Aditya','Pooja','Manish','Deepika','Nikhil','Kavya','Sanjay','Nisha',
  'Harish','Asha','Praveen','Swathi','Ramesh','Geeta','Ajay','Sunita','Vivek','Rekha',
];
const LAST_NAMES = [
  'Sharma','Kumar','Patel','Singh','Reddy','Nair','Joshi','Mehta','Gupta','Iyer',
  'Bose','Verma','Tiwari','Pillai','Nayak','Rao','Shah','Mishra','Das','Chopra',
];
const SOURCES = ['Walk-in','Instagram','Facebook','Google','Referral','WhatsApp','Newspaper'];
const LEAD_STATUSES = ['New','Contacted','Interested','Converted','Lost'];
const CLASS_TYPES = ['Yoga','Zumba','Pilates','CrossFit','HIIT','Boxing','Cycling','Dance','Strength','Cardio'];
const EXPENSE_CATS = ['Equipment','Utilities','Maintenance','Marketing','Salary','Cleaning','Miscellaneous'];
const PAYMENT_METHODS = ['Cash','UPI','Card','Bank Transfer'];
const TRAINER_NOTES = [
  'Great progress this week. Keep it up!',
  'Focus on form correction for squats.',
  'Increase cardio sessions from next week.',
  'Member showing excellent commitment.',
  'Advised rest day to avoid overtraining.',
  'Nutrition guidance provided.',
  'Reassessed fitness goals for Q3.',
  'Member requests more upper body work.',
  'Flexibility improving — continue stretching.',
  'Core strength session completed successfully.',
];
const MEAL_PRESETS = [
  { time: 'Breakfast', calories: 450, protein: 25, carbs: 55, fats: 12 },
  { time: 'Mid-Morning Snack', calories: 200, protein: 10, carbs: 25, fats: 6 },
  { time: 'Lunch', calories: 650, protein: 40, carbs: 70, fats: 18 },
  { time: 'Pre-Workout', calories: 300, protein: 20, carbs: 40, fats: 5 },
  { time: 'Post-Workout', calories: 350, protein: 30, carbs: 45, fats: 7 },
  { time: 'Dinner', calories: 550, protein: 35, carbs: 60, fats: 15 },
  { time: 'Evening Snack', calories: 180, protein: 8, carbs: 22, fats: 5 },
];
const EXERCISES = [
  { name: 'Barbell Squat',       sets: 4, reps: 10, rest: '90s', muscle: 'Legs'     },
  { name: 'Deadlift',            sets: 4, reps: 6,  rest: '120s', muscle: 'Back'    },
  { name: 'Bench Press',         sets: 4, reps: 10, rest: '90s', muscle: 'Chest'    },
  { name: 'Pull-Up',             sets: 3, reps: 12, rest: '60s', muscle: 'Back'     },
  { name: 'Overhead Press',      sets: 3, reps: 10, rest: '90s', muscle: 'Shoulder' },
  { name: 'Dumbbell Row',        sets: 3, reps: 12, rest: '60s', muscle: 'Back'     },
  { name: 'Leg Press',           sets: 4, reps: 15, rest: '90s', muscle: 'Legs'     },
  { name: 'Tricep Dip',          sets: 3, reps: 15, rest: '60s', muscle: 'Arms'     },
  { name: 'Bicep Curl',          sets: 3, reps: 12, rest: '60s', muscle: 'Arms'     },
  { name: 'Plank',               sets: 3, reps: 60, rest: '30s', muscle: 'Core'     },
  { name: 'Romanian Deadlift',   sets: 3, reps: 10, rest: '90s', muscle: 'Hamstring'},
  { name: 'Lateral Raise',       sets: 3, reps: 15, rest: '45s', muscle: 'Shoulder' },
];

const fakeName = () => `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
const fakePhone = (i) => `98${String(rand(10,99)).padStart(2,'0')}${String(1000000 + i).slice(1)}`;
const fakeEmail = (name, i) => `${name.toLowerCase().replace(/\s+/g, '.')}${i}@gymtest.in`;

// ─── Main seeder ──────────────────────────────────────────────────────────────
async function main() {
  const wipe = process.argv.includes('--wipe');
  console.log('\n🌱  GYM-CRM Full Seed Script v2.0');
  console.log('══════════════════════════════════════');

  // ── 1. Find an existing admin user and their gym ──────────────────────────
  console.log('\n[1/15] Locating admin user & gym…');
  const adminUser = await prisma.user.findFirst({ where: { role: 'admin' } });
  if (!adminUser) {
    console.error('❌  No admin user found. Run the app and register first, or run `node seed.js`.');
    process.exit(1);
  }

  const gymId   = adminUser.gymId;
  const branchId = adminUser.branchId || null;
  console.log(`   ✅ Admin: ${adminUser.name} (${adminUser.email})`);
  console.log(`   ✅ Gym ID: ${gymId}`);

  // Confirm gym exists
  const gym = await prisma.gym.findUnique({ where: { id: gymId } });
  if (!gym) {
    console.error(`❌  Gym ${gymId} not found in DB.`);
    process.exit(1);
  }
  console.log(`   ✅ Gym Name: ${gym.name}`);

  // ── Optional wipe ────────────────────────────────────────────────────────
  if (wipe) {
    console.log('\n[0/15] ⚠️  --wipe flag detected. Deleting all seed data for this gym…');
    await prisma.payroll.deleteMany({ where: { gymId } });
    await prisma.ptCommission.deleteMany({ where: { gymId } });
    await prisma.ptSession.deleteMany({ where: { gymId } });
    await prisma.ptPackage.deleteMany({ where: { gymId } });
    await prisma.dietPlan.deleteMany({ where: { gymId } });
    await prisma.workoutPlan.deleteMany({ where: { gymId } });
    await prisma.workoutTemplate.deleteMany({ where: { gymId } });
    await prisma.bodyAssessment.deleteMany({ where: { gymId } });
    await prisma.trainerAttendance.deleteMany({ where: { gymId } });
    await prisma.gymClass.deleteMany({ where: { gymId } });
    await prisma.attendance.deleteMany({ where: { gymId } });
    await prisma.payment.deleteMany({ where: { gymId } });
    await prisma.expense.deleteMany({ where: { gymId } });
    await prisma.lead.deleteMany({ where: { gymId } });
    // Keep members created today or wipe them all
    await prisma.member.deleteMany({ where: { gymId, name: { contains: 'Seed' } } });
    console.log('   ✅ Wipe complete.');
  }

  // ── 2. Plans ─────────────────────────────────────────────────────────────
  console.log('\n[2/15] Creating 10 membership plans…');
  const planDefs = [
    { name: 'Monthly Basic',        duration: 30,  price: 999  },
    { name: 'Quarterly Silver',     duration: 90,  price: 2499 },
    { name: 'Half-Yearly Gold',     duration: 180, price: 4499 },
    { name: 'Annual Diamond',       duration: 365, price: 7999 },
    { name: 'Monthly Premium',      duration: 30,  price: 1499 },
    { name: 'Quarterly Premium',    duration: 90,  price: 3999 },
    { name: 'Weekend Warrior',      duration: 30,  price: 699  },
    { name: 'Student Pack',         duration: 90,  price: 1999 },
    { name: 'Corporate Flexi',      duration: 365, price: 6999 },
    { name: '10-Day Trial',         duration: 10,  price: 499  },
    { name: 'Annual Platinum',      duration: 365, price: 9999 },
    { name: 'Bi-Annual Pro',        duration: 180, price: 5499 },
  ];

  const plans = [];
  for (const p of planDefs) {
    const existing = await prisma.plan.findFirst({ where: { gymId, name: p.name } });
    if (existing) {
      plans.push(existing);
    } else {
      const created = await prisma.plan.create({
        data: { ...p, gymId, branchId, durationUnit: 'days' },
      });
      plans.push(created);
    }
  }
  console.log(`   ✅ ${plans.length} plans ready.`);

  // ── 3. Staff — Trainers & Receptionist ──────────────────────────────────
  console.log('\n[3/15] Creating 10 staff members (8 trainers + 2 receptionists)…');
  const salt = await bcrypt.genSalt(10);
  const hashedPw = await bcrypt.hash('Staff@123', salt);

  const staffDefs = [
    { name: 'Arjun Sharma',    email: 'trainer.arjun@gymtest.in',   role: 'trainer',      salary: 28000 },
    { name: 'Priya Nair',      email: 'trainer.priya@gymtest.in',   role: 'trainer',      salary: 25000 },
    { name: 'Rohit Verma',     email: 'trainer.rohit@gymtest.in',   role: 'trainer',      salary: 30000 },
    { name: 'Sneha Pillai',    email: 'trainer.sneha@gymtest.in',   role: 'trainer',      salary: 27000 },
    { name: 'Vikram Reddy',    email: 'trainer.vikram@gymtest.in',  role: 'trainer',      salary: 32000 },
    { name: 'Ananya Singh',    email: 'trainer.ananya@gymtest.in',  role: 'trainer',      salary: 26000 },
    { name: 'Karthik Iyer',    email: 'trainer.karthik@gymtest.in', role: 'trainer',      salary: 29000 },
    { name: 'Divya Menon',     email: 'trainer.divya@gymtest.in',   role: 'trainer',      salary: 24000 },
    { name: 'Rajan Mehta',     email: 'recep.rajan@gymtest.in',     role: 'receptionist', salary: 18000 },
    { name: 'Leela Gupta',     email: 'recep.leela@gymtest.in',     role: 'receptionist', salary: 17000 },
  ];

  const staffRecords = [];
  for (const s of staffDefs) {
    let user = await prisma.user.findUnique({ where: { email: s.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: s.name,
          email: s.email,
          password: hashedPw,
          role: s.role,
          gymId,
          branchId,
          isVerified: true,
          status: 'Active',
          isActive: true,
        },
      });
    }
    staffRecords.push({ ...user, salary: s.salary });
  }

  const trainers = staffRecords.filter(s => s.role === 'trainer');
  console.log(`   ✅ ${staffRecords.length} staff members ready.`);

  // ── 4. TrainerSalary records ─────────────────────────────────────────────
  console.log('\n[4/15] Creating trainer salary configurations…');
  for (const t of trainers) {
    const existing = await prisma.trainerSalary.findUnique({ where: { trainerId: t.id } });
    if (!existing) {
      await prisma.trainerSalary.create({
        data: {
          trainerId:    t.id,
          fixedSalary:  t.salary,
          commissionPt: 200, // ₹200 per PT session
          gymId,
          branchId,
        },
      });
    }
  }
  console.log(`   ✅ Trainer salary configs done.`);

  // ── 5. Members ───────────────────────────────────────────────────────────
  console.log('\n[5/15] Creating 20 members…');
  const memberDefs = Array.from({ length: 20 }, (_, i) => {
    const name     = fakeName();
    const phone    = fakePhone(i + 100);
    const email    = fakeEmail(name, i);
    const plan     = pick(plans);
    const joinDaysAgo = rand(1, 300);
    const joinDate = daysAgo(joinDaysAgo);
    const expiryDate = daysFrom(joinDate, plan.duration);
    const status   = expiryDate > new Date() ? 'Active' : 'Expired';
    const planPrice = plan.price;
    const paidAmount = status === 'Active' ? planPrice : pick([planPrice, planPrice * 0.5]);
    return { name, phone, email, planId: plan.id, joinDate, expiryDate, status, planPrice, paidAmount };
  });

  const members = [];
  for (const m of memberDefs) {
    // Skip if phone already in use
    const existing = await prisma.member.findFirst({ where: { phone: m.phone, gymId } });
    if (existing) { members.push(existing); continue; }
    const created = await prisma.member.create({
      data: { ...m, gymId, branchId },
    });
    members.push(created);
  }
  console.log(`   ✅ ${members.length} members ready.`);

  // ── 6. Member user accounts (for portal login) ───────────────────────────
  console.log('\n[6/15] Creating member portal login accounts…');
  let memberUserCount = 0;
  for (const m of members) {
    const memberEmail = m.email || `${m.phone}@gym.com`;
    const existing = await prisma.user.findUnique({ where: { email: memberEmail } });
    if (!existing) {
      await prisma.user.create({
        data: {
          name: m.name,
          email: memberEmail,
          password: hashedPw,
          phone: m.phone,
          role: 'member',
          gymId,
          branchId,
          memberId: m.id,
          isVerified: true,
          status: m.status,
          isActive: m.status === 'Active',
        },
      });
      memberUserCount++;
    }
  }
  console.log(`   ✅ ${memberUserCount} member accounts created.`);

  // ── 7. Attendance records ────────────────────────────────────────────────
  console.log('\n[7/15] Creating attendance records (last 30 days)…');
  let attendanceCount = 0;
  for (const m of members.filter(m => m.status === 'Active')) {
    const visitDays = rand(8, 25);
    const daysSeen = new Set();
    while (daysSeen.size < visitDays) { daysSeen.add(rand(0, 29)); }
    for (const d of daysSeen) {
      const date = daysAgo(d);
      const h    = rand(6, 20);
      const min  = pick(['00','15','30','45']);
      try {
        await prisma.attendance.create({
          data: {
            memberId:    m.id,
            date,
            checkInTime: `${String(h).padStart(2,'0')}:${min}:00`,
            gymId,
            branchId,
          },
        });
        attendanceCount++;
      } catch { /* skip duplicates */ }
    }
  }
  console.log(`   ✅ ${attendanceCount} attendance records created.`);

  // ── 8. Payments ──────────────────────────────────────────────────────────
  console.log('\n[8/15] Creating payment records…');
  let paymentCount = 0;
  for (const m of members) {
    const numPayments = rand(1, 3);
    for (let p = 0; p < numPayments; p++) {
      const amount = p === 0 ? m.paidAmount : rand(500, 2000);
      await prisma.payment.create({
        data: {
          memberId:      m.id,
          amount,
          method:        pick(PAYMENT_METHODS),
          date:          daysAgo(rand(0, 90)),
          gymId,
          branchId,
          transactionId: `TXN${Date.now()}${rand(1000,9999)}`,
        },
      });
      paymentCount++;
    }
  }
  console.log(`   ✅ ${paymentCount} payment records created.`);

  // ── 9. Expenses ──────────────────────────────────────────────────────────
  console.log('\n[9/15] Creating 15 expense records…');
  const expenseDefs = [
    { title: 'Electricity Bill – June',    category: 'Utilities',    amount: 12500 },
    { title: 'Water Bill – June',          category: 'Utilities',    amount: 2800  },
    { title: 'Treadmill Servicing',        category: 'Equipment',    amount: 4500  },
    { title: 'New Dumbbells Set (5kg–30kg)', category: 'Equipment',  amount: 35000 },
    { title: 'Cleaning Supplies – July',   category: 'Cleaning',     amount: 1800  },
    { title: 'Gym Mat Replacement',        category: 'Equipment',    amount: 6500  },
    { title: 'Facebook Ad Campaign',       category: 'Marketing',    amount: 5000  },
    { title: 'Google Ads – June',          category: 'Marketing',    amount: 3500  },
    { title: 'Staff Salary – June',        category: 'Salary',       amount: 180000 },
    { title: 'Internet & WiFi Bill',       category: 'Utilities',    amount: 1500  },
    { title: 'AC Repair – Main Hall',      category: 'Maintenance',  amount: 8000  },
    { title: 'Protein Shake Bar Stock',    category: 'Miscellaneous',amount: 12000 },
    { title: 'CCTV System Upgrade',        category: 'Equipment',    amount: 22000 },
    { title: 'Front Desk Software License',category: 'Miscellaneous',amount: 3000 },
    { title: 'Printing – Brochures & Banners', category: 'Marketing',amount: 2200 },
  ];

  for (const e of expenseDefs) {
    await prisma.expense.create({
      data: { ...e, date: daysAgo(rand(0, 60)), gymId, branchId },
    });
  }
  console.log(`   ✅ 15 expense records created.`);

  // ── 10. Leads ────────────────────────────────────────────────────────────
  console.log('\n[10/15] Creating 15 leads…');
  for (let i = 0; i < 15; i++) {
    const name   = fakeName();
    const phone  = fakePhone(i + 500);
    const status = pick(LEAD_STATUSES);
    await prisma.lead.create({
      data: {
        name,
        phone,
        email:          fakeEmail(name, i + 500),
        source:         pick(SOURCES),
        status,
        interestedPlan: pick(plans).name,
        notes:          `Enquired about ${pick(CLASS_TYPES)} classes. Follow up needed.`,
        followUpDate:   status === 'New' || status === 'Contacted' ? daysFrom(new Date(), rand(1,7)) : null,
        gymId,
        branchId,
        assignedTo:     pick(staffDefs).name,
      },
    });
  }
  console.log(`   ✅ 15 leads created.`);

  // ── 11. Classes ──────────────────────────────────────────────────────────
  console.log('\n[11/15] Creating 12 gym classes…');
  const timeSlots = [
    { start: '06:00', end: '07:00' },
    { start: '07:00', end: '08:00' },
    { start: '08:00', end: '09:00' },
    { start: '09:00', end: '10:00' },
    { start: '17:00', end: '18:00' },
    { start: '18:00', end: '19:00' },
    { start: '19:00', end: '20:00' },
  ];
  for (let i = 0; i < 12; i++) {
    const classType = CLASS_TYPES[i % CLASS_TYPES.length];
    const trainer   = pick(trainers);
    const slot      = pick(timeSlots);
    await prisma.gymClass.create({
      data: {
        name:         `${classType} – Batch ${i + 1}`,
        type:         classType,
        description:  `${classType} class for all fitness levels. Bring water and a mat.`,
        trainerName:  trainer.name,
        scheduleDate: daysFrom(new Date(), rand(1, 14)),
        startTime:    slot.start,
        endTime:      slot.end,
        maxSeats:     rand(10, 25),
        gymId,
        branchId,
        bookings:     JSON.stringify([]),
      },
    });
  }
  console.log(`   ✅ 12 classes created.`);

  // ── 12. Body Assessments ─────────────────────────────────────────────────
  console.log('\n[12/15] Creating body assessments for 15 members…');
  let assessmentCount = 0;
  for (const m of members.slice(0, 15)) {
    const trainer = pick(trainers);
    // Create 2 assessments per member (initial + follow-up)
    for (let round = 0; round < 2; round++) {
      const weight      = randFloat(55, 110);
      const height      = randFloat(155, 190) / 100;
      const bmi         = parseFloat((weight / (height * height)).toFixed(1));
      const bodyFat     = randFloat(12, 35);
      const muscleMass  = randFloat(25, 55);
      const bmr         = parseFloat((10 * weight + 6.25 * height * 100 - 5 * rand(20, 45) + 5).toFixed(0));
      const inBodyScore = rand(65, 95);

      await prisma.bodyAssessment.create({
        data: {
          memberId:       m.id,
          trainerId:      trainer.id,
          weight,
          bmi,
          bodyFat,
          muscleMass,
          bmr,
          inBodyScore,
          assessmentDate: daysAgo(rand(0, 60)),
          gymId,
          branchId,
        },
      });
      assessmentCount++;
    }
  }
  console.log(`   ✅ ${assessmentCount} body assessments created.`);

  // ── 13. Workout Templates & Plans ────────────────────────────────────────
  console.log('\n[13/15] Creating workout templates and member plans…');
  const templateNames = [
    'Beginner Full Body 3-Day','Intermediate Push-Pull-Legs','Advanced 5-Day Split',
    'Home Workout Bodyweight','Fat Loss Cardio Circuit','Muscle Building Hypertrophy',
    'Senior Fitness & Mobility','Postpartum Recovery','Athletic Performance','Core & Flexibility',
  ];

  const templates = [];
  for (const tname of templateNames) {
    const exSet = EXERCISES.slice(0, rand(4, 8));
    const template = await prisma.workoutTemplate.create({
      data: {
        name:        tname,
        description: `A comprehensive ${tname} program designed for progressive overload.`,
        exercises:   JSON.stringify(exSet),
        gymId,
        branchId,
      },
    });
    templates.push(template);
  }

  let wpCount = 0;
  for (const m of members.slice(0, 15)) {
    const trainer  = pick(trainers);
    const template = pick(templates);
    const startDate = daysAgo(rand(0, 30));
    await prisma.workoutPlan.create({
      data: {
        memberId:  m.id,
        trainerId: trainer.id,
        name:      template.name,
        startDate,
        endDate:   daysFrom(startDate, 30),
        exercises: template.exercises,
        gymId,
        branchId,
      },
    });
    wpCount++;
  }
  console.log(`   ✅ ${templates.length} templates + ${wpCount} member workout plans.`);

  // ── 14. Diet Plans ───────────────────────────────────────────────────────
  console.log('\n[14/15] Creating diet plans for members…');
  const dietGoals = ['Weight Loss','Muscle Gain','Maintenance','Lean Bulk','Endurance Fuel'];
  let dietCount = 0;
  for (const m of members.slice(0, 15)) {
    const trainer = pick(trainers);
    const goal    = pick(dietGoals);
    const meals   = MEAL_PRESETS.slice(0, rand(4, 7)).map(meal => ({
      ...meal,
      food: `${goal}-optimised food choices`,
      notes: `Adjust portions based on progress`,
    }));
    const startDate = daysAgo(rand(0, 30));
    await prisma.dietPlan.create({
      data: {
        memberId:  m.id,
        trainerId: trainer.id,
        name:      `${goal} Diet – ${m.name.split(' ')[0]}`,
        startDate,
        endDate:   daysFrom(startDate, 30),
        meals:     JSON.stringify(meals),
        gymId,
        branchId,
      },
    });
    dietCount++;
  }
  console.log(`   ✅ ${dietCount} diet plans created.`);

  // ── 15. PT Packages, PT Sessions, Trainer Attendance, Payroll ───────────
  console.log('\n[15/15] Creating PT packages, PT sessions, trainer attendance, payroll…');

  // PT Packages
  const ptPackageDefs = [
    { name: '10-Session PT Pack',   sessionCount: 10, price: 8000,  duration: 60 },
    { name: '20-Session PT Pack',   sessionCount: 20, price: 15000, duration: 90 },
    { name: '30-Session PT Pack',   sessionCount: 30, price: 20000, duration: 90 },
    { name: 'Monthly PT (12 sess)', sessionCount: 12, price: 9500,  duration: 30 },
    { name: 'Bi-Monthly PT Pack',   sessionCount: 24, price: 18000, duration: 60 },
    { name: 'Weight Loss Intensive',sessionCount: 16, price: 12000, duration: 45 },
    { name: 'Muscle Building Pro',  sessionCount: 20, price: 16000, duration: 60 },
    { name: 'Senior Wellness Pack', sessionCount: 8,  price: 6000,  duration: 30 },
    { name: 'Athlete Conditioning', sessionCount: 25, price: 22000, duration: 75 },
    { name: 'Trial PT (3 sessions)',sessionCount: 3,  price: 2500,  duration: 15 },
  ];

  const ptPackages = [];
  for (const pkg of ptPackageDefs) {
    const created = await prisma.ptPackage.create({
      data: { ...pkg, gymId, branchId },
    });
    ptPackages.push(created);
  }
  console.log(`   ✅ ${ptPackages.length} PT packages.`);

  // PT Sessions
  const ptStatuses = ['Completed','Completed','Completed','Scheduled','Cancelled'];
  let ptSessionCount = 0;
  for (const m of members.slice(0, 12)) {
    const trainer = pick(trainers);
    const pkg     = pick(ptPackages);
    const numSessions = rand(3, 8);
    for (let s = 0; s < numSessions; s++) {
      const status = pick(ptStatuses);
      const ptSess = await prisma.ptSession.create({
        data: {
          memberId:    m.id,
          trainerId:   trainer.id,
          packageId:   pkg.id,
          sessionDate: daysAgo(rand(0, 60)),
          status,
          notes:       pick(TRAINER_NOTES),
          gymId,
          branchId,
        },
      });
      if (status === 'Completed') {
        await prisma.ptCommission.create({
          data: {
            trainerId: trainer.id,
            sessionId: ptSess.id,
            amount:    200,
            date:      ptSess.sessionDate,
            gymId,
            branchId,
          },
        });
      }
      ptSessionCount++;
    }
  }
  console.log(`   ✅ ${ptSessionCount} PT sessions.`);

  // Trainer Attendance (last 30 days)
  let taCount = 0;
  for (const t of trainers) {
    const workDays = rand(18, 27);
    const daysSeen = new Set();
    while (daysSeen.size < workDays) { daysSeen.add(rand(0, 29)); }
    for (const d of daysSeen) {
      const date         = daysAgo(d);
      const checkInHour  = rand(6, 9);
      const checkInTime  = new Date(date);
      checkInTime.setHours(checkInHour, pick([0,15,30,45]), 0, 0);
      const workHours    = randFloat(6, 10);
      const checkOutTime = new Date(checkInTime.getTime() + workHours * 3600 * 1000);

      await prisma.trainerAttendance.create({
        data: {
          trainerId:    t.id,
          date,
          checkInTime,
          checkOutTime,
          workingHours: workHours,
          gymId,
          branchId,
        },
      });
      taCount++;
    }
  }
  console.log(`   ✅ ${taCount} trainer attendance records.`);

  // Payroll (current month + last month)
  const now      = new Date();
  const months   = [
    { month: now.getMonth() + 1, year: now.getFullYear() },
    { month: now.getMonth() === 0 ? 12 : now.getMonth(), year: now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear() },
  ];
  let payrollCount = 0;
  for (const t of trainers) {
    for (const { month, year } of months) {
      const existing = await prisma.payroll.findFirst({ where: { trainerId: t.id, month, year } });
      if (!existing) {
        const fixed       = t.salary || 25000;
        const commissions = rand(1000, 5000);
        const incentives  = rand(0, 2000);
        await prisma.payroll.create({
          data: {
            trainerId:   t.id,
            month,
            year,
            fixedSalary: fixed,
            commissions,
            incentives,
            totalAmount: fixed + commissions + incentives,
            status:      month < now.getMonth() + 1 ? 'Paid' : 'Pending',
            paymentDate: month < now.getMonth() + 1 ? daysAgo(rand(1,10)) : null,
            gymId,
            branchId,
          },
        });
        payrollCount++;
      }
    }
  }
  console.log(`   ✅ ${payrollCount} payroll entries.`);

  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║   ✅  SEED COMPLETE — Summary         ║');
  console.log('╠══════════════════════════════════════╣');
  console.log(`║  Gym:         ${gym.name.padEnd(22)}║`);
  console.log(`║  Plans:       ${String(plans.length).padEnd(22)}║`);
  console.log(`║  Staff:       ${String(staffRecords.length).padEnd(22)}║`);
  console.log(`║  Members:     ${String(members.length).padEnd(22)}║`);
  console.log(`║  Attendance:  ${String(attendanceCount).padEnd(22)}║`);
  console.log(`║  Payments:    ${String(paymentCount).padEnd(22)}║`);
  console.log(`║  Expenses:    15${' '.repeat(20)}║`);
  console.log(`║  Leads:       15${' '.repeat(20)}║`);
  console.log(`║  Classes:     12${' '.repeat(20)}║`);
  console.log(`║  Assessments: ${String(assessmentCount).padEnd(22)}║`);
  console.log(`║  Workout Tpls:${String(templates.length).padEnd(22)}║`);
  console.log(`║  Diet Plans:  ${String(dietCount).padEnd(22)}║`);
  console.log(`║  PT Packages: ${String(ptPackages.length).padEnd(22)}║`);
  console.log(`║  PT Sessions: ${String(ptSessionCount).padEnd(22)}║`);
  console.log(`║  Payroll:     ${String(payrollCount).padEnd(22)}║`);
  console.log('╠══════════════════════════════════════╣');
  console.log('║  Staff login password: Staff@123      ║');
  console.log('╚══════════════════════════════════════╝\n');

  await prisma.$disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error('\n❌ Seed failed:', e.message);
  console.error(e.stack);
  prisma.$disconnect();
  process.exit(1);
});
