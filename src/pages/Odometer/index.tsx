import { useEffect, useState } from 'react';
import { Surface, Text, useTheme } from 'react-native-paper';
import { ScrollView, StyleSheet, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Geolocation, { type GeolocationResponse } from '@react-native-community/geolocation';
import { UnitAdapter } from '@utils/unit-adapter';
import { useVerticalLayout } from '@hooks/useVerticalLayout';
import { Location } from './components/Location';
import { Heading } from './components/Tiles/Heading';
import { Altitude } from './components/Tiles/Altitude';
import { Accuracy } from './components/Tiles/Accuracy';
import { Satellites } from './components/Tiles/Satellites';
import { Accelerometer } from './components/Accelerometer';
import Speed from './components/Speed';
import { useStored } from '@hooks/useStoredState';
import { OverallData } from './components/OverallData';

export const Odometer = () => {
	const verticalLayout = useVerticalLayout();
	const safeArea = useSafeAreaInsets();
	const dimensions = useWindowDimensions();
	const {
		colors: { background },
	} = useTheme();

	const [time, setTime] = useState('00:00:00');
	const [lastUpdateTs, setLastUpdateTs] = useState(0);
	const [speed, setSpeed] = useState<number | null>(null);
	const [latitude, setLatitude] = useState<number | null>(null);
	const [longitude, setLongitude] = useState<number | null>(null);
	const [accuracy, setAccuracy] = useState<number | null>(null);
	const [altitude, setAltitude] = useState<number | null>(null);
	const [altitudeAccuracy, setAltitudeAccuracy] = useState<number | null>(null);
	const [satelliteCount, setSatelliteCount] = useState(0);
	const [storedUnit, setStoredUnit] = useStored<'Metric' | 'Imperial'>('settings.unit');
	const [unit, setUnit] = useState<'Metric' | 'Imperial'>(storedUnit ?? 'Metric');

	useEffect(() => {
		console.log('Setting stored unit to:', unit);
		setStoredUnit(unit);
	}, [unit, setStoredUnit]);

	const processGeolocation = (position: GeolocationResponse) => {
		setLastUpdateTs(position.timestamp);
		const date = new Date(position.timestamp);
		const hours = date.getHours().toString().padStart(2, '0');
		const minutes = date.getMinutes().toString().padStart(2, '0');
		const seconds = date.getSeconds().toString().padStart(2, '0');
		setTime(`${hours}:${minutes}:${seconds}`);
		setSpeed(position.coords.speed ?? null);
		setLatitude(position.coords.latitude ?? null);
		setLongitude(position.coords.longitude ?? null);
		setAltitude(position.coords.altitude ?? null);
		setAltitudeAccuracy(position.coords.altitudeAccuracy ?? null);
		setAccuracy(position.coords.accuracy ?? null);
		// @ts-ignore
		setSatelliteCount(position.extras.satellites ?? 0);
		// @ts-ignore
		if (position.extras.satellitesView !== undefined) setSatelliteCount(`${position.extras.satellites} (${position.extras.satellitesView})`);
	};

	useEffect(() => {
		const watchId = Geolocation.watchPosition(
			position => processGeolocation(position),
			error => console.warn('Failed to get FINE location at module Odometer: ', error),
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
				error => {
					console.warn('Failed to get COARSE location as fallback at module Odometer: ', error);
					console.warn('Last position update was at ', new Date(lastUpdateTs).toLocaleTimeString());
					console.warn('Cleaning up location data...');
					setSpeed(null);
					setLatitude(null);
					setLongitude(null);
					setAltitude(null);
					setAltitudeAccuracy(null);
					setAccuracy(null);
					setSatelliteCount(0);
				},
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
			<ScrollView
				snapToAlignment="start"
				snapToInterval={dimensions.height}
				showsVerticalScrollIndicator={false}
			>
				<View
					style={[
						verticalLayout ? styles.containerVertical : styles.container,
						{
							minHeight: dimensions.height - safeArea.top - safeArea.bottom,
							minWidth: dimensions.width - safeArea.left - safeArea.right,
						},
					]}
				>
					{/* Left column */}
					<View style={verticalLayout ? styles.sideColumnVertical : styles.sideColumn}>
						<Satellites count={satelliteCount} />
						<Accuracy accuracy={accuracy} />
					</View>

					{/* Center column */}
					<Surface
						style={styles.centerTile}
						elevation={0}
					>
						<Text style={styles.time}>{time}</Text>
						<TouchableOpacity
							style={styles.speedContainer}
							onPress={() => setUnit(unit === 'Metric' ? 'Imperial' : 'Metric')}
						>
							<Speed
								accuracy={accuracy}
								speed={speed}
							/>
							<Text style={styles.unit}>{UnitAdapter[unit].units.speed}</Text>
						</TouchableOpacity>
						<View style={styles.coordinatesContainer}>
							{speed !== null && (
								<>
									<Text style={styles.coordinates}>
										{UnitAdapter[unit].speedLite(speed).toFixed(1)} {UnitAdapter[unit].units.speedLite}
									</Text>
									<Text style={styles.coordinatesSeparator}>·</Text>
								</>
							)}
							<Text style={[styles.coordinates, speed !== null ? styles.coordinatesRight : styles.exclusiveCoordinates]}>
								<Accelerometer />
							</Text>
						</View>
						<Location
							latitude={latitude}
							longitude={longitude}
						/>
					</Surface>

					{/* Right column */}
					<View style={verticalLayout ? styles.sideColumnVertical : styles.sideColumn}>
						<Altitude
							altitude={altitude}
							altitudeAccuracy={altitudeAccuracy}
						/>
						<Heading />
					</View>
				</View>
				<OverallData />
			</ScrollView>
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
	time: {
		fontSize: 18,
		opacity: 0.8,
		marginBottom: 8,
	},
	speedContainer: {
		alignItems: 'center',
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
	exclusiveCoordinates: {
		textAlign: 'center',
	},
});
