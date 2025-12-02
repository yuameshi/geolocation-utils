import Geolocation from '@react-native-community/geolocation';
import { useEffect, useState, useRef, type FC } from 'react';
import { Surface, Icon, Text } from 'react-native-paper';
import { UnitAdapter } from '@utils/unit-adapter';
import { styles } from './styles';
import { useVerticalLayout } from '@hooks/useVerticalLayout';
import { useStoredValue } from '@hooks/useStoredState';
import { haversineDistance } from '@utils/haversine-distance';

export const Distance: FC = () => {
	const verticalLayout = useVerticalLayout();
	const unit = useStoredValue<'Metric' | 'Imperial'>('settings.unit') ?? 'Metric';
	const [distance, setDistance] = useState<number | null>(null);
	const lastCoordsRef = useRef<{ lat: number | null; lon: number | null; accuracy: number | null }>({ lat: null, lon: null, accuracy: null });

	useEffect(() => {
		const watchId = Geolocation.watchPosition(
			position => {
				const { latitude: currLat, longitude: currLon } = position.coords || {};
				if (currLat == null || currLon == null) return;

				if (lastCoordsRef.current.lat !== null && lastCoordsRef.current.lon !== null && lastCoordsRef.current.accuracy !== null) {
					const dist = haversineDistance(lastCoordsRef.current.lat, lastCoordsRef.current.lon, currLat, currLon);
					const acc1 = lastCoordsRef.current.accuracy;
					const acc2 = position.coords.accuracy;
					const avgAcc = (acc1 + acc2) / 2;
					// if deviance is larger than distance, skip
					if (acc1 > dist && acc2 > dist) {
						// skip
					} else {
						// subtract average accuracy from distance
						// dividing by 4 to avoid overcompensation
						const realDist = Math.max(0, dist - avgAcc / 4);
						setDistance(prev => (prev === null ? dist : prev + realDist));
					}
				}
				lastCoordsRef.current = { lat: currLat, lon: currLon, accuracy: position.coords.accuracy };
			},
			error => console.warn('Failed to get FINE location at module Distance: ', error),
			{
				enableHighAccuracy: true,
				distanceFilter: 0,
				interval: 1000,
				fastestInterval: 1000,
				maximumAge: 5000,
			},
		);

		return () => {
			Geolocation.clearWatch(watchId);
		};
	}, []);

	return (
		<Surface
			style={[styles.tile, verticalLayout && styles.tileVertical]}
			elevation={0}
		>
			<Icon
				source={'map-marker-path'}
				size={24}
			/>
			<Text style={styles.label}>Distance</Text>
			<Text style={styles.value}>{distance === null ? '-.-' : UnitAdapter[unit].distance(distance).value.toFixed(1)}</Text>
			<Text style={styles.hint}>{UnitAdapter[unit].distance(distance ?? 0).unit}</Text>
		</Surface>
	);
};
