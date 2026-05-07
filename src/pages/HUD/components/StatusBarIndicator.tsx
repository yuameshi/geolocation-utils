import type { FC } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';

type Props = {
	fontSize: number;
};

export const StatusBarIndicator: FC<Props> = ({ fontSize }) => {
	return (
		<View style={styles.container}>
			<Icon
				source="triangle"
				size={fontSize * 0.4}
				color="#FFFFFF"
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		top: 0,
		left: '50%',
		transform: [{ translateX: '-50%' }],
		paddingVertical: 12,
		paddingHorizontal: 8,
		opacity: 0.2,
	},
});
