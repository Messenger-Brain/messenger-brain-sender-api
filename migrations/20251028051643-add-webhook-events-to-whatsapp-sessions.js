"use strict";

module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.addColumn("whatsapp_sessions", "webhook_events", {
			type: Sequelize.JSON,
			allowNull: true,
			defaultValue: [],
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.removeColumn("whatsapp_sessions", "webhook_events");
	},
};
