const dns = require('dns');
const mongoose = require('mongoose');

// Point to Google DNS to bypass local network restrictions
dns.setServers(['8.8.8.8', '8.8.4.4']);

const host = 'cluster0.7lvmf.mongodb.net';
const srv = '_mongodb._tcp.' + host;

console.log('--- Attempting DNS Bypass Resolution ---');

dns.resolveSrv(srv, (err, addresses) => {
    if (err) {
        console.error('❌ Even Google DNS failed:', err.message);
        process.exit(1);
    } else {
        console.log('✅ Resolved using Google DNS!');
        addresses.forEach(a => console.log(`- ${a.name}:${a.port}`));
        process.exit(0);
    }
});
