'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex');
    
    console.log('====================================');
    console.log('🔑 ADMIN PERSONAL ACCESS TOKEN');
    console.log('====================================');
    console.log('Token:', token);
    console.log('User: admin@messengerbrain.com');
    console.log('====================================');
    console.log('⚠️  IMPORTANT: Save this token securely!');
    console.log('This token will be used for API testing.');
    console.log('====================================\n');

    // Get the personal_token type ID
    const [tokenTypes] = await queryInterface.sequelize.query(
      "SELECT id FROM token_types WHERE slug = 'personal_token' LIMIT 1"
    );

    if (tokenTypes.length === 0) {
      throw new Error('Token type "personal_token" not found. Please run previous seeds first.');
    }

    const tokenTypeId = tokenTypes[0].id;

    // Get admin user ID
    const [users] = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE email = 'admin@messengerbrain.com' LIMIT 1"
    );

    if (users.length === 0) {
      throw new Error('Admin user not found. Please run admin user seed first.');
    }

    const userId = users[0].id;

    // Insert the token
    await queryInterface.bulkInsert('tokens', [
      {
        value: token,
        token_type_id: tokenTypeId,
        user_id: userId,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);

    // Save token to a file for reference
    const tokenFile = path.join(__dirname, '..', 'ADMIN_TOKEN.txt');
    
    const tokenContent = `# Admin Personal Access Token
# Generated: ${new Date().toISOString()}
# User: admin@messengerbrain.com
# 
# Use this token for API testing with Authorization header:
# Authorization: Bearer ${token}
#
# This token is for development/testing purposes only.
# In production, generate new tokens through the API.

${token}
`;

    fs.writeFileSync(tokenFile, tokenContent);
    console.log(`📄 Token saved to: ADMIN_TOKEN.txt\n`);
  },

  async down(queryInterface, Sequelize) {
    // Get the personal_token type ID
    const [tokenTypes] = await queryInterface.sequelize.query(
      "SELECT id FROM token_types WHERE slug = 'personal_token' LIMIT 1"
    );

    if (tokenTypes.length === 0) {
      console.log('Token type not found, skipping deletion.');
      return;
    }

    const tokenTypeId = tokenTypes[0].id;

    // Get admin user ID
    const [users] = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE email = 'admin@messengerbrain.com' LIMIT 1"
    );

    if (users.length === 0) {
      console.log('Admin user not found, skipping deletion.');
      return;
    }

    const userId = users[0].id;

    // Delete the token
    await queryInterface.bulkDelete('tokens', {
      token_type_id: tokenTypeId,
      user_id: userId
    });

    console.log('✅ Admin personal token deleted');

    // Delete the token file
    const tokenFile = path.join(__dirname, '..', 'ADMIN_TOKEN.txt');
    
    if (fs.existsSync(tokenFile)) {
      fs.unlinkSync(tokenFile);
      console.log('📄 Token file deleted');
    }
  }
};
