const axios = require('axios');

async function main() {
    try {
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@fitprime.com',
            password: 'adminpassword123'
        });
        const token = loginRes.data.token;
        console.log('Login successful, token retrieved.');
        
        const membersRes = await axios.get('http://localhost:5000/api/members', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        console.log('--- MEMBERS API RESPONSE ---');
        console.log(JSON.stringify(membersRes.data, null, 2));
        process.exit(0);
    } catch (err) {
        console.error('API call failed:', err.response?.data || err.message);
        process.exit(1);
    }
}

main();
