'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('training_dates', 'trainerId', {
      type: Sequelize.INTEGER,
      allowNull: true, 
      references: {
        model: 'user', 
        key: 'id', 
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL', // При удалении user поле trainerId будет сброшено в NULL
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('training_dates', 'trainerId');
  },
};
