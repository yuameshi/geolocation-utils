export type Satellite = {
	svid: number | string;
	type?: string;
	snr?: number;
	frequency?: number;
	azimuth?: number;
	elevation?: number;
	used?: boolean;
};
