'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('training_dates', 'adminComment', {
      type: Sequelize.STRING, // Укажите тип данных
      allowNull: true, 
      defaultValue: null, 
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('training_dates', 'adminComment');
  },
};
