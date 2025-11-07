/* eslint-disable react-native/no-inline-styles */
import type { FC } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useTheme, Text } from 'react-native-paper';

type Satellite = {
	svid: number | string;
	type?: string;
	snr?: number;
	frequency?: number;
	azimuth?: number;
	elevation?: number;
	used?: boolean;
};

const SAT_SYMBOLS: Record<string, string> = {
	GPS: '●',
	BEIDOU: '▲',
	GLONASS: '■',
	GALILEO: '◆',
	QZSS: '★',
	SBAS: '○',
	IRNSS: '⬢',
	UNKNOWN: '◇',
};

const SAT_NAMES: Record<string, string> = {
	GPS: 'GPS',
	BEIDOU: 'BeiDou',
	GLONASS: 'Glonass',
	GALILEO: 'Galileo',
	QZSS: 'QZSS',
	SBAS: 'SBAS',
	IRNSS: 'IRNSS',
	UNKNOWN: '???',
};

export const SatelliteSkyPlot: FC<{ satellites: Satellite[] }> = ({ satellites }) => {
	const { width, height } = useWindowDimensions();
	const theme = useTheme();
	const size = Math.min(width * 0.95, height * 0.95, 320);
	const r = size / 2 - 20;

	// Count satellites by type
	const typeCount: Record<string, number> = {};
	satellites.forEach(sat => {
		const type = sat.type?.toUpperCase() || 'UNKNOWN';
		typeCount[type] = (typeCount[type] || 0) + 1;
	});

	return (
		<View style={[styles.skyPlotContainer, { alignItems: 'center' }]}>
			<View
				style={[
					styles.skyPlot,
					styles.skyPlotCircle,
					{
						width: size,
						height: size,
						borderRadius: size / 2,
						borderWidth: 1,
						borderColor: theme.colors.onPrimaryContainer,
						backgroundColor: theme.colors.background,
					},
				]}
			>
				{/* North Indicator */}
				<Text
					style={{
						position: 'absolute',
						left: size / 2 - 13.5,
						top: size / 2 - r - 24,
						fontSize: 28,
						color: theme.colors.onPrimaryContainer,
						fontWeight: 'bold',
						opacity: 0.85,
						zIndex: 10,
					}}
				>
					▲
				</Text>
				{/* Pitch 30°/60° Ring */}
				{[30, 60].map((el, idx) => {
					const rr = ((90 - el) / 90) * r;
					return (
						<View
							key={'elevation-circle-' + el}
							style={{
								position: 'absolute',
								left: size / 2 - rr,
								top: size / 2 - rr,
								width: rr * 2,
								height: rr * 2,
								borderRadius: rr,
								borderWidth: 1,
								borderColor: idx === 0 ? theme.colors.primary : theme.colors.secondary,
								opacity: 0.5,
								zIndex: 2,
							}}
						/>
					);
				})}
				{/* Angle lines */}
				{Array.from({ length: 12 }).map((_, i) => (
					<View
						key={i}
						style={[
							styles.angleLine,
							{ backgroundColor: theme.colors.outline },
							{
								left: size / 2 - r,
								top: size / 2,
								width: r * 2,
								transform: [{ rotate: `${i * 30}deg` }],
							},
						]}
					/>
				))}
				{satellites.map((sat, idx) => {
					const azimuth = Number(sat.azimuth);
					const elevation = Number(sat.elevation);
					if (isNaN(azimuth) || isNaN(elevation)) return null;
					const rad = ((90 - elevation) / 90) * r;
					const angle = ((azimuth - 90) * Math.PI) / 180;
					const x = size / 2 + rad * Math.cos(angle);
					const y = size / 2 + rad * Math.sin(angle);
					const symbol = SAT_SYMBOLS[sat.type?.toUpperCase() || 'UNKNOWN'] || SAT_SYMBOLS.UNKNOWN;
					return (
						<View
							key={idx}
							style={[styles.satelliteDot, { left: x - 8, top: y - 8 }]}
						>
							<Text style={[styles.satelliteSymbol, { color: sat.used ? theme.colors.primary : theme.colors.onSurfaceDisabled }]}>{symbol}</Text>
							<Text style={[styles.satelliteSvid, { color: sat.used ? theme.colors.primary : theme.colors.onSurfaceDisabled }]}>{sat.svid}</Text>
						</View>
					);
				})}
			</View>
			{/* Legends */}
			<View
				style={{
					flexDirection: 'row',
					flexWrap: 'wrap',
					justifyContent: 'center',
					marginTop: 16,
					width: size,
				}}
			>
				{Object.keys(SAT_SYMBOLS)
					.filter(type => typeCount[type] > 0)
					.map(type => (
						<View
							key={type}
							style={{ flexDirection: 'row', alignItems: 'center', margin: 6 }}
						>
							<Text style={styles.legendSymbol}>{SAT_SYMBOLS[type]}</Text>
							<Text style={[styles.legendCount, { color: theme.colors.primary, marginLeft: 4 }]}>{typeCount[type]}</Text>
							<Text style={[styles.legendName, { marginLeft: 4 }]}>{SAT_NAMES[type] || type}</Text>
						</View>
					))}
			</View>
		</View>
	);
};
const styles = StyleSheet.create({
	skyPlotContainer: {
		width: '100%',
		marginVertical: 12,
		alignItems: 'center',
	},
	skyPlot: {
		justifyContent: 'center',
		alignItems: 'center',
	},
	skyPlotCircle: {
		borderWidth: 1,
	},
	angleLine: {
		position: 'absolute',
		height: 1,
		opacity: 0.5,
	},
	satelliteDot: {
		position: 'absolute',
		flexDirection: 'row',
		alignItems: 'center',
		height: 18,
	},
	satelliteSymbol: {
		fontSize: 18,
		lineHeight: 18,
	},
	satelliteSvid: {
		fontSize: 12,
		marginLeft: 2,
		lineHeight: 18,
	},
	legendSymbol: {
		fontSize: 14,
	},
	legendCount: {
		marginLeft: 6,
		fontWeight: 'bold',
		fontSize: 12,
	},
	legendName: {
		fontSize: 11,
		marginLeft: 2,
	},
});
