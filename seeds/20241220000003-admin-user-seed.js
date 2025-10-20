'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('messengerbrain!@.', 12);
    
    await queryInterface.bulkInsert('users', [
      {
        name: 'Administrador',
        email: 'admin@messengerbrain.com',
        password: hashedPassword,
        status_id: 1, // active
        free_trial: false,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});

    // Assign admin role to the admin user
    await queryInterface.bulkInsert('user_roles', [
      {
        user_id: 1,
        role_id: 1, // admin role
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('user_roles', null, {});
    await queryInterface.bulkDelete('users', null, {});
  }
};
