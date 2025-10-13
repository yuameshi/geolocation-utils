export const speed = (metersPerSecond: number) => {
	return metersPerSecond * 3.6;
};
export const speedLite = (metersPerSecond: number) => {
	return metersPerSecond;
};
export const altitude = (meters: number) => {
	return meters;
};
export const accuracy = (meters: number) => {
	return meters;
};

export const acceleratedSpeed = (metersPerSecondSqare: number) => {
	return metersPerSecondSqare;
};

export default {
	speed,
	speedLite,
	altitude,
	accuracy,
	acceleratedSpeed,
	units: {
		accuracy: 'meters',
		altitude: 'meters',
		speed: 'km/h',
		speedLite: 'm/s',
		acceleratedSpeed: 'm/s²',
	},
};
