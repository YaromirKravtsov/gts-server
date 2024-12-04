
export default {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: './',
  testRegex: '.*\\.spec\\.ts$', // Регулярное выражение для поиска тестов
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'node',
  
};
