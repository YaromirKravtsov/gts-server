'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('application', 'deleteKey', {
      type: Sequelize.STRING, // Уникальный идентификатор (UUID)
      allowNull: true, 
    });

    console.log('Column deleteKey added to applications.');
  },

  async down(queryInterface, Sequelize) {
    // Удаляем колонку deleteKey в случае отката миграции
    await queryInterface.removeColumn('application', 'deleteKey');
  },
};
