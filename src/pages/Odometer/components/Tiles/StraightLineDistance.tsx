import { useEffect, useState, type FC } from 'react';
import { Surface, Icon, Text } from 'react-native-paper';
import { UnitAdapter } from '@utils/unit-adapter';
import { styles } from './styles';
import { useVerticalLayout } from '@hooks/useVerticalLayout';
import { useStoredValue } from '@hooks/useStoredState';
import Geolocation from '@react-native-community/geolocation';
import { haversineDistance } from '@utils/haversineDistance';

export const StraightLineDistance: FC = () => {
	const verticalLayout = useVerticalLayout();
	const unit = useStoredValue<'Metric' | 'Imperial'>('settings.unit') ?? 'Metric';
	const [currentLatitude, setCurrentLatitude] = useState(0);
	const [currentLongitude, setCurrentLongitude] = useState(0);
	const latitude = useStoredValue('session.appStartedPosition.latitude') ?? '0';
	const longitude = useStoredValue('session.appStartedPosition.longitude') ?? '0';
	const [distance, setDistance] = useState<number | null>(null);

	useEffect(() => {
		const watchId = Geolocation.watchPosition(
			position => {
				setCurrentLatitude(position.coords.latitude);
				setCurrentLongitude(position.coords.longitude);
			},
			() => null,
			{
				enableHighAccuracy: true,
				distanceFilter: 1,
				interval: 1000,
				fastestInterval: 1000,
				maximumAge: 5000,
			},
		);

		return () => {
			Geolocation.clearWatch(watchId);
		};
	}, []);

	useEffect(() => {
		const latitudeNum = parseFloat(latitude);
		const longitudeNum = parseFloat(longitude);

		if (isNaN(latitudeNum) || isNaN(longitudeNum)) {
			setDistance(null);
			return;
		}

		const d = haversineDistance(latitudeNum, longitudeNum, currentLatitude, currentLongitude);

		setDistance(d);
	}, [latitude, longitude, currentLatitude, currentLongitude]);

	return (
		<Surface
			style={[styles.tile, verticalLayout && styles.tileVertical]}
			elevation={0}
		>
			<Icon
				source={'map-marker-distance'}
				size={24}
			/>
			<Text style={styles.label}>Crow Flies</Text>
			<Text style={styles.value}>{distance === null ? '-.-' : UnitAdapter[unit].distance(distance).value.toFixed(1)}</Text>
			<Text style={styles.hint}>{UnitAdapter[unit].distance(distance ?? 0).unit}</Text>
		</Surface>
	);
};
