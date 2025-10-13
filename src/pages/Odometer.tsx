import { useEffect, useRef, useState } from 'react';
import { Icon, Surface, Text, useTheme } from 'react-native-paper';
import { StyleSheet, ToastAndroid, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Geolocation from '@react-native-community/geolocation';
import CompassHeading from 'react-native-compass-heading';
import { accelerometer, SensorTypes, setUpdateIntervalForType } from 'react-native-sensors';
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
	const [speed, setSpeed] = useState(0);
	const gravity = useRef({ x: 0, y: 0, z: 0 });
	const [acceleratedSpeed, setAcceleratedSpeed] = useState(0);
	const [latitude, setLatitude] = useState('0 0\' 0.0"');
	const [longitude, setLongitude] = useState('0 0\' 0.0"');
	const [latHemisphere, setLatHemisphere] = useState<'N' | 'S'>('N');
	const [lonHemisphere, setLonHemisphere] = useState<'E' | 'W'>('E');
	const [accuracy, setAccuracy] = useState(0);
	const [altitude, setAltitude] = useState(0);
	const [altitudeAccuracy, setAltitudeAccuracy] = useState<number | null>(null);
	const [satelliteCount, setSatelliteCount] = useState(-1);
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
		setUpdateIntervalForType(SensorTypes.accelerometer, 50); // 20 Hz
		const alpha = 0.9;
		const subscription = accelerometer.subscribe(({ x, y, z }) => {
			// gravity filter
			gravity.current.x = alpha * gravity.current.x + (1 - alpha) * x;
			gravity.current.y = alpha * gravity.current.y + (1 - alpha) * y;
			gravity.current.z = alpha * gravity.current.z + (1 - alpha) * z;

			const linear = {
				x: x - gravity.current.x,
				y: y - gravity.current.y,
				z: z - gravity.current.z,
			};

			setAcceleratedSpeed(linear.x * linear.x + linear.y * linear.y + linear.z * linear.z);
		});

		return () => subscription.unsubscribe();
	}, []);

	useEffect(() => {
		CompassHeading.start(0, (headingInfo: { heading: number; accuracy: number }) => {
			setHeading(headingInfo.heading);
		});

		return () => CompassHeading.stop();
	}, []);

	useEffect(() => {
		const watchId = Geolocation.watchPosition(
			position => {
				const date = new Date(position.timestamp);
				const hours = date.getHours().toString().padStart(2, '0');
				const minutes = date.getMinutes().toString().padStart(2, '0');
				const seconds = date.getSeconds().toString().padStart(2, '0');
				setTime(`${hours}:${minutes}:${seconds}`);
				setSpeed(position.coords.speed ?? 0);
				setLatitude(parseRadius(position.coords.latitude));
				setLongitude(parseRadius(position.coords.longitude));
				setLatHemisphere(position.coords.latitude >= 0 ? 'N' : 'S');
				setLonHemisphere(position.coords.longitude >= 0 ? 'E' : 'W');
				setAltitude(position.coords.altitude ?? 0);
				setAltitudeAccuracy(position.coords.altitudeAccuracy ?? null);
				setAccuracy(position.coords.accuracy ?? 0);
				// @ts-ignore
				setSatelliteCount(position.extras.satellites || -1);
				// @ts-ignore
				if (position.extras.satellitesView !== undefined) setSatelliteCount(`${position.extras.satellites} (${position.extras.satellitesView})`);
			},
			error => {
				console.warn(error);
			},
			{
				enableHighAccuracy: true,
				interval: 200,
				maximumAge: 1000,
				distanceFilter: 0,
			},
		);
		return () => Geolocation.clearWatch(watchId);
	}, [unit]);

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
						{accuracy > 30 ? (
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
							{UnitAdapter[unit].acceleratedSpeed(acceleratedSpeed).toFixed(1)} {UnitAdapter[unit].units.acceleratedSpeed}
						</Text>
					</View>
					<View style={styles.coordinatesContainer}>
						<Text style={styles.coordinates}>
							{latitude} {latHemisphere}
						</Text>
						<Text style={styles.coordinatesSeparator}>·</Text>
						<Text style={[styles.coordinates, styles.coordinatesRight]}>
							{longitude} {lonHemisphere}
						</Text>
					</View>
					{/*
						<View style={styles.addressRow}>
							<View style={styles.addressIcon}>
								<Icon
									source="map-marker"
									size={18}
								/>
							</View>
							<Text style={styles.addressText}>东莞市XX镇XX街道</Text>
						</View>
						*/}
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
		flex: 1,
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
		marginHorizontal: 12,
		borderRadius: 16,
		paddingVertical: 20,
		paddingHorizontal: 16,
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
});
