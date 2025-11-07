export default {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.ts'], // Où trouver les tests
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'], // Fichier pour configuration MongoDB
  };
  