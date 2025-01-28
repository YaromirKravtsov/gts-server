'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {


    await queryInterface.addColumn('user', 'testMonthFileUrl', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {

    await queryInterface.removeColumn('user', 'testMonthFileUrl');
  },
};
