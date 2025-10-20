'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('whatsapp_session_status', [
      {
        slug: 'connecting',
        description: 'Conectando a WhatsApp',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        slug: 'connected',
        description: 'Conectado a WhatsApp',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        slug: 'disconnected',
        description: 'Desconectado de WhatsApp',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        slug: 'failed',
        description: 'Error de conexión',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        slug: 'qr_code',
        description: 'Esperando escaneo de QR',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        slug: 'need_scan',
        description: 'Necesita escanear código QR',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        slug: 'logged_out',
        description: 'Sesión cerrada',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('whatsapp_session_status', null, {});
  }
};
