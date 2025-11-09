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
};

export const distance = (meters: number) => {
	// whether bigger than 1 miles
	if (meters >= 1609.344) {
		// miles
		return { value: meters / 1609.344, unit: 'miles' };
	} else {
		// feet
		return { value: meters * 3.2808399, unit: 'feet' };
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
		accuracy: 'feet',
		altitude: 'feet',
		speed: 'mph',
		speedLite: 'ft./s',
		acceleratedSpeed: 'ft./s²',
	},
};
