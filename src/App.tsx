/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Odometer } from './pages/Odometer';
import { createContext, createElement, useState } from 'react';
import { Satellites } from './pages/Satellites';

export const RouterContext = createContext<{
	route: string;
	setRoute: (route: string) => void;
	routes: { [key: string]: React.ComponentType<any> };
} | null>(null);

function App() {
	const isDarkMode = useColorScheme() === 'dark';
	const theme = isDarkMode ? MD3DarkTheme : MD3LightTheme;
	const [route, setRoute] = useState('Odometer');

	const routes: { [key: string]: React.ComponentType<any> } = {
		Odometer: Odometer,
		Satellites: Satellites,
	};

	return (
		<PaperProvider theme={theme}>
			<SafeAreaProvider>
				<StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
				<RouterContext.Provider value={{ route, setRoute, routes }}>
					<>{route && routes[route] ? createElement(routes[route]) : <Odometer />}</>
				</RouterContext.Provider>
			</SafeAreaProvider>
		</PaperProvider>
	);
}

export default App;
