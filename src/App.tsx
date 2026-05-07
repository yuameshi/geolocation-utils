/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { BackHandler, StatusBar, useColorScheme, PermissionsAndroid, Platform, NativeModules } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createContext, createElement, useEffect, useState } from 'react';
import Geolocation from '@react-native-community/geolocation';
import { storage } from './storage';

import { Odometer } from './pages/Odometer';
import { Satellites } from './pages/Satellites';
import { HUD } from './pages/HUD';

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
		HUD: HUD,
	};

	useEffect(() => {
		Geolocation.setRNConfiguration({
			skipPermissionRequests: false,
			authorizationLevel: 'always',
			enableBackgroundLocationUpdates: true,
		});
		Geolocation.requestAuthorization(
			() => console.log('Access for geolocation was granted.'),
			error => {
				if (error.code === error.PERMISSION_DENIED) {
					console.warn('Access for geolocation was denied, exiting app...', error);
					BackHandler.exitApp();
				}
			},
		);

		storage.set('session.appStartedAt', Date.now().toString());

		// Get initial position
		let intervalId: number;
		Geolocation.getCurrentPosition(
			position => {
				storage.set('session.appStartedPosition.longitude', position.coords.longitude.toString());
				storage.set('session.appStartedPosition.latitude', position.coords.latitude.toString());
			},
			error => {
				// if permission denied, exit app
				if (error.code === error.PERMISSION_DENIED) {
					console.warn('Access for geolocation was denied, exiting app...', error);
					BackHandler.exitApp();
				} else {
					// timeout or position unavailable, try to get network position as fallback
					console.warn('Failed to get FINE location as initial location, trying to use fallback COARSE positioning: ', error);
					Geolocation.getCurrentPosition(
						position => {
							console.warn('Using fallback COARSE location as initial position, will keep retrying.');
							storage.set('session.appStartedPosition.longitude', position.coords.longitude.toString());
							storage.set('session.appStartedPosition.latitude', position.coords.latitude.toString());
						},
						() => {
							console.error('Fatal: Unable to get fallback COARSE geolocation position, exiting app: ', error);
							BackHandler.exitApp();
						},
						{
							enableHighAccuracy: false,
							maximumAge: 5 * 1000,
							timeout: 10 * 1000,
							distanceFilter: 0,
						},
					);

					// auto retry with gps every 5 seconds, when success clear the interval
					// if network positioning has failed, the app will exit before reaching this point
					intervalId = setInterval(() => {
						console.log('Retrying to get FINE location as initial position...');
						Geolocation.getCurrentPosition(
							position => {
								storage.set('session.appStartedPosition.longitude', position.coords.longitude.toString());
								storage.set('session.appStartedPosition.latitude', position.coords.latitude.toString());
								console.log('Successfully got FINE location as initial position on retry, clearing timer.');
								clearInterval(intervalId);
							},
							retryError => console.warn('Failed to get FINE location as initial position, will keep retrying: ', retryError),
							{
								enableHighAccuracy: true,
								maximumAge: 5 * 1000,
								distanceFilter: 0,
							},
						);
					}, 5 * 1000);
				}
			},
			{ enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
		);

		const persistBluetoothNmeaSharingState = async () => {
			if (Platform.OS !== 'android') return;
			if ((Platform.Version as number) < 31) return;
			const stored = storage.getString('settings.bluetoothNmeaEnabled');
			if (stored !== 'true') return;

			const hasLocation = await PermissionsAndroid.check(
				PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
			);
			const hasBtConnect = await PermissionsAndroid.check(
				PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
			);
			const hasBtScan = await PermissionsAndroid.check(
				PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
			);

			if (!hasLocation || !hasBtConnect || !hasBtScan) {
				console.warn('Bluetooth NMEA auto-start skipped: missing permissions.');
				return;
			}

			try {
				await NativeModules.BluetoothNmeaModule.startBluetoothServer();
			} catch (e: any) {
				console.warn('Bluetooth NMEA auto-start failed:', e?.message || e);
			}
		};

		persistBluetoothNmeaSharingState();

		return () => {
			// storage.remove('session.appStartedAt');
			// storage.remove('session.appStartedPosition.longitude');
			// storage.remove('session.appStartedPosition.latitude');
			intervalId && clearInterval(intervalId);
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
