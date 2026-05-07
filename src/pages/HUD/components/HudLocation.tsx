import { type FC, useEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { reverseGeocodeLocation } from 'react-native-geocoder-sdk';

type Props = {
	latitude: number | null;
	longitude: number | null;
	fontSize: number;
};

export const HudLocation: FC<Props> = ({ latitude, longitude, fontSize }) => {
	const [locationText, setLocationText] = useState<string | null>(null);

	useEffect(() => {
		if (latitude === null || longitude === null) {
			setLocationText(null);
			return;
		}

		reverseGeocodeLocation({ latitude, longitude })
			.then(res => {
				if (Platform.OS === 'android') {
					// Priority: thoroughfare > featureName > adminArea > locality > country
					if (res.thoroughfare) {
						setLocationText(res.thoroughfare);
					} else if (res.featureName) {
						setLocationText(res.featureName);
					} else if (res.adminArea) {
						setLocationText(res.adminArea);
					} else if (res.locality) {
						setLocationText(res.locality);
					} else if (res.countryName || res.countryCode) {
						setLocationText(res.countryName || res.countryCode || null);
					} else {
						setLocationText(null);
					}
				} else if (Platform.OS === 'ios') {
					if (res.name) {
						setLocationText(res.name);
					} else if (res.locality) {
						setLocationText(res.locality);
					} else if (res.administrativeArea) {
						setLocationText(res.administrativeArea);
					} else if (res.country) {
						setLocationText(res.country);
					} else {
						setLocationText(null);
					}
				}
			})
			.catch(() => setLocationText(null));
	}, [latitude, longitude]);

	return (
		<View style={styles.container}>
			<Icon
				source="road-variant"
				size={fontSize * 0.7}
				color="#FFFFFF"
			/>
			{(() => {
				const text = locationText ?? '---';
				const length = text.length;
				const baseFontSize = fontSize * 0.85;
				const scale = Math.min(1, 4.5 / Math.min(6, length));
				const adjustedFontSize = baseFontSize * scale;
				const maxLines = length > 6 ? 2 : 1;
				return (
					<Text
						style={[styles.text, { fontSize: adjustedFontSize }]}
						numberOfLines={maxLines}
						ellipsizeMode="tail"
					>
						{text}
					</Text>
				);
			})()}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		justifyContent: 'center',
		gap: 6,
	},
	text: {
		color: '#FFFFFF',
		fontWeight: '600',
		textAlign: 'center',
	},
});

