/* eslint-disable react-native/no-inline-styles */
import { useEffect, useState, useContext, useCallback, type FC } from 'react';
import { BackHandler, Platform, PermissionsAndroid } from 'react-native';
import { View, ScrollView } from 'react-native';
import { Text, useTheme, Surface, Card, Appbar, Portal, Dialog, Button, Switch } from 'react-native-paper';
import { NativeModules, Alert } from 'react-native';
import { RouterContext } from '@/App';
import { SatelliteSkyPlot } from '@/pages/Satellites/components/SkyPlot';
import { SatelliteTable } from '@/pages/Satellites/components/SatelliteTable';
import { Satellite } from './types';

export const Satellites: FC = () => {
	const [satellites, setSatellites] = useState<Satellite[]>([]);
	const [loading, setLoading] = useState(true);
	const [dialogVisible, setDialogVisible] = useState(false);
	const [btRunning, setBtRunning] = useState(false);
	const [connectedClients, setConnectedClients] = useState(0);
	const [btLoading, setBtLoading] = useState(false);
	const [discoverable, setDiscoverable] = useState(false);
	const theme = useTheme();
	const router = useContext(RouterContext);

	const refreshBtStatus = useCallback(async () => {
		try {
			const status = await NativeModules.BluetoothNmeaModule.getServerStatus();
			setBtRunning(status.isRunning);
			setConnectedClients(status.connectedClients);
		} catch (_) {}
	}, []);

	const toggleBluetoothSharing = useCallback(async () => {
		setBtLoading(true);
		try {
			if (btRunning) {
				await NativeModules.BluetoothNmeaModule.stopBluetoothServer();
				setDiscoverable(false);
			} else {
				const granted = await PermissionsAndroid.requestMultiple([
					PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
					PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
				]);
				const connectGranted = granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED;
				const scanGranted = granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED;
				if (!connectGranted || !scanGranted) {
					Alert.alert('Permission required', 'Nearby devices permission is required to start the Bluetooth server.');
					setBtLoading(false);
					return;
				}
				await NativeModules.BluetoothNmeaModule.startBluetoothServer();
			}
			await refreshBtStatus();
		} catch (e: any) {
			console.warn('Bluetooth toggle error:', e?.message || e);
		} finally {
			setBtLoading(false);
		}
	}, [btRunning, refreshBtStatus]);

	const openDialog = useCallback(() => {
		if (Platform.OS === 'android' && (Platform.Version as number) < 31) {
			Alert.alert('Unsupported', 'Bluetooth NMEA sharing requires Android 12 (API 31) or above.');
			return;
		}
		setDialogVisible(true);
		refreshBtStatus();
	}, [refreshBtStatus]);

	const toggleDiscoverable = useCallback(async (value: boolean) => {
		if (value) {
			const granted = await PermissionsAndroid.request(
				PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
			);
			if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
				Alert.alert('Permission required', 'Bluetooth advertise permission is required to enable discoverable mode.');
				return;
			}
		}
		try {
			await NativeModules.BluetoothNmeaModule.setDiscoverable(value);
			setDiscoverable(value);
		} catch (e: any) {
			console.warn('Discoverable toggle error:', e?.message || e);
		}
	}, []);

	useEffect(() => {
		refreshBtStatus();
	}, [refreshBtStatus]);

	useEffect(() => {
		const GNSSModule = NativeModules.GNSSModule;
		const timerRef = { current: null as ReturnType<typeof setInterval> | null };

		// 物理返回键监听
		const handleBack = () => {
			if (router?.setRoute) {
				router.setRoute('Odometer');
				return true;
			}
			return false;
		};
		const backHandlerSub = BackHandler.addEventListener('hardwareBackPress', handleBack);

		const fetchStatus = () => {
			if (GNSSModule && typeof GNSSModule.getGNSSStatus === 'function') {
				const result = GNSSModule.getGNSSStatus();
				if (result && typeof result.then === 'function') {
					result
						.then((status: any) => {
							if (status && Array.isArray(status.satellites)) {
								setSatellites(prev => {
									const prevStr = JSON.stringify(prev);
									const nextStr = JSON.stringify(status.satellites);
									return prevStr !== nextStr ? status.satellites : prev;
								});
							} else {
								setSatellites([]);
								setLoading(false);
							}
							setLoading(false);
						})
						.catch(console.warn);
				} else {
					setSatellites([]);
					setLoading(false);
				}
			} else {
				console.warn('GNSSModule or getGNSSStatus is not available');
				setSatellites([]);
				setLoading(false);
			}
		};

		fetchStatus();
		setLoading(true);
		timerRef.current = setInterval(fetchStatus, 1000);

		return () => {
			if (timerRef.current) clearInterval(timerRef.current);
			backHandlerSub.remove();
		};
	}, [router]);

	return (
		<Surface style={[{ flex: 1, backgroundColor: theme.colors.background, elevation: 2, flexDirection: 'column' }]}>
			<Appbar.Header elevated>
				<Appbar.BackAction onPress={() => router?.setRoute('Odometer')} />
				<Appbar.Content title="Satellites" />
				<Appbar.Action
					icon={btRunning ? 'bluetooth-connect' : 'bluetooth'}
					onPress={openDialog}
				/>
			</Appbar.Header>
			<Portal>
				<Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
					<Dialog.Title>Bluetooth NMEA Share</Dialog.Title>
					<Dialog.Content>
						<Text variant="bodyLarge">Status: {btRunning ? 'Running' : 'Stopped'}</Text>
						<Text variant="bodyMedium" style={{ marginTop: 4 }}>Connected clients: {connectedClients}</Text>
						{btRunning && (
							<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
								<Text variant="bodyMedium">Discoverable</Text>
								<Switch value={discoverable} onValueChange={toggleDiscoverable} />
							</View>
						)}
					</Dialog.Content>
					<Dialog.Actions>
						<Button onPress={() => setDialogVisible(false)}>Close</Button>
						<Button onPress={toggleBluetoothSharing} loading={btLoading} disabled={btLoading}>
							{btRunning ? 'Stop' : 'Start'}
						</Button>
					</Dialog.Actions>
				</Dialog>
			</Portal>
			<ScrollView contentContainerStyle={{ alignItems: 'center' }}>
				<View style={{ height: 16 }} />
				<View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 12, width: '95%', alignSelf: 'center' }}>
					<Surface style={{ flex: 1, marginRight: 8, padding: 12, borderRadius: 12, elevation: 3, alignItems: 'center', backgroundColor: theme.colors.elevation?.level1 ?? theme.colors.surface }}>
						<Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.colors.primary }}>TOTAL</Text>
						<Text style={{ fontSize: 22, fontWeight: 'bold', color: theme.colors.primary }}>{satellites.length}</Text>
					</Surface>
					<Surface style={{ flex: 1, marginLeft: 8, padding: 12, borderRadius: 12, elevation: 3, alignItems: 'center', backgroundColor: theme.colors.elevation?.level1 ?? theme.colors.surface }}>
						<Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.colors.primary }}>IN USE</Text>
						<Text style={{ fontSize: 22, fontWeight: 'bold', color: theme.colors.primary }}>{satellites.filter(s => s.used).length}</Text>
					</Surface>
				</View>
				<Card style={{ marginHorizontal: 16, marginBottom: 12, width: '95%', alignSelf: 'center', elevation: 4 }}>
					<Card.Content>
						{loading ? (
							<View style={{ alignItems: 'center', justifyContent: 'center', height: 180 }}>
								<Text style={{ color: theme.colors.primary, fontSize: 16 }}>Please wait...</Text>
							</View>
						) : (
							<SatelliteSkyPlot satellites={satellites} />
						)}
					</Card.Content>
				</Card>
				<Card style={{ marginHorizontal: 16, flex: 1, width: '95%', alignSelf: 'center', elevation: 4 }}>
					<Card.Content style={{ padding: 0 }}>
						{loading ? (
							<View style={{ alignItems: 'center', justifyContent: 'center', height: 80 }}>
								<Text style={{ color: theme.colors.primary, fontSize: 15 }}>Please wait...</Text>
							</View>
						) : (
							<SatelliteTable satellites={satellites} />
						)}
					</Card.Content>
				</Card>
			</ScrollView>
		</Surface>
	);
};
