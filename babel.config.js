const tsconfig = require('./tsconfig.json');

let paths = {};
for (const key in tsconfig.compilerOptions.paths) {
	paths[key.replace('/*', '')] = tsconfig.compilerOptions.paths[key][0].replace('/*', '');
}

module.exports = {
	presets: ['module:@react-native/babel-preset'],
	plugins: [
		[
			'module-resolver',
			{
				root: ['./src'],
				extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
				alias: paths,
			},
		],
	],
	env: {
		production: {
			plugins: ['react-native-paper/babel'],
		},
	},
};
