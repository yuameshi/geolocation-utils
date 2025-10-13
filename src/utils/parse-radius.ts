/**
 * Converts a radius in decimal degrees to a string in degrees, minutes, seconds format.
 *
 * @param radius in decimal degrees
 * @returns {string} in degrees, minutes, seconds format
 * @example
 * parseRadius(12.34567) // 12° 20' 44.412"
 */
export const parseRadius = (radius: number): string => {
	const degrees = Math.floor(radius);
	const minutes = Math.floor((radius - degrees) * 60);
	const seconds = Math.floor((radius - degrees - minutes / 60) * 3600);
	const milliseconds = Math.floor(((radius - degrees - minutes / 60) * 3600 - seconds) * 1000);

	return `${degrees}° ${minutes}' ${seconds}.${milliseconds}"`;
};
