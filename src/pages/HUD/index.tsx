import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Animated, BackHandler, PixelRatio, StatusBar, StyleSheet, TouchableWithoutFeedback, useWindowDimensions, View } from 'react-native';
import { Portal, Snackbar } from 'react-native-paper';
import Geolocation, { type GeolocationResponse } from '@react-native-community/geolocation';
import { RouterContext } from '@/App';
import { ScreenControl } from '@/native-modules/ScreenControl';
import { HudSpeed } from './components/HudSpeed';
import { HudHeading } from './components/HudHeading';
import { HudLocation } from './components/HudLocation';
import { HudTime } from './components/HudTime';
import { HudSatellites } from './components/HudSatellites';
import { StatusBarIndicator } from './components/StatusBarIndicator';

const LONG_PRESS_DURATION = 800;
const LONG_PRESS_RESET_TIMEOUT = 3000;

export const HudBlinkContext = createContext<Animated.Value>(new Animated.Value(1));

export const HUD = () => {
	const router = useContext(RouterContext);
	const dimensions = useWindowDimensions();
	const blinkOpacity = useMemo(() => new Animated.Value(1), []);

	// Geolocation state
	const [speed, setSpeed] = useState<number | null>(null);
	const [latitude, setLatitude] = useState<number | null>(null);
	const [longitude, setLongitude] = useState<number | null>(null);
	const [accuracy, setAccuracy] = useState<number | null>(null);
	const [satelliteCount, setSatelliteCount] = useState(0);
	const [lastUpdateTs, setLastUpdateTs] = useState(0);

	// Exit mechanism state
	const [longPressCount, setLongPressCount] = useState(0);
	const [snackbarVisible, setSnackbarVisible] = useState(false);
	const [snackbarMessage, setSnackbarMessage] = useState('');
	const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const longPressResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Compute font sizes based on screen short edge and DPI
	const shortEdge = Math.min(dimensions.width, dimensions.height);
	const density = PixelRatio.get();
	// Speed font: ~45% of short edge
	const speedFontSize = Math.max(100, Math.round(shortEdge * 0.45));
	// Unit font size: ~8% of short edge
	const unitFontSize = Math.max(28, Math.round(shortEdge * 0.08));
	// Side element font size: at least 36px, scale with short edge
	const sideFontSize = Math.max(36, Math.round(shortEdge * 0.1));

	// Data reliability checks
	const isAccuracyBad = accuracy !== null && accuracy > 20;
	const isDataStale = lastUpdateTs > 0 && Date.now() - lastUpdateTs > 5000;
	const dataWarning = isAccuracyBad || isDataStale;

	// Padding: keep elements away from edges
	const edgePadding = Math.max(40, Math.round(shortEdge * 0.08));

	// Make inner layout approach a square
	const longEdge = Math.max(dimensions.width, dimensions.height);
	const innerWidth = longEdge - edgePadding * 2;
	const innerHeight = shortEdge - edgePadding * 2;
	// Constrain to a more square-like aspect ratio
	const squareSize = Math.min(innerWidth, innerHeight);
	const contentWidth = Math.min(innerWidth, squareSize * 1.8);

	const processGeolocation = useCallback((position: GeolocationResponse) => {
		setLastUpdateTs(position.timestamp);
		setSpeed(position.coords.speed ?? null);
		setLatitude(position.coords.latitude ?? null);
		setLongitude(position.coords.longitude ?? null);
		setAccuracy(position.coords.accuracy ?? null);
		// @ts-ignore
		setSatelliteCount(position.extras?.satellites ?? 0);
	}, []);

	useEffect(() => {
		const blink = Animated.loop(
			Animated.sequence([
				Animated.timing(blinkOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
				Animated.timing(blinkOpacity, { toValue: 0.3, duration: 600, useNativeDriver: true }),
				Animated.timing(blinkOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
				Animated.delay(200),
			]),
		);
		blink.start();
		return () => {
			blink.stop();
		};
	}, [blinkOpacity]);

	// Lock landscape + max brightness on mount
	useEffect(() => {
		ScreenControl.lockLandscape().catch(e => console.warn('Failed to lock landscape:', e));
		ScreenControl.setMaxBrightness().catch(e => console.warn('Failed to set max brightness:', e));

		return () => {
			ScreenControl.unlockOrientation().catch(e => console.warn('Failed to unlock orientation:', e));
			ScreenControl.restoreBrightness().catch(e => console.warn('Failed to restore brightness:', e));
		};
	}, []);

	// Geolocation watcher
	useEffect(() => {
		const watchId = Geolocation.watchPosition(
			position => processGeolocation(position),
			error => console.warn('HUD geolocation error:', error),
			{
				enableHighAccuracy: true,
				interval: 200,
				maximumAge: 100,
				distanceFilter: 0,
			},
		);

		return () => Geolocation.clearWatch(watchId);
	}, [processGeolocation]);

	// Fallback: network positioning every 10s if GPS stale
	useEffect(() => {
		const intervalId = setInterval(() => {
			Geolocation.getCurrentPosition(
				position => processGeolocation(position),
				error => {
					console.warn('HUD fallback position error:', error);
					setSpeed(null);
					setLatitude(null);
					setLongitude(null);
					setAccuracy(null);
					setSatelliteCount(0);
				},
				{
					enableHighAccuracy: false,
					maximumAge: 5 * 1000,
					distanceFilter: 0,
				},
			);
		}, 10 * 1000);

		return () => clearInterval(intervalId);
	}, [processGeolocation]);

	// Back button handler
	useEffect(() => {
		const handleBack = () => {
			setSnackbarMessage('Long press twice to exit HUD');
			setSnackbarVisible(true);
			return true; // Prevent default back
		};
		const sub = BackHandler.addEventListener('hardwareBackPress', handleBack);
		return () => sub.remove();
	}, []);

	// Exit via double long-press
	const handleLongPress = useCallback(() => {
		if (longPressResetRef.current) clearTimeout(longPressResetRef.current);

		if (longPressCount === 0) {
			setLongPressCount(1);
			setSnackbarMessage('Long press again to exit HUD');
			setSnackbarVisible(true);
			// Reset counter after timeout
			longPressResetRef.current = setTimeout(() => {
				setLongPressCount(0);
			}, LONG_PRESS_RESET_TIMEOUT);
		} else {
			// Second long press — exit
			setLongPressCount(0);
			router?.setRoute('Odometer');
		}
	}, [longPressCount, router]);

	// Cleanup timers
	useEffect(() => {
		return () => {
			if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
			if (longPressResetRef.current) clearTimeout(longPressResetRef.current);
		};
	}, []);

	return (
		<View style={styles.root}>
			<StatusBar hidden />
			<StatusBarIndicator fontSize={sideFontSize} />
			{/* Flipped content for W-HUD */}
			<TouchableWithoutFeedback
				delayLongPress={LONG_PRESS_DURATION}
				onLongPress={handleLongPress}
			>
				<View style={[styles.flippedContainer, { padding: edgePadding }]}>
					<View style={[styles.content, { maxWidth: contentWidth }]}>
						<HudBlinkContext.Provider value={blinkOpacity}>
							{/* Left column: Time + Heading */}
							<View style={styles.sideColumn}>
								<HudTime
									lastUpdateTs={lastUpdateTs}
									fontSize={sideFontSize}
								/>
								<HudHeading fontSize={sideFontSize} />
							</View>

							{/* Center column: Speed */}
							<View style={styles.centerColumn}>
								<HudSpeed
									speed={speed}
									fontSize={speedFontSize}
									unitFontSize={unitFontSize}
									warning={dataWarning}
								/>
							</View>

							{/* Right column: Location + Satellites */}
							<View style={styles.sideColumn}>
								<HudLocation
									latitude={latitude}
									longitude={longitude}
									fontSize={sideFontSize}
								/>
								<HudSatellites
									count={satelliteCount}
									accuracy={accuracy}
									fontSize={sideFontSize}
								/>
							</View>
						</HudBlinkContext.Provider>
					</View>
				</View>
			</TouchableWithoutFeedback>

			<Portal>
				<Snackbar
					visible={snackbarVisible}
					onDismiss={() => setSnackbarVisible(false)}
					duration={2000}
					style={styles.snackbar}
				>
					{snackbarMessage}
				</Snackbar>
			</Portal>
		</View>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
		backgroundColor: '#000000',
	},
	flippedContainer: {
		flex: 1,
		transform: [{ scaleY: -1 }],
		justifyContent: 'center',
		alignItems: 'center',
	},
	content: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		width: '100%',
	},
	sideColumn: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'space-evenly',
		height: '100%',
	},
	centerColumn: {
		flex: 1.5,
		alignItems: 'center',
		justifyContent: 'center',
	},
	snackbar: {
		marginBottom: 20,
	},
});
