import type { FC } from 'react';
import { Surface, Icon, Text } from 'react-native-paper';
import { UnitAdapter } from '@utils/unit-adapter';
import { styles } from './styles';
import { useVerticalLayout } from '@hooks/useVerticalLayout';
import { useStoredValue } from '@hooks/useStoredState';

type Props = {
	accuracy: number | null;
};

export const StraightLineDistance: FC<Props> = ({ accuracy }) => {
	const verticalLayout = useVerticalLayout();
	const unit = useStoredValue<'Metric' | 'Imperial'>('settings.unit') ?? 'Metric';

	return (
		<Surface
			style={[styles.tile, verticalLayout && styles.tileVertical]}
			elevation={0}
		>
			<Icon
				source={'map-marker-distance'}
				size={24}
			/>
			<Text style={styles.label}>Crow Flies</Text>
			<Text style={styles.value}>{accuracy === null ? '-.-' : UnitAdapter[unit].accuracy(accuracy).toFixed(1)}</Text>
			<Text style={styles.hint}>{UnitAdapter[unit].units.accuracy}</Text>
		</Surface>
	);
};
