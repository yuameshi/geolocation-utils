export const speed = (metersPerSecond: number) => {
	return metersPerSecond * 2.23693629;
};
export const speedLite = (metersPerSecond: number) => {
	return metersPerSecond * 3.2808399;
};
export const altitude = (meters: number) => {
	return meters * 3.2808399;
};
export const accuracy = (meters: number) => {
	return meters * 3.2808399;
};

export const acceleratedSpeed = (metersPerSecondSqare: number) => {
	return metersPerSecondSqare * 3.2808399;
}

export default {
	speed,
	speedLite,
	altitude,
	accuracy,
	acceleratedSpeed,
	units: {
		accuracy: 'ft.',
		altitude: 'ft.',
		speed: 'mph',
		speedLite: 'ft/s',
		acceleratedSpeed: 'ft/s²',
	},
};
