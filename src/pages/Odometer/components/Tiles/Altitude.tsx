import type { FC } from 'react';
import { Surface, Icon, Text } from 'react-native-paper';
import { UnitAdapter } from '@utils/unit-adapter';
import { styles } from './styles';
import { useVerticalLayout } from '@hooks/useVerticalLayout';
import { useStoredValue } from '@hooks/useStoredState';

type Props = {
	altitude: number | null;
	altitudeAccuracy: number | null;
};

export const Altitude: FC<Props> = ({ altitude, altitudeAccuracy }) => {
	const verticalLayout = useVerticalLayout();
	const unit = useStoredValue<'Metric' | 'Imperial'>('settings.unit') ?? 'Metric';

	return (
		<Surface
			style={[styles.tile, verticalLayout && styles.tileVertical]}
			elevation={0}
		>
			<Icon
				source="altimeter"
				size={24}
			/>
			<Text style={styles.label}>Altitude</Text>
			<Text style={styles.value}>
				{altitude === null ? '-.-' : UnitAdapter[unit].altitude(altitude).toFixed(1)}
				{altitudeAccuracy && <> ± {UnitAdapter[unit].altitude(altitudeAccuracy).toFixed(1)}</>}
			</Text>
			<Text style={styles.hint}>{UnitAdapter[unit].units.altitude}</Text>
		</Surface>
	);
};
