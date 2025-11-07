import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
	tile: {
		borderRadius: 16,
		paddingVertical: 14,
		paddingHorizontal: 12,
		alignItems: 'center',
	},
	tileVertical: {
		flex: 1,
	},
	label: {
		marginTop: 6,
		fontSize: 12,
		opacity: 0.7,
	},
	value: {
		marginTop: 4,
		fontSize: 18,
		fontWeight: '600',
		textTransform: 'uppercase',
	},
	hint: {
		width: '100%',
		textAlign: 'center',
		marginTop: 1,
		fontSize: 12,
		opacity: 0.6,
		textTransform: 'uppercase',
	},
});
