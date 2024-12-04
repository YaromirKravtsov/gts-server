'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.addColumn('user', 'email', {
      type: Sequelize.STRING,
      allowNull: true
    })

    await queryInterface.addColumn('user', 'phone', {
      type: Sequelize.STRING,
      allowNull: true
    })

    await queryInterface.addColumn('application', 'userId', {
      type: Sequelize.INTEGER,
      references: {
        model: 'user',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    })

    await queryInterface.addColumn('application', 'isPresent', {
      type: Sequelize.STRING,
      allowNull: false
    })

    await queryInterface.removeColumn('application', 'playerPhone');
    await queryInterface.removeColumn('application', 'playerName');




  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('user', 'email');
    await queryInterface.removeColumn('user', 'phone');

    await queryInterface.removeColumn('application', 'userId');
    await queryInterface.removeColumn('application', 'isPresent');

    await queryInterface.addColumn('application', 'playerPhone', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('application', 'playerName', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  }
  
};
