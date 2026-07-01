const axios = require('axios');

async function main() {
    try {
        const res = await axios.get('http://localhost:5000/api/branches');
        console.log('Server responded:', res.status);
    } catch (err) {
        console.log('Server responded with expected auth error:', err.response ? err.response.status : err.message);
    }
    process.exit(0);
}
main();
