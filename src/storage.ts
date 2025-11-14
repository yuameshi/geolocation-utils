import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV({
	id: `primary-storage`,
	encryptionKey: 'geolocation-utils',
	mode: 'multi-process',
	readOnly: false,
});
