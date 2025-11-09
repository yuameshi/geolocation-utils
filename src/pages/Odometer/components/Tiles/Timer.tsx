import { useEffect, useRef, useState, type FC } from 'react';
import { Surface, Icon, Text } from 'react-native-paper';
import { styles } from './styles';
import { useVerticalLayout } from '@hooks/useVerticalLayout';

export const Timer: FC = () => {
	const verticalLayout = useVerticalLayout();
	const startTs = useRef(Math.round(Date.now() / 1000));
	const [timer, setTimer] = useState(0);

	useEffect(() => {
		const interval = setInterval(() => {
			const nowTs = Math.round(Date.now() / 1000);
			setTimer(nowTs - startTs.current);
		}, 1000);
		return () => clearInterval(interval);
	}, []);

	return (
		<Surface
			style={[styles.tile, verticalLayout && styles.tileVertical]}
			elevation={0}
		>
			<Icon
				source={'timer-outline'}
				size={24}
			/>
			<Text style={styles.label}>Timer</Text>
			<Text style={styles.value}>{timer}</Text>
			<Text style={styles.hint}>Seconds</Text>
		</Surface>
	);
};
