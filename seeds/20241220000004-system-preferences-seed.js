'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('system_preferences', [
      {
        slug: 'max_daily_messages',
        name: 'Máximo de mensajes diarios',
        description: 'Límite máximo de mensajes que puede enviar un usuario por día',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        slug: 'message_delay',
        name: 'Delay entre mensajes',
        description: 'Tiempo de espera entre el envío de mensajes (en milisegundos)',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        slug: 'free_trial_days',
        name: 'Días de prueba gratuita',
        description: 'Número de días que dura la prueba gratuita',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        slug: 'webhook_timeout',
        name: 'Timeout de webhook',
        description: 'Tiempo máximo de espera para respuesta de webhook (en milisegundos)',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('system_preferences', null, {});
  }
};
