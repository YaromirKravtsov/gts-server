'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn('user', 'role', {
      type: Sequelize.STRING,
      unique: false
    });

    await queryInterface.changeColumn('user', 'password', {
      type: Sequelize.STRING,
      unique: false
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.changeColumn('user', 'role', {
      type: Sequelize.STRING,
      unique: true
    });

    await queryInterface.changeColumn('user', 'password', {
      type: Sequelize.STRING,
      unique: true
    });
  }
};
