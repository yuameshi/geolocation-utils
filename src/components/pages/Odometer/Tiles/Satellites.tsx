import type { FC } from 'react';
import { Surface, Icon, Text } from 'react-native-paper';
import { styles } from './styles';
import { useVerticalLayout } from '@hooks/useVerticalLayout';

type Props = {
	count: number;
};

export const Satellites: FC<Props> = ({ count }) => {
	const verticalLayout = useVerticalLayout();

	return (
		<Surface
			style={[styles.tile, verticalLayout ? styles.tileVertical : undefined]}
			elevation={0}
		>
			<Icon
				source="satellite-variant"
				size={24}
			/>
			<Text style={styles.label}>Satellites</Text>
			<Text style={styles.value}>{count}</Text>
			<Text style={styles.hint}>in view</Text>
		</Surface>
	);
};
