import { type FC, useContext, useEffect, useState, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { HudBlinkContext } from '../index';

type Props = {
	lastUpdateTs: number;
	fontSize: number;
};

export const HudTime: FC<Props> = ({ lastUpdateTs, fontSize }) => {
	const [currentTime, setCurrentTime] = useState('--:--:--');
	const [stale, setStale] = useState(false);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const blinkOpacity = useContext(HudBlinkContext);

	useEffect(() => {
		const updateTime = () => {
			if (lastUpdateTs > 0) {
				const date = new Date(lastUpdateTs);
				const hours = date.getHours().toString().padStart(2, '0');
				const minutes = date.getMinutes().toString().padStart(2, '0');
				const seconds = date.getSeconds().toString().padStart(2, '0');
				setCurrentTime(`${hours}:${minutes}:${seconds}`);

				const elapsed = Date.now() - lastUpdateTs;
				setStale(elapsed > 5000);
			} else {
				setCurrentTime('--:--:--');
				setStale(true);
			}
		};

		updateTime();
		intervalRef.current = setInterval(updateTime, 1000);

		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
		};
	}, [lastUpdateTs]);

	const content = (
		<>
			<Icon
				source="clock-outline"
				size={fontSize * 0.7}
				color={stale ? '#FF4444' : '#FFFFFF'}
			/>
			<Text
				style={[styles.time, { fontSize: fontSize }, stale && styles.stale]}
				numberOfLines={1}
			>
				{currentTime}
			</Text>
		</>
	);

	if (!stale) {
		return <View style={styles.container}>{content}</View>;
	}

	return <Animated.View style={[styles.container, { opacity: blinkOpacity }]}>{content}</Animated.View>;
};

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		justifyContent: 'center',
		gap: 4,
		minWidth: 160,
		alignSelf: 'stretch',
	},
	time: {
		color: '#FFFFFF',
		letterSpacing: -1,
		fontWeight: '700',
		fontVariant: ['tabular-nums'],
		textAlign: 'center',
	},
	stale: {
		color: '#FF4444',
	},
});

