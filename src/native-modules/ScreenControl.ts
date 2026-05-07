import { NativeModules } from 'react-native';

interface IScreenControlModule {
	lockLandscape(): Promise<void>;
	unlockOrientation(): Promise<void>;
	setMaxBrightness(): Promise<void>;
	restoreBrightness(): Promise<void>;
	getScreenOrientation(): Promise<'portrait' | 'portrait-upside-down' | 'landscape-left' | 'landscape-right' | 'unknown'>;
}

export const ScreenControl: IScreenControlModule = NativeModules.ScreenControlModule;
