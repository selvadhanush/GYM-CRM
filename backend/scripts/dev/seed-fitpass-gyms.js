/**
 * Seed Script: 5 FitPass Partner Gyms (with 4 HD images each) + FitPass Plans
 * Run: node backend/scripts/seed-fitpass-gyms.js
 */
const prisma = require('../config/prisma');

const GYMS = [
  {
    name: 'Iron Republic Fitness',
    address: 'No. 14, Anna Salai, Triplicane, Chennai - 600005',
    phone: '+91 44 2845 0001',
    email: 'info@ironrepublic.in',
    status: 'Active',
    defaultSessionDurationMinutes: 120,
    images: [
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&auto=format&fit=crop&q=80',
    ],
  },
  {
    name: 'Pulse Fitness Hub',
    address: '3rd Floor, Phoenix Marketcity, Velachery, Chennai - 600042',
    phone: '+91 44 2256 1234',
    email: 'contact@pulsehub.in',
    status: 'Active',
    defaultSessionDurationMinutes: 120,
    images: [
      'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?w=800&auto=format&fit=crop&q=80',
    ],
  },
  {
    name: 'CrossFit Coimbatore',
    address: '7, Avinashi Road, Peelamedu, Coimbatore - 641004',
    phone: '+91 422 2311 444',
    email: 'hello@crossfitcbe.com',
    status: 'Active',
    defaultSessionDurationMinutes: 90,
    images: [
      'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?w=800&auto=format&fit=crop&q=80',
    ],
  },
  {
    name: 'Apex Strength Academy',
    address: '22-B, OMR Road, Sholinganallur, Chennai - 600119',
    phone: '+91 44 2450 0002',
    email: 'support@apexstrength.in',
    status: 'Active',
    defaultSessionDurationMinutes: 120,
    images: [
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1576678927484-cc909957088c?w=800&auto=format&fit=crop&q=80',
    ],
  },
  {
    name: 'FitZone Madurai',
    address: '9, Bypass Road, KK Nagar, Madurai - 625020',
    phone: '+91 452 2348 900',
    email: 'fitzonemdu@gmail.com',
    status: 'Active',
    defaultSessionDurationMinutes: 120,
    images: [
      'https://images.unsplash.com/photo-1623874514711-0f321325f318?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80',
    ],
  },
];

const FITPASS_PLANS = [
  {
    name: 'FitPass Starter',
    duration: 30,
    durationUnit: 'days',
    sessions: 8,
    price: 499,
    gymId: 'SYSTEM',
  },
  {
    name: 'FitPass Standard',
    duration: 30,
    durationUnit: 'days',
    sessions: 16,
    price: 899,
    gymId: 'SYSTEM',
  },
  {
    name: 'FitPass Pro',
    duration: 30,
    durationUnit: 'days',
    sessions: 30,
    price: 1499,
    gymId: 'SYSTEM',
  },
  {
    name: 'FitPass Elite',
    duration: 30,
    durationUnit: 'days',
    sessions: 60,
    price: 2499,
    gymId: 'SYSTEM',
  },
];

async function seed() {
  console.log('\n🏋️  Seeding & Updating FitPass Partner Gyms (4 Images each)...\n');

  for (const gym of GYMS) {
    const existing = await prisma.gym.findFirst({ where: { name: gym.name } });
    if (existing) {
      await prisma.gym.update({
        where: { id: existing.id },
        data: {
          address: gym.address,
          phone: gym.phone,
          email: gym.email,
          images: gym.images,
          status: 'Active',
        },
      });
      console.log(`  🔄 Updated gym images & profile: ${gym.name} (${gym.images.length} images)`);
    } else {
      const created = await prisma.gym.create({ data: gym });
      console.log(`  ✅ Created gym: ${created.name} (${created.id}) with ${created.images.length} images`);
    }
  }

  console.log(`\n📋 Seeding FitPass Plans (gymId = "SYSTEM")...\n`);

  for (const plan of FITPASS_PLANS) {
    const existing = await prisma.plan.findFirst({ where: { name: plan.name, gymId: 'SYSTEM' } });
    if (existing) {
      await prisma.plan.update({
        where: { id: existing.id },
        data: { price: plan.price, sessions: plan.sessions, duration: plan.duration },
      });
      console.log(`  🔄 Updated plan: ${plan.name}`);
    } else {
      const created = await prisma.plan.create({ data: plan });
      console.log(`  ✅ Created plan: ${created.name} — ₹${created.price} / ${created.sessions} sessions`);
    }
  }

  console.log(`\n✨ Done seeding partner gyms and plans!\n`);
  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error('❌ Seed failed:', e.message);
  prisma.$disconnect();
  process.exit(1);
});
