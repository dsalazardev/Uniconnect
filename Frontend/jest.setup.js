// Setup file for Jest

// Mock expo modules
jest.mock('expo-font');
jest.mock('expo-asset');

// Mock @expo/vector-icons — el componente Icon carga fuentes de forma asíncrona
// lo que genera warnings de act() en todos los tests que renderizan iconos
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const MockIcon = ({ name, ...props }) => React.createElement(Text, props, name);
  return new Proxy({}, { get: () => MockIcon });
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
}));

// Mock Expo's import meta registry to fix "import outside scope" error
global.__ExpoImportMetaRegistry = {
  register: jest.fn(),
  get: jest.fn(),
};

// Mock structuredClone if not available
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}
