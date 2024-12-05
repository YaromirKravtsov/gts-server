'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    queryInterface.changeColumn('application','isPresent',{
      type: Sequelize.BOOLEAN,
      allowNull:true
    } )
  },

  async down (queryInterface, Sequelize) {
    queryInterface.changeColumn('application','isPresent',{
      type: Sequelize.BOOLEAN,
      allowNull:false
    } )
  }
};
