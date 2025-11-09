import { Animated, StyleSheet, useAnimatedValue } from 'react-native';
import { useEffect, useState, type FC } from 'react';
import { Text } from 'react-native-paper';
import { UnitAdapter } from '@utils/unit-adapter';
import { useStoredValue } from '@hooks/useStoredState';

type Props = {
	speed: number | null;
	accuracy: number | null;
};

export const Speed: FC<Props> = ({ speed, accuracy }) => {
	const opacity = useAnimatedValue(0.75);
	const [idle, setIdle] = useState(true);
	const unit = useStoredValue<'Metric' | 'Imperial'>('settings.unit') ?? 'Metric';

	const toSolid = Animated.timing(opacity, {
		toValue: 1,
		duration: 750,
		useNativeDriver: true,
	});

	const toTranslucent = Animated.timing(opacity, {
		toValue: 0.75,
		duration: 750,
		useNativeDriver: true,
	});

	const flash = Animated.loop(
		Animated.sequence([
			Animated.timing(opacity, {
				toValue: 0.75,
				duration: 750,
				useNativeDriver: true,
			}),
			Animated.timing(opacity, {
				toValue: 0.35,
				duration: 1000,
				useNativeDriver: true,
			}),
			Animated.timing(opacity, {
				toValue: 0.75,
				duration: 1000,
				useNativeDriver: true,
			}),
			Animated.delay(1000),
			Animated.timing(opacity, {
				toValue: 0.75,
				duration: 0,
				useNativeDriver: true,
			}),
		]),
	);

	useEffect(() => {
		// If idle after 2 seconds, start flashing
		const timeoutId =
			idle &&
			setTimeout(() => {
				setIdle(true);
				flash.start();
			}, 2 * 1000);

		return () => {
			timeoutId && clearTimeout(timeoutId);
			// idle is last state here
			if (idle) {
				// Last state is idle, so stop animation and turn solid before active state
				opacity.stopAnimation(() => {
					toSolid.start();
				});
			} else {
				// Last state is active, turn translucent before idle state
				toTranslucent.start();
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [idle]);

	useEffect(() => {
		if (speed === null || (accuracy ?? Infinity) > 25) setIdle(true);
		else if (speed !== null && (accuracy ?? Infinity) < 25) setIdle(false);
	}, [speed, accuracy]);

	return (
		<Animated.View style={{ opacity }}>
			<Text style={styles.speed}>{speed === null ? '--.--' : UnitAdapter[unit].speed(speed).toFixed(1)}</Text>
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	speed: {
		fontSize: 72,
		fontWeight: '800',
		lineHeight: 80,
	},
});

export default Speed;
