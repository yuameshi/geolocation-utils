import Store, { useAsyncStorage } from '@react-native-async-storage/async-storage';
import { useEffect, useRef } from 'react';

export const useStored = <T = string>(key: string) => {
	const stored = useAsyncStorage(key);
	const value = useRef<T | null>(null);

	useEffect(() => {
		Store.getItem(key).then(current => {
			if (current !== null) {
				try {
					value.current = JSON.parse(current) as T;
				} catch {
					// fallback for string
					value.current = current as unknown as T;
				}
			} else {
				value.current = null;
			}
		});
	}, [key, stored]);

	const setItem = (newValue: T) => {
		const toStore = typeof newValue === 'string' ? newValue : JSON.stringify(newValue);
		Store.setItem(key, toStore).then(() => {
			value.current = newValue;
		});
	};

	return [value.current, setItem] as const;
};

export const useStoredValue = <T = string>(key: string) => {
	const [value] = useStored<T>(key);
	return value;
};

export const useSetStored = <T = string>(key: string) => {
	const [, setValue] = useStored<T>(key);
	return setValue;
};
