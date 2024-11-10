module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Добавляем поля для таблицы 'location'
    await queryInterface.addColumn('location', 'visible', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true // Установите значение по умолчанию, если нужно
    });
    await queryInterface.addColumn('location', 'order', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: false // Установите значение по умолчанию, если нужно
    });

    // Добавляем поля для таблицы 'group'
    await queryInterface.addColumn('group', 'visible', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true // Установите значение по умолчанию, если нужно
    });
    await queryInterface.addColumn('group', 'order', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: false // Установите значение по умолчанию, если нужно
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Удаляем поля из таблицы 'location'
    await queryInterface.removeColumn('location', 'visible');
    await queryInterface.removeColumn('location', 'order');

    // Удаляем поля из таблицы 'group'
    await queryInterface.removeColumn('group', 'visible');
    await queryInterface.removeColumn('group', 'order');
  }
};
