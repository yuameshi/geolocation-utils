import { useEffect, useRef, useState } from 'react';
import { Icon, Surface, Text, useTheme } from 'react-native-paper';
import { Platform, StyleSheet, ToastAndroid, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { reverseGeocodeLocation } from 'react-native-geocoder-sdk';
import Geolocation, { type GeolocationResponse } from '@react-native-community/geolocation';
import CompassHeading from 'react-native-compass-heading';
import { accelerometer, gravity, SensorTypes, setUpdateIntervalForType } from 'react-native-sensors';
import { UnitAdapter } from '../utils/unit-adapter';
import { parseRadius } from '../utils/parse-radius';

export const Odometer = () => {
	const dimensions = useWindowDimensions();
	const useVerticalLayout = dimensions.width < 600;
	const safeArea = useSafeAreaInsets();
	const {
		colors: { background },
	} = useTheme();

	const [time, setTime] = useState('00:00:00');
	const [lastUpdateTs, setLastUpdateTs] = useState(0);
	const [speed, setSpeed] = useState(0);
	const gravityRef = useRef({ x: 0, y: 0, z: 0 });
	const [accelerationMagnitude, setAcceleratedMagnitude] = useState(0);
	const [showLocation, setShowLocation] = useState(true);
	const [latitude, setLatitude] = useState('0 0\' 0.0"');
	const [longitude, setLongitude] = useState('0 0\' 0.0"');
	const [latHemisphere, setLatHemisphere] = useState<'N' | 'S'>('N');
	const [lonHemisphere, setLonHemisphere] = useState<'E' | 'W'>('E');
	const [addressLine, setAddressLine] = useState<string | null>(null);
	const [accuracy, setAccuracy] = useState(0);
	const [altitude, setAltitude] = useState(0);
	const [altitudeAccuracy, setAltitudeAccuracy] = useState<number | null>(null);
	const [satelliteCount, setSatelliteCount] = useState(0);
	const [unit, setUnit] = useState<'Metric' | 'Imperial'>('Metric');
	const [heading, setHeading] = useState(0);
	const headingDeg = Math.round((heading || 0) % 360);
	const dir8 = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N'];
	const headingCardinal = dir8[Math.round(headingDeg / 45)];

	useEffect(() => {
		Geolocation.setRNConfiguration({
			skipPermissionRequests: false,
			authorizationLevel: 'always',
			enableBackgroundLocationUpdates: true,
			locationProvider: 'auto',
		});
		Geolocation.requestAuthorization(
			() => {
				console.log('Access for geolocation was granted.');
			},
			error => {
				console.warn('Access for geolocation was denied.', error);
			},
		);
	}, []);

	useEffect(() => {
		// 20 Hz update rate (50 ms interval）
		setUpdateIntervalForType(SensorTypes.accelerometer, 50);
		setUpdateIntervalForType(SensorTypes.gravity, 50);
		const alpha = 0.9;
		const gravitySub = gravity.subscribe(({ x, y, z }) => {
			gravityRef.current.x = alpha * gravityRef.current.x + (1 - alpha) * x;
			gravityRef.current.y = alpha * gravityRef.current.y + (1 - alpha) * y;
			gravityRef.current.z = alpha * gravityRef.current.z + (1 - alpha) * z;
		});

		const accelerometerSub = accelerometer.subscribe(({ x, y, z }) => {
			const linearAccelerationX = x - gravityRef.current.x;
			const linearAccelerationY = y - gravityRef.current.y;
			const linearAccelerationZ = z - gravityRef.current.z;

			const magnitude = Math.sqrt(linearAccelerationX * linearAccelerationX + linearAccelerationY * linearAccelerationY + linearAccelerationZ * linearAccelerationZ);
			const linearAcceleration = Platform.OS === 'ios' ? magnitude * 9.80665 : magnitude;

			setAcceleratedMagnitude(Math.max(0, linearAcceleration - 0.1)); // Subtracting a small threshold to filter out noise
		});

		return () => {
			gravitySub.unsubscribe();
			accelerometerSub.unsubscribe();
		};
	}, []);

	useEffect(() => {
		CompassHeading.start(0, (headingInfo: { heading: number; accuracy: number }) => {
			setHeading(headingInfo.heading);
		});

		return () => CompassHeading.stop();
	}, []);

	const processGeolocation = (position: GeolocationResponse) => {
		setLastUpdateTs(position.timestamp);
		const date = new Date(position.timestamp);
		const hours = date.getHours().toString().padStart(2, '0');
		const minutes = date.getMinutes().toString().padStart(2, '0');
		const seconds = date.getSeconds().toString().padStart(2, '0');
		setTime(`${hours}:${minutes}:${seconds}`);
		setSpeed(position.coords.speed ?? 0);
		setLatitude(parseRadius(position.coords.latitude));
		setLongitude(parseRadius(position.coords.longitude));
		reverseGeocodeLocation({
			latitude: position.coords.latitude,
			longitude: position.coords.longitude,
		})
			.then(res => {
				if (Platform.OS === 'android') {
					if (res.addressLine && res.locality) {
						// If locality appears multiple times in addressLine, remove all but the last occurrence
						if (res.addressLine.indexOf(res.locality) !== res.addressLine.lastIndexOf(res.locality)) {
							const parts = res.addressLine.split(res.locality);
							// Remove empty parts and join the rest
							setAddressLine(
								parts
									.filter((part: string) => part.trim() !== '')
									.join(res.locality)
									.trim(),
							);
						} else {
							setAddressLine(res.addressLine);
						}
					} else if (res.addressLine) {
						setAddressLine(res.addressLine);
					} else if (res.locality) {
						setAddressLine(res.locality);
					}
				} else if (Platform.OS === 'ios') {
					const parts = [];
					if (res.name) parts.push(res.name);
					if (res.locality) parts.push(res.locality);
					if (res.administrativeArea && res.administrativeArea !== res.locality) parts.push(res.administrativeArea);
					if (res.country) parts.push(res.country);
					if (parts.length > 0) {
						setAddressLine(parts.join(', '));
					}
				} else {
					setAddressLine(null);
				}
			})
			.catch(err => {
				console.warn(err);
				setAddressLine(null);
			});
		setLatHemisphere(position.coords.latitude >= 0 ? 'N' : 'S');
		setLonHemisphere(position.coords.longitude >= 0 ? 'E' : 'W');
		setAltitude(position.coords.altitude ?? 0);
		setAltitudeAccuracy(position.coords.altitudeAccuracy ?? null);
		setAccuracy(position.coords.accuracy ?? 0);
		// @ts-ignore
		setSatelliteCount(position.extras.satellites || 0);
		// @ts-ignore
		if (position.extras.satellitesView !== undefined) setSatelliteCount(`${position.extras.satellites} (${position.extras.satellitesView})`);
	};

	useEffect(() => {
		const watchId = Geolocation.watchPosition(
			position => processGeolocation(position),
			error => console.warn('[GPS] Failed to get position: ', error),
			{
				enableHighAccuracy: true,
				interval: 200,
				maximumAge: 100,
				distanceFilter: 0,
			},
		);

		return () => Geolocation.clearWatch(watchId);
	}, []);

	useEffect(() => {
		const intervalId = setInterval(() => {
			console.warn('Geolocation data expired, using NETWORK provider.');
			Geolocation.getCurrentPosition(
				position => processGeolocation(position),
				error => console.warn('[NETWORK] Failed to get position: ', error),
				{
					enableHighAccuracy: false,
					maximumAge: 5 * 1000,
					distanceFilter: 0,
				},
			);
		}, 10 * 1000);

		return () => clearInterval(intervalId);
	}, [lastUpdateTs]);

	return (
		<View
			style={[
				styles.root,
				{
					backgroundColor: background,
					paddingTop: safeArea.top,
					paddingBottom: safeArea.bottom,
					paddingLeft: safeArea.left,
					paddingRight: safeArea.right,
				},
			]}
		>
			<View style={useVerticalLayout ? styles.containerVertical : styles.container}>
				{/* Left column */}
				<View style={useVerticalLayout ? styles.sideColumnVertical : styles.sideColumn}>
					<Surface
						style={[styles.tile, useVerticalLayout ? styles.tileVertical : undefined]}
						elevation={0}
					>
						<Icon
							source="satellite-variant"
							size={24}
						/>
						<Text style={styles.label}>Satellites</Text>
						<Text style={styles.value}>{satelliteCount}</Text>
						<Text style={styles.hint}>in view</Text>
					</Surface>
					<Surface
						style={[styles.tile, useVerticalLayout ? styles.tileVertical : undefined]}
						elevation={0}
					>
						{accuracy >= 25 ? (
							<Icon
								source={'crosshairs'}
								size={24}
							/>
						) : (
							<Icon
								source={'crosshairs-gps'}
								size={24}
							/>
						)}
						<Text style={styles.label}>Accuracy</Text>
						<Text style={styles.value}>{UnitAdapter[unit].accuracy(accuracy).toFixed(1)}</Text>
						<Text style={styles.hint}>{UnitAdapter[unit].units.accuracy}</Text>
					</Surface>
				</View>

				{/* Center column */}
				<Surface
					style={styles.centerTile}
					elevation={0}
				>
					<Text style={styles.time}>{time}</Text>
					<TouchableOpacity
						style={styles.speedContainer}
						onPress={() => {
							const target = unit === 'Metric' ? 'Imperial' : 'Metric';
							ToastAndroid.show(`Switched to ${target} units`, ToastAndroid.SHORT);
							setUnit(target);
						}}
					>
						<Text style={styles.speed}>{UnitAdapter[unit].speed(speed).toFixed(1)}</Text>
						<Text style={styles.unit}>{UnitAdapter[unit].units.speed}</Text>
					</TouchableOpacity>
					<View style={styles.coordinatesContainer}>
						<Text style={styles.coordinates}>
							{UnitAdapter[unit].speedLite(speed).toFixed(1)} {UnitAdapter[unit].units.speedLite}
						</Text>
						<Text style={styles.coordinatesSeparator}>·</Text>
						<Text style={[styles.coordinates, styles.coordinatesRight]}>
							{UnitAdapter[unit].acceleratedSpeed(accelerationMagnitude).toFixed(1)} {UnitAdapter[unit].units.acceleratedSpeed}
						</Text>
					</View>
					<TouchableOpacity
						style={styles.speedContainer}
						onPress={() => {
							setShowLocation(!showLocation);
							ToastAndroid.show(!showLocation ? 'Showing coordinates/location' : 'Hiding coordinates/location', ToastAndroid.SHORT);
						}}
					>
						{showLocation ? (
							<>
								<View style={styles.coordinatesContainer}>
									<Text style={styles.coordinates}>
										{latitude} {latHemisphere}
									</Text>
									<Text style={styles.coordinatesSeparator}>·</Text>
									<Text style={[styles.coordinates, styles.coordinatesRight]}>
										{longitude} {lonHemisphere}
									</Text>
								</View>
								{addressLine && (
									<View style={styles.addressRow}>
										<View style={styles.addressIcon}>
											<Icon
												source="map-marker"
												size={18}
											/>
										</View>
										<Text style={styles.addressText}>{addressLine}</Text>
									</View>
								)}
							</>
						) : (
							<Text style={styles.locationHidden}>LOCATION HIDDEN</Text>
						)}
					</TouchableOpacity>
				</Surface>

				{/* Right column */}
				<View style={useVerticalLayout ? styles.sideColumnVertical : styles.sideColumn}>
					<Surface
						style={[styles.tile, useVerticalLayout ? styles.tileVertical : undefined]}
						elevation={0}
					>
						<Icon
							source="altimeter"
							size={24}
						/>
						<Text style={styles.label}>Altitude</Text>
						<Text style={styles.value}>
							{UnitAdapter[unit].altitude(altitude).toFixed(1)}
							{altitudeAccuracy && <> ± {UnitAdapter[unit].altitude(altitudeAccuracy).toFixed(1)}</>}
						</Text>
						<Text style={styles.hint}>{UnitAdapter[unit].units.altitude}</Text>
					</Surface>
					<Surface
						style={[[styles.tile, useVerticalLayout ? styles.tileVertical : undefined]]}
						elevation={0}
					>
						<Icon
							source="compass-rose"
							size={24}
						/>
						<Text style={styles.label}>Heading</Text>
						<Text style={styles.value}>{headingDeg}</Text>
						<Text style={styles.hint}>{headingCardinal}</Text>
					</Surface>
				</View>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	container: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'stretch',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	containerVertical: {
		flex: 1,
		alignItems: 'stretch',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	sideColumn: {
		flex: 0.5,
		justifyContent: 'space-between',
	},
	sideColumnVertical: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		gap: 12,
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	centerTile: {
		flex: 2,
		margin: 0,
		borderRadius: 16,
		padding: 0,
		alignItems: 'center',
		justifyContent: 'center',
	},
	tile: {
		borderRadius: 16,
		paddingVertical: 14,
		paddingHorizontal: 12,
		alignItems: 'center',
	},
	tileVertical: {
		flex: 1,
	},
	label: {
		marginTop: 6,
		fontSize: 12,
		opacity: 0.7,
	},
	value: {
		marginTop: 4,
		fontSize: 18,
		fontWeight: '600',
		textTransform: 'uppercase',
	},
	hint: {
		width: '100%',
		textAlign: 'center',
		marginTop: 1,
		fontSize: 12,
		opacity: 0.6,
		textTransform: 'uppercase',
	},
	time: {
		fontSize: 18,
		opacity: 0.8,
		marginBottom: 8,
	},
	speedContainer: {
		alignItems: 'center',
	},
	speed: {
		fontSize: 72,
		fontWeight: '800',
		lineHeight: 80,
	},
	unit: {
		fontSize: 16,
		opacity: 0.8,
		marginBottom: 8,
		textTransform: 'uppercase',
		letterSpacing: 6,
	},
	coordinatesContainer: {
		width: '100%',
		justifyContent: 'space-between',
		marginTop: 10,
		flexDirection: 'row',
		alignItems: 'center',
	},
	coordinatesSeparator: {
		marginHorizontal: 8,
		opacity: 0.6,
	},
	coordinates: {
		flex: 1,
		textAlign: 'right',
		fontSize: 16,
		fontWeight: '600',
		textTransform: 'uppercase',
	},
	coordinatesRight: {
		textAlign: 'left',
	},
	addressRow: {
		marginTop: 10,
		flexDirection: 'row',
		alignItems: 'center',
	},
	addressIcon: {
		marginRight: 6,
		opacity: 0.7,
	},
	addressText: {
		fontSize: 14,
		opacity: 0.9,
	},
	locationHidden: {
		marginTop: 10,
		fontSize: 16,
		fontWeight: 'bold',
		opacity: 0.4,
		letterSpacing: 4,
		textTransform: 'uppercase',
	},
});
