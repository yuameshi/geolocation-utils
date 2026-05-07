import { type FC, useContext } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { HudBlinkContext } from '../index';

type Props = {
	count: number;
	accuracy: number | null;
	fontSize: number;
};

type WarningLevel = 'none' | 'yellow' | 'red';

export const HudSatellites: FC<Props> = ({ count, accuracy, fontSize }) => {
	const blinkOpacity = useContext(HudBlinkContext);
	const hasAccuracy = accuracy !== null;
	const isRed = count < 3 || (hasAccuracy && accuracy > 20);
	const isYellow = !isRed && count < 5;
	const warningLevel: WarningLevel = isRed ? 'red' : isYellow ? 'yellow' : 'none';

	const color = warningLevel === 'red' ? '#FF4444' : warningLevel === 'yellow' ? '#FFB300' : '#FFFFFF';
	const accuracyColor = warningLevel === 'none' ? '#FFFFFF' : color;

	const content = (
		<>
			<Icon
				source="satellite-variant"
				size={fontSize * 0.7}
				color={color}
			/>
			<Text style={[styles.value, { fontSize, color }]}>{count}</Text>
			{hasAccuracy && <Text style={[styles.accuracy, { fontSize: fontSize * 0.7, color: accuracyColor }]}>±{accuracy?.toFixed(0)}M</Text>}
		</>
	);

	if (warningLevel === 'none') {
		return <View style={styles.container}>{content}</View>;
	}

	return <Animated.View style={[styles.container, { opacity: blinkOpacity }]}>{content}</Animated.View>;
};

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		justifyContent: 'center',
		gap: 2,
	},
	value: {
		fontWeight: '700',
		fontVariant: ['tabular-nums'],
	},
	accuracy: {
		fontWeight: '600',
		opacity: 0.7,
		fontVariant: ['tabular-nums'],
	},
});

