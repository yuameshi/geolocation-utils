import type { FC } from 'react';
import { Surface, Icon, Text } from 'react-native-paper';
import { UnitAdapter } from '@utils/unit-adapter';
import { styles } from './styles';
import { useVerticalLayout } from '@hooks/useVerticalLayout';

type Props = {
	accuracy: number | null;
	unit: 'Metric' | 'Imperial';
};

export const Accuracy: FC<Props> = ({ accuracy, unit }) => {
	const verticalLayout = useVerticalLayout();

	return (
		<Surface
			style={[styles.tile, verticalLayout ? styles.tileVertical : undefined]}
			elevation={0}
		>
			{(accuracy ?? Infinity) >= 25 ? (
				<Icon
					source={'crosshairs'}
					size={24}
				/>
			) : (
				<Icon
					source={'crosshairs-gps'}
					size={24}
				/>
			)}
			<Text style={styles.label}>Accuracy</Text>
			<Text style={styles.value}>{accuracy === null ? '-.-' : UnitAdapter[unit].accuracy(accuracy).toFixed(1)}</Text>
			<Text style={styles.hint}>{UnitAdapter[unit].units.accuracy}</Text>
		</Surface>
	);
};
