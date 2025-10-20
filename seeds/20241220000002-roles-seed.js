'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('roles', [
      {
        slug: 'admin',
        description: 'Administrador del sistema',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        slug: 'user',
        description: 'Usuario estándar',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        slug: 'moderator',
        description: 'Moderador',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('roles', null, {});
  }
};
