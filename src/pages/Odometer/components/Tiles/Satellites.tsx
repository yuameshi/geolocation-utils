import { useContext, type FC } from 'react';
import { Icon, Surface, Text } from 'react-native-paper';
import { styles } from './styles';
import { useVerticalLayout } from '@hooks/useVerticalLayout';
import { RouterContext } from '@/App';
import { Platform, TouchableOpacity } from 'react-native';

type Props = {
	count: number;
};

export const Satellites: FC<Props> = ({ count }) => {
	const verticalLayout = useVerticalLayout();
	const router = useContext(RouterContext);

	const content = (
		<>
			<Icon
				source="satellite-variant"
				size={24}
			/>
			<Text style={styles.label}>Satellites</Text>
			<Text style={styles.value}>{count}</Text>
			<Text style={styles.hint}>in use</Text>
		</>
	);

	return Platform.OS === 'android' ? (
		<TouchableOpacity
			onPress={() => router?.setRoute('Satellites')}
			style={[styles.tile, verticalLayout && styles.tileVertical]}
		>
			{content}
		</TouchableOpacity>
	) : (
		<Surface
			style={[[styles.tile, verticalLayout ? styles.tileVertical : undefined]]}
			elevation={0}
		>
			{content}
		</Surface>
	);
};
