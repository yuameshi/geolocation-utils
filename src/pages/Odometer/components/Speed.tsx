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
		console.log('Speed idle state changed to: ', idle);
		// If idle after 2 seconds, start flashing
		const timeoutId =
			idle &&
			setTimeout(() => {
				setIdle(true);
				flash.start();
			}, 2 * 1000);

		return () => {
			console.log('Speed idle cleanup for idle state: ', idle);
			timeoutId && clearTimeout(timeoutId);
			// idle is last state here
			if (idle) {
				// Last state is idle, so stop animation and turn solid before active state
				opacity.stopAnimation(() => {
					flash.stop();
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
		console.log('Speed received new speed/accuracy: ', speed, accuracy, ' current idle:', idle);
		if (idle === false && (speed === null || (accuracy ?? Infinity) > 25)) {
			// Only update idle to true if previous state is false
			// to avoid re-triggering animations etc.
			console.log('Speed setting idle to true');
			setIdle(true);
		} else if (idle === true && speed !== null && (accuracy ?? Infinity) < 25) {
			// Same as above, only update if previous state is true
			console.log('Speed setting idle to false');
			setIdle(false);
		}
		// DO NOT add idle to deps array
		// eslint-disable-next-line react-hooks/exhaustive-deps
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
