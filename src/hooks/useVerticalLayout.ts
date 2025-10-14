import { useWindowDimensions } from 'react-native';

export const useVerticalLayout = () => {
	const { width } = useWindowDimensions();

	return width < 600;
};
