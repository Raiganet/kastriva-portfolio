const crypto = require('node:crypto');
console.log('SESSION_SECRET=' + crypto.randomBytes(32).toString('hex'));
