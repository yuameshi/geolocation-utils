import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { AvgSpeed } from '../Tiles/AvgSpeed';
import { Distance } from '../Tiles/Distance';
import { StraightLineDistance } from '../Tiles/StraightLineDistance';
import { Timer } from '../Tiles/Timer';
import { Charts } from './Charts';
import { useVerticalLayout } from '@hooks/useVerticalLayout';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const OverallData = () => {
	const verticalLayout = useVerticalLayout();
	const dimensions = useWindowDimensions();
	const compact = !verticalLayout && dimensions.height < 540;
	const safeArea = useSafeAreaInsets();
	const accuracy = 1234.5; // Example accuracy value

	return (
		<View
			style={[
				styles.overallDataContainer,
				verticalLayout && styles.overallDataContainerVertical,
				{
					minHeight: dimensions.height - safeArea.top - safeArea.bottom,
					minWidth: dimensions.width - safeArea.left - safeArea.right,
				},
			]}
		>
			<Charts />
			<View
				style={[
					styles.tileArea,
					{
						maxHeight: verticalLayout ? dimensions.height * 0.4 - safeArea.top - safeArea.bottom : dimensions.height,
						maxWidth: verticalLayout ? dimensions.width : compact ? dimensions.width * 0.4 : dimensions.width * 0.25,
						paddingTop: compact ? safeArea.top + 10 : undefined,
					},
					verticalLayout
						? {
								paddingBottom: Math.max(safeArea.top, safeArea.bottom) + 10, // some device will have 0 bottom when hiding white bars
						  }
						: {
								paddingRight: Math.max(safeArea.left, safeArea.right) + 10,
						  },
					compact && {
						paddingBottom: 20,
					},
				]}
			>
				<View style={verticalLayout ? styles.tileSubRowVertical : compact ? styles.tileSubRowLandscapeCompact : styles.tileSubRowLandscape}>
					<StraightLineDistance />
					<Distance accuracy={accuracy} />
				</View>
				<View style={verticalLayout ? styles.tileSubRowVertical : compact ? styles.tileSubRowLandscapeCompact : styles.tileSubRowLandscape}>
					<AvgSpeed accuracy={accuracy} />
					<Timer />
				</View>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	overallDataContainer: {
		flexDirection: 'row',
		height: '100%',
		width: '100%',
	},
	overallDataContainerVertical: {
		flexDirection: 'column',
	},
	tileArea: {
		flex: 1,
		alignItems: 'center',
		paddingHorizontal: 10,
		justifyContent: 'space-between',
	},
	tileSubRowLandscape: {
		flexDirection: 'column',
		width: '100%',
		height: '50%',
		justifyContent: 'space-around',
	},
	tileSubRowLandscapeCompact: {
		flexDirection: 'row',
		paddingHorizontal: 15,
		width: '100%',
		justifyContent: 'space-between',
	},
	tileSubRowVertical: {
		flexDirection: 'row',
		width: '100%',
		height: '50%',
		justifyContent: 'space-around',
	},
});
