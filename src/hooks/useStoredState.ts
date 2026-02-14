import { storage } from '@/storage';
import { useEffect, useState } from 'react';

export const useStored = <T = string>(key: string) => {
	const [value, setValue] = useState<T | null>();

	useEffect(() => {
		setValue(storage.getString(key) as unknown as T);
		const subscribe = storage.addOnValueChangedListener(changedKey => {
			if (changedKey === key) {
				const storedValue = storage.getString(changedKey);
				if (storedValue) {
					try {
						const parsed: T = JSON.parse(storedValue);
						setValue(parsed);
					} catch {
						setValue(storedValue as unknown as T);
					}
				} else {
					setValue(null);
				}
			}
		});

		return () => subscribe.remove();
	}, [key]);

	const setItem = (newValue: T) => {
		const valueToStore = typeof newValue === 'string' ? newValue : JSON.stringify(newValue);
		storage.set(key, valueToStore);
	};

	return [value, setItem] as const;
};

export const useStoredValue = <T = string>(key: string) => {
	const [value] = useStored<T>(key);
	return value;
};

export const useSetStored = <T = string>(key: string) => {
	const [, setValue] = useStored<T>(key);
	return setValue;
};
