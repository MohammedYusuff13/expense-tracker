import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StoreProvider, useStore } from './src/store';
import { C } from './src/theme';
import Welcome from './src/screens/Welcome';
import Home from './src/screens/Home';
import TransactionForm from './src/screens/TransactionForm';
import RecordForm from './src/screens/RecordForm';
import RecordList from './src/screens/RecordList';
import Search from './src/screens/Search';
import Reports from './src/screens/Reports';
import Settings from './src/screens/Settings';

const Stack = createNativeStackNavigator();
const opts = { headerStyle: { backgroundColor: C.bg }, headerTitleStyle: { color: C.ink, fontWeight: '700' as const }, headerShadowVisible: false };

function Root() {
  const { ready, config } = useStore();
  if (!ready) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator size="large" color={C.accent} /></View>;
  return (
    <Stack.Navigator screenOptions={opts}>
      {!config ? (
        <Stack.Screen name="Welcome" component={Welcome} options={{ headerShown: false }} />
      ) : (
        <>
          <Stack.Screen name="Home" component={Home} options={{ title: 'ExpenseTracker Pro' }} />
          <Stack.Screen name="TransactionForm" component={TransactionForm} options={({ route }: any) => ({ title: route.params?.id ? 'Edit entry' : route.params?.type === 'Income' ? 'Add income' : 'Add expense' })} />
          <Stack.Screen name="RecordForm" component={RecordForm} options={({ route }: any) => ({ title: route.params.kind === 'borrowed' ? 'Borrowed money' : 'Lent money' })} />
          <Stack.Screen name="RecordList" component={RecordList} options={({ route }: any) => ({ title: route.params.kind === 'borrowed' ? 'Borrowed money' : 'Lent money' })} />
          <Stack.Screen name="Search" component={Search} options={{ title: 'Search and filter' }} />
          <Stack.Screen name="Reports" component={Reports} />
          <Stack.Screen name="Settings" component={Settings} />
          <Stack.Screen name="Setup" component={Welcome} options={{ title: 'Change Excel file' }} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StoreProvider><NavigationContainer><StatusBar style="dark" /><Root /></NavigationContainer></StoreProvider>
    </SafeAreaProvider>
  );
}
