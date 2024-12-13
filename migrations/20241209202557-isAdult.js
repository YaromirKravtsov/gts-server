'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Добавление нового поля
    await queryInterface.addColumn('group', 'isToAdult', {
      type: Sequelize.BOOLEAN, // Укажите тип данных
      allowNull: true, 
      defaultValue: null, 
    });
  },

  async down(queryInterface, Sequelize) {
    // Удаление нового поля
    await queryInterface.removeColumn('group', 'isToAdult');
  },
};
