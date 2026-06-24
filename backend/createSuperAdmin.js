const User = require('./models/User');

async function main() {
  const email = 'superadmin@gymcrm.com';
  const password = 'superpassword';

  const existing = await User.findOne({ email });
  if (existing) {
    console.log('Super admin already exists!');
    console.log(`Email: ${email}`);
    console.log(`Password: superpassword (assuming it wasn't changed)`);
    process.exit(0);
    return;
  }

  const user = await User.create({
    name: 'Super Admin',
    email,
    password: password,
    role: 'superadmin',
    gymId: 'SYSTEM'
  });

  console.log('Super admin created successfully!');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
