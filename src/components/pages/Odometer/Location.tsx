import { View, Platform, TouchableOpacity, StyleSheet } from 'react-native';
import { type FC, useEffect, useState } from 'react';
import { reverseGeocodeLocation } from 'react-native-geocoder-sdk';
import { Icon, Text } from 'react-native-paper';
import { parseRadius } from '@utils/parse-radius';

type LocationProps = {
	latitude: number | null;
	longitude: number | null;
};

export const Location: FC<LocationProps> = ({ latitude, longitude }) => {
	// %=0: Admin Area (Thoroughfare if available)
	// %=1: Feature Name
	// %=2: Hide
	const [showLocation, setShowLocation] = useState(0);
	const [addressLine, setAddressLine] = useState<string | null>(null);

	useEffect(() => {
		if (latitude === null || longitude === null) {
			setAddressLine(null);
			return;
		}
		reverseGeocodeLocation({ latitude, longitude })
			.then(res => {
				console.log('Geocoder result:', res);
				if (Platform.OS === 'android') {
					if (showLocation % 3 === 0 || showLocation % 3 === 2) {
						// add mode%3 === 2 to prevent text switch behind state changed
						// 0: Thoroughfare + Admin Area + Locality + Country
						const parts = [];
						if (res.subThoroughfare) parts.push(res.subThoroughfare);
						if (res.thoroughfare) parts.push(res.thoroughfare);
						if (res.locality && res.locality !== res.adminArea) parts.push(res.locality);
						if (res.adminArea) parts.push(res.adminArea);
						if (res.countryName || res.countryCode) parts.push(res.countryName || res.countryCode || '');
						const address = parts.filter(p => p && p.length > 0).join(', ');
						if (address.length > 0) {
							setAddressLine(parts.filter(p => p && p.length > 0).join(', '));
						} else {
							if (res.featureName && res.addressLine) {
								setAddressLine(res.addressLine.replace(res.featureName, '').replace(/^[, ]+|[, ]+$/g, ''));
							} else {
								setAddressLine(res.addressLine || null);
							}
						}
					} else if (showLocation % 3 === 1) {
						// 1: Feature Name
						if (res.featureName) setAddressLine(res.featureName);
						else if (res.addressLine) {
							// remove thoroughfare/adminArea/locality/country from addressLine
							const address = res.addressLine;
							let toRemove = [];
							if (res.thoroughfare) toRemove.push(res.thoroughfare);
							if (res.adminArea) toRemove.push(res.adminArea);
							if (res.locality) toRemove.push(res.locality);
							if (res.countryCode) toRemove.push(res.countryCode);
							if (res.countryName) toRemove.push(res.countryName);
							toRemove = toRemove.filter(p => p && p.length > 0);
							let modifiedAddress = address;
							toRemove.forEach(part => {
								const regex = new RegExp(part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
								modifiedAddress = modifiedAddress.replace(regex, '');
							});
							modifiedAddress = modifiedAddress.replace(/^[, ]+|[, ]+$/g, '').replace(/[, ]+/g, ' ');
							if (modifiedAddress.length > 0) {
								setAddressLine(modifiedAddress);
							} else {
								setAddressLine(res.addressLine || null);
							}
						}
					}
				} else if (Platform.OS === 'ios') {
					const parts = [];
					if (res.name) parts.push(res.name);
					else {
						if (res.locality) parts.push(res.locality);
						if (res.administrativeArea && res.administrativeArea !== res.locality) parts.push(res.administrativeArea);
						if (res.country) parts.push(res.country);
					}
					if (parts.length > 0) {
						setAddressLine(parts.join(', '));
					}
				} else {
					setAddressLine(null);
				}
			})
			.catch(err => {
				console.warn(err);
				setAddressLine(null);
			});
	}, [longitude, latitude, showLocation]);

	if (longitude === null || latitude === null) {
		return <Text style={styles.hint}>LOCATION UNAVAILABLE</Text>;
	}

	return (
		<TouchableOpacity
			style={styles.container}
			onPress={() => latitude !== null && longitude !== null && setShowLocation(prev => (prev + 1) % 3)}
		>
			{showLocation % 3 !== 2 ? (
				<>
					<View style={styles.coordinatesContainer}>
						<Text style={styles.coordinates}>
							{parseRadius(latitude)} {latitude >= 0 ? 'N' : 'S'}
						</Text>
						<Text style={styles.coordinatesSeparator}>·</Text>
						<Text style={[styles.coordinates, styles.coordinatesRight]}>
							{parseRadius(longitude)} {longitude >= 0 ? 'E' : 'W'}
						</Text>
					</View>
					{addressLine && (
						<View style={styles.addressRow}>
							<View style={styles.addressIcon}>
								<Icon
									source={['map-marker-radius', 'map-marker', 'map-marker-radius'][showLocation % 3]}
									size={18}
								/>
							</View>
							<Text style={styles.addressText}>{addressLine}</Text>
						</View>
					)}
				</>
			) : (
				<Text style={[styles.hint, addressLine && styles.hintLg]}>LOCATION HIDDEN</Text>
			)}
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
	},
	coordinatesContainer: {
		width: '100%',
		justifyContent: 'space-between',
		marginTop: 10,
		flexDirection: 'row',
		alignItems: 'center',
	},
	coordinatesSeparator: {
		marginHorizontal: 8,
		opacity: 0.6,
	},
	coordinates: {
		flex: 1,
		textAlign: 'right',
		fontSize: 16,
		fontWeight: '600',
		textTransform: 'uppercase',
	},
	coordinatesRight: {
		textAlign: 'left',
	},
	addressRow: {
		marginTop: 10,
		flexDirection: 'row',
		alignItems: 'center',
	},
	addressIcon: {
		marginRight: 6,
		opacity: 0.7,
	},
	addressText: {
		fontSize: 14,
		opacity: 0.9,
	},
	hint: {
		marginTop: 10,
		fontSize: 16,
		fontWeight: 'bold',
		opacity: 0.4,
		letterSpacing: 4,
		textTransform: 'uppercase',
	},
	hintLg: {
		marginVertical: 10,
		lineHeight: 40,
	},
});
