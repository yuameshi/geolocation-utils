import { type FC, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import CompassHeading from 'react-native-compass-heading';

type Props = {
	fontSize: number;
};

export const HudHeading: FC<Props> = ({ fontSize }) => {
	const [heading, setHeading] = useState(0);
	// Offset didn't exist in real life test, comment out for now but keep code in place for future testing on different devices
	// const [orientationOffset, setOrientationOffset] = useState(0);
	// const orientationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const dir8 = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N'];

	useEffect(() => {
		CompassHeading.start(0, (headingInfo: { heading: number; accuracy: number }) => {
			setHeading(headingInfo.heading);
		});

		// Poll screen orientation for heading offset calibration
		// const updateOrientation = async () => {
		// 	try {
		// 		const orientation = await ScreenControl.getScreenOrientation();
		// 		console.log('Current screen orientation:', orientation);
		// 		switch (orientation) {
		// 			case 'landscape-left':
		// 				// Top of phone is on the left side — device rotated 90° CCW
		// 				// Compass gives heading relative to phone top, need +90° to correct
		// 				setOrientationOffset(-0);
		// 				break;
		// 			case 'landscape-right':
		// 				// Top of phone is on the right side — device rotated 90° CW
		// 				setOrientationOffset(0);
		// 				break;
		// 			default:
		// 				setOrientationOffset(0);
		// 				break;
		// 		}
		// 	} catch {
		// 		setOrientationOffset(0);
		// 	}
		// };

		// updateOrientation();
		// orientationIntervalRef.current = setInterval(updateOrientation, 2000);

		return () => {
			CompassHeading.stop();
			// if (orientationIntervalRef.current) clearInterval(orientationIntervalRef.current);
		};
	}, []);

	// Apply orientation offset and normalize to 0-360
	// const calibratedHeading = ((heading + orientationOffset) % 360 + 360) % 360;
	const calibratedHeading = heading;
	const headingDeg = Math.round(calibratedHeading);
	const headingCardinal = dir8[Math.round(headingDeg / 45)];

	return (
		<View style={styles.container}>
			<Icon
				source="compass-outline"
				size={fontSize * 0.7}
				color="#FFFFFF"
			/>
			<Text style={[styles.value, { fontSize }]}>{headingDeg}°</Text>
			<Text style={[styles.cardinal, { fontSize: fontSize * 0.7 }]}>{headingCardinal}</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		justifyContent: 'center',
		gap: 2,
	},
	value: {
		color: '#FFFFFF',
		fontWeight: '700',
		fontVariant: ['tabular-nums'],
	},
	cardinal: {
		color: '#FFFFFF',
		fontWeight: '600',
		opacity: 0.85,
		letterSpacing: 2,
	},
});

