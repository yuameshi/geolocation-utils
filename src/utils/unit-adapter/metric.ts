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

export const distance = (meters: number) => {
	// whether bigger than 1 miles
	if (meters >= 1000) {
		// miles
		return { value: meters / 1000, unit: 'km' };
	} else {
		// feet
		return { value: meters, unit: 'm' };
	}
};

export default {
	speed,
	speedLite,
	altitude,
	accuracy,
	acceleratedSpeed,
	distance,
	units: {
		accuracy: 'meters',
		altitude: 'meters',
		speed: 'km/h',
		speedLite: 'm/s',
		acceleratedSpeed: 'm/s²',
	},
};
