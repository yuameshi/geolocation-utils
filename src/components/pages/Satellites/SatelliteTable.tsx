/* eslint-disable react-native/no-inline-styles */
import type { FC } from 'react';
import { useTheme, DataTable, Text } from 'react-native-paper';
import { StyleSheet } from 'react-native';

type Satellite = {
	svid: number | string;
	type?: string;
	snr?: number;
	frequency?: number;
	azimuth?: number;
	elevation?: number;
	used?: boolean;
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

export const SatelliteTable: FC<{ satellites: Satellite[] }> = ({ satellites }) => {
	const theme = useTheme();
	return (
		<DataTable>
			<DataTable.Header style={{ borderBottomWidth: 2, borderColor: theme.colors.primary }}>
				<DataTable.Title style={styles.flexSvid}>
					<Text style={{ color: theme.colors.primary, fontWeight: 'bold', fontSize: 11 }}>SVID</Text>
				</DataTable.Title>
				<DataTable.Title style={styles.flexType}>
					<Text style={{ color: theme.colors.primary, fontWeight: 'bold', fontSize: 11 }}>Type</Text>
				</DataTable.Title>
				<DataTable.Title style={styles.flexSNR}>
					<Text style={{ color: theme.colors.primary, fontWeight: 'bold', fontSize: 11 }}>SNR</Text>
				</DataTable.Title>
				<DataTable.Title style={styles.flexFreq}>
					<Text style={{ color: theme.colors.primary, fontWeight: 'bold', fontSize: 11 }}>Freq.</Text>
				</DataTable.Title>
				<DataTable.Title style={styles.flexAz}>
					<Text style={{ color: theme.colors.primary, fontWeight: 'bold', fontSize: 11 }}>AZ</Text>
				</DataTable.Title>
				<DataTable.Title style={styles.flexEl}>
					<Text style={{ color: theme.colors.primary, fontWeight: 'bold', fontSize: 11 }}>EL</Text>
				</DataTable.Title>
			</DataTable.Header>
			{satellites.length === 0 ? (
				<DataTable.Row>
					<DataTable.Cell style={{ flex: 1, width: '100%' }}>
						<Text style={styles.listEmpty}>NO DATA</Text>
					</DataTable.Cell>
				</DataTable.Row>
			) : (
				satellites.map((item: Satellite, index: number) => (
					<DataTable.Row key={String(item.svid) + '_' + String(index)}>
						<DataTable.Cell style={styles.flexSvid}>
							<Text style={{ color: item.used ? theme.colors.primary : theme.colors.onBackground, fontWeight: item.used ? 'bold' : 'normal' }}>{item.svid}</Text>
						</DataTable.Cell>
						<DataTable.Cell style={styles.flexType}>
							<Text style={{ color: item.used ? theme.colors.primary : theme.colors.onBackground, fontWeight: item.used ? 'bold' : 'normal' }}>{item.type ? SAT_NAMES[item.type.toUpperCase()] || item.type : ''}</Text>
						</DataTable.Cell>
						<DataTable.Cell style={styles.flexSNR}>
							<Text style={{ color: item.used ? theme.colors.primary : theme.colors.onBackground, fontWeight: item.used ? 'bold' : 'normal' }}>{item.snr !== undefined ? Number(item.snr).toFixed(1) : ''}</Text>
						</DataTable.Cell>
						<DataTable.Cell style={styles.flexFreq}>
							<Text style={{ color: item.used ? theme.colors.primary : theme.colors.onBackground, fontWeight: item.used ? 'bold' : 'normal' }}>{item.frequency ? (item.frequency / 1e6).toFixed(2) : ''}</Text>
						</DataTable.Cell>
						<DataTable.Cell style={styles.flexAz}>
							<Text style={{ color: item.used ? theme.colors.primary : theme.colors.onBackground, fontWeight: item.used ? 'bold' : 'normal' }}>{item.azimuth !== undefined ? item.azimuth.toFixed(1) : ''}</Text>
						</DataTable.Cell>
						<DataTable.Cell style={styles.flexEl}>
							<Text style={{ color: item.used ? theme.colors.primary : theme.colors.onBackground, fontWeight: item.used ? 'bold' : 'normal' }}>{item.elevation !== undefined ? item.elevation.toFixed(1) : ''}</Text>
						</DataTable.Cell>
					</DataTable.Row>
				))
			)}
		</DataTable>
	);
};

const styles = StyleSheet.create({
	listEmpty: {
		margin: 16,
		textAlign: 'center',
	},
	flexSvid: { flex: 1.0 },
	flexType: { flex: 1.6 },
	flexSNR: { flex: 0.7 },
	flexFreq: { flex: 1.4 },
	flexAz: { flex: 1.0 },
	flexEl: { flex: 0.8 },
});
