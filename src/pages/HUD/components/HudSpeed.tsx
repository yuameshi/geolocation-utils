import { type FC, useContext } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { UnitAdapter } from '@utils/unit-adapter';
import { useStoredValue } from '@hooks/useStoredState';
import { HudBlinkContext } from '../index';

type Props = {
	speed: number | null;
	fontSize: number;
	unitFontSize: number;
	warning: boolean;
};

export const HudSpeed: FC<Props> = ({ speed, fontSize, unitFontSize, warning }) => {
	const unit = useStoredValue<'Metric' | 'Imperial'>('settings.unit') ?? 'Metric';
	const displaySpeed = speed !== null ? UnitAdapter[unit].speed(speed).toFixed(0) : '--';
	const digitCount = displaySpeed.replace(/[^0-9]/g, '').length;
	const scale = digitCount >= 4 ? 0.6 : digitCount === 3 ? 0.8 : 1;
	const scaledFontSize = fontSize * scale;
	const scaledLineHeight = scaledFontSize * 1.05;
	const blinkOpacity = useContext(HudBlinkContext);

	const content = (
		<>
			<Text style={[styles.speed, { fontSize: scaledFontSize, lineHeight: scaledLineHeight }, warning && styles.warning]}>{displaySpeed}</Text>
			<Text style={[styles.unit, { fontSize: unitFontSize }, warning && styles.warning]}>{UnitAdapter[unit].units.speed}</Text>
		</>
	);

	if (!warning) {
		return <View style={styles.container}>{content}</View>;
	}

	return <Animated.View style={[styles.container, { opacity: blinkOpacity }]}>{content}</Animated.View>;
};

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	speed: {
		color: '#FFFFFF',
		fontWeight: '900',
		letterSpacing: -5,
		fontVariant: ['tabular-nums'],
	},
	unit: {
		color: '#FFFFFF',
		fontWeight: '600',
		textTransform: 'uppercase',
		letterSpacing: 4,
		opacity: 0.85,
		marginTop: 2,
	},
	warning: {
		color: '#FF4444',
	},
});

