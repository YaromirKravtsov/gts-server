'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('training_dates', 'adminComment', {
      type: Sequelize.TEXT,
      allowNull: true, 
    });

    await queryInterface.addColumn('application', 'adminComment', {
      type: Sequelize.TEXT,
      allowNull: true, 
    });

    await queryInterface.addColumn('user', 'adminComment', {
      type: Sequelize.TEXT,
      allowNull: true, 
    });

    
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('user', 'adminComment');
    await queryInterface.removeColumn('application', 'adminComment');
    await queryInterface.removeColumn('training_dates', 'adminComment')
  }
  
};
