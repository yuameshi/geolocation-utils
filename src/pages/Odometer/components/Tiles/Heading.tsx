import { useEffect, useState } from 'react';
import CompassHeading from 'react-native-compass-heading';
import { Surface, Icon, Text } from 'react-native-paper';
import { useVerticalLayout } from '@hooks/useVerticalLayout';
import { styles } from './styles';

export const Heading = () => {
	const vertical = useVerticalLayout();
	const [heading, setHeading] = useState(0);
	const headingDeg = Math.round((heading || 0) % 360);
	const dir8 = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N'];
	const headingCardinal = dir8[Math.round(headingDeg / 45)];

	useEffect(() => {
		CompassHeading.start(0, (headingInfo: { heading: number; accuracy: number }) => {
			setHeading(headingInfo.heading);
		});

		return () => CompassHeading.stop();
	}, []);

	return (
		<Surface
			style={[[styles.tile, vertical ? styles.tileVertical : undefined]]}
			elevation={0}
		>
			<Icon
				source="compass-rose"
				size={24}
			/>
			<Text style={styles.label}>Heading</Text>
			<Text style={styles.value}>{headingDeg}</Text>
			<Text style={styles.hint}>{headingCardinal}</Text>
		</Surface>
	);
};
