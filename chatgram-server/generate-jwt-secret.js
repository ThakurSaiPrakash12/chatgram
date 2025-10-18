// Generate a secure random JWT secret for production
// Run this with: node generate-jwt-secret.js

const crypto = require('crypto');

console.log('\n🔐 Secure JWT Secret Generator\n');
console.log('━'.repeat(80));

// Generate a 64-byte random string
const jwtSecret = crypto.randomBytes(64).toString('hex');

console.log('\n✅ Your secure JWT secret:\n');
console.log(jwtSecret);
console.log('\n━'.repeat(80));
console.log('\n📋 Copy this value and add it to your environment variables:');
console.log(`   - In Render: Add as JWT_SECRET environment variable`);
console.log(`   - In local .env: JWT_SECRET=${jwtSecret}`);
console.log('\n⚠️  KEEP THIS SECRET! Never commit it to GitHub!\n');
