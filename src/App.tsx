/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Odometer } from './pages/Odometer';

function App() {
	const isDarkMode = useColorScheme() === 'dark';
	const theme = isDarkMode ? MD3DarkTheme : MD3LightTheme;

	return (
		<PaperProvider theme={theme}>
			<SafeAreaProvider>
				<StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
				<Odometer />
			</SafeAreaProvider>
		</PaperProvider>
	);
}

export default App;
