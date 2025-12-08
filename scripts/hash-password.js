const bcryptjs = require('bcryptjs');

async function hashPassword(password) {
  try {
    if (!password) {
      console.error('Please provide a password as argument');
      console.log('Usage: node hash-password.js "your-password"');
      process.exit(1);
    }

    const salt = await bcryptjs.genSalt(10);
    const hash = await bcryptjs.hash(password, salt);
    
    console.log('\n=== Password Hash ===');
    console.log('Password:', password);
    console.log('Hash:', hash);
    console.log('\nUse this hash in your SQL insert statement');
    console.log('===================\n');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

const password = process.argv[2];
hashPassword(password);
