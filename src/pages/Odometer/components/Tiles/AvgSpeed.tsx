import Geolocation from '@react-native-community/geolocation';
import { useEffect, useRef, useState, type FC } from 'react';
import { Surface, Icon, Text } from 'react-native-paper';
import { UnitAdapter } from '@utils/unit-adapter';
import { styles } from './styles';
import { useVerticalLayout } from '@hooks/useVerticalLayout';
import { useStoredValue } from '@hooks/useStoredState';

export const AvgSpeed: FC = () => {
	const verticalLayout = useVerticalLayout();
	const startTs = (parseInt(useStoredValue('session.appStartedAt') || '0', 10) ?? 0) / 1000;
	const unit = useStoredValue<'Metric' | 'Imperial'>('settings.unit') ?? 'Metric';
	const [avgSpeed, setAvgSpeed] = useState(0);
	// use this to store last speed when speed is null
	const lastSpeed = useRef(0);

	useEffect(() => {
		const watchId = Geolocation.watchPosition(
			geolocation => {
				const nowTs = geolocation.timestamp / 1000;
				const timeDiff = nowTs - startTs;
				if (timeDiff > 0) {
					const prevTotalSpeed = avgSpeed * (timeDiff - 1);
					const newTotalSpeed = prevTotalSpeed + (geolocation.coords.speed || lastSpeed.current);
					const newAvgSpeed = newTotalSpeed / timeDiff;
					setAvgSpeed(newAvgSpeed);
					lastSpeed.current = geolocation.coords.speed ?? lastSpeed.current;
				}
			},
			error => console.warn('Error getting FINE location at AvgSpeed Module: ', error),
			{
				enableHighAccuracy: true,
				distanceFilter: 0,
				interval: 1000,
				fastestInterval: 1000,
			},
		);
		return () => {
			Geolocation.clearWatch(watchId);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<Surface
			style={[styles.tile, verticalLayout && styles.tileVertical]}
			elevation={0}
		>
			<Icon
				source={'speedometer-medium'}
				size={24}
			/>
			<Text style={styles.label}>Avg. Speed</Text>
			<Text style={styles.value}>{avgSpeed === null ? '-.-' : UnitAdapter[unit].speed(avgSpeed).toFixed(1)}</Text>
			<Text style={styles.hint}>{UnitAdapter[unit].units.speed}</Text>
		</Surface>
	);
};
