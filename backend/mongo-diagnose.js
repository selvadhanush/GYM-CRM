const dns = require('dns');
const net = require('net');

const host = 'q-escape.5eedyoj.mongodb.net';
const srv = '_mongodb._tcp.' + host;

console.log('--- Diagnosis Tool ---');

dns.resolveSrv(srv, (err, addresses) => {
    if (err) {
        console.error('❌ DNS SRV Resolution Failed:', err.message);
        console.log('TIP: Your ISP or Network is likely blocking MongoDB SRV records.');
        console.log('SOLUTION: Use the "Old Driver" connection string (Node 2.2.12+) in Atlas.');
    } else {
        console.log('✅ DNS SRV Resolution Success:', addresses.length, 'servers found.');
        addresses.forEach((addr, i) => {
            console.log(`Checking Server ${i}: ${addr.name}:${addr.port}`);
            const socket = new net.Socket();
            socket.setTimeout(2000);
            socket.on('connect', () => {
                console.log(`  ✅ Connection to ${addr.name} Success!`);
                socket.destroy();
            });
            socket.on('error', (e) => {
                console.log(`  ❌ Connection to ${addr.name} Failed: ${e.message}`);
            });
            socket.on('timeout', () => {
                console.log(`  ❌ Connection to ${addr.name} Timed Out.`);
                socket.destroy();
            });
            socket.connect(addr.port, addr.name);
        });
    }
});
