/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createContext, createElement, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from '@react-native-community/geolocation';

import { Odometer } from './pages/Odometer';
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

	useEffect(() => {
		AsyncStorage.setItem('session.appStartedAt', Date.now().toString());
		Geolocation.getCurrentPosition(position => {
			AsyncStorage.setItem('session.appStartedPosition.longitude', position.coords.longitude.toString());
			AsyncStorage.setItem('session.appStartedPosition.latitude', position.coords.latitude.toString());
		});

		return () => {
			AsyncStorage.removeItem('session.appStartedAt');
			AsyncStorage.removeItem('session.appStartedPosition.longitude');
			AsyncStorage.removeItem('session.appStartedPosition.latitude');
		};
	}, []);

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
