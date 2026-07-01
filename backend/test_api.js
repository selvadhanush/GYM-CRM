require('dotenv').config();
const axios = require('axios');
const generateToken = require('./utils/generateToken');
const prisma = require('./config/prisma');

async function test() {
    try {
        const superAdmin = await prisma.user.findFirst({ where: { role: 'superadmin' } });
        if (!superAdmin) {
            console.log('No superadmin found');
            return;
        }
        console.log('Found superadmin:', superAdmin.id);
        
        const token = generateToken(superAdmin.id, 'superadmin');
        const res = await axios.get('http://127.0.0.1:5000/api/branches', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'x-gym-id': '05a08fdf-7427-48a5-8b25-e18d5a5668cd'
            }
        });
        console.log('Branches API Response:', JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.error('API Error:', err.response ? err.response.data : err.message);
    } finally {
        prisma.$disconnect();
    }
}
test();
