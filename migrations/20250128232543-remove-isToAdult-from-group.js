import { QueryInterface, DataTypes } from 'sequelize';

export default {
  up: async (queryInterface) => {
    await queryInterface.changeColumn('confirmation', 'action', {
      type: DataTypes.STRING,
      allowNull: false,
      unique: false, // Убираем уникальность
    });
  },

  down: async (queryInterface) => {
    await queryInterface.changeColumn('confirmation', 'action', {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // Откат к предыдущему состоянию
    });
  }
};
