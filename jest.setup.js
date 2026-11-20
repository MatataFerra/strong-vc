// Screens are tested outside a navigator, so expo-router is replaced with inert equivalents.
jest.mock('expo-router', () => {
  const React = require('react');
  const router = { push: jest.fn(), back: jest.fn(), replace: jest.fn() };
  const Screen = () => null;
  return {
    useRouter: () => router,
    router,
    useLocalSearchParams: () => ({}),
    useFocusEffect: (effect) => React.useEffect(effect, [effect]),
    Link: ({ children }) => children,
    Stack: Object.assign(({ children }) => children ?? null, { Screen }),
    Tabs: Object.assign(({ children }) => children ?? null, { Screen }),
  };
});
