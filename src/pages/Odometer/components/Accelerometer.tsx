import { type FC, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { accelerometer, gravity, SensorTypes, setUpdateIntervalForType } from 'react-native-sensors';
import { UnitAdapter } from '@utils/unit-adapter';

export const Accelerometer: FC<{ unit: 'Imperial' | 'Metric' }> = ({ unit }) => {
	const gravityRef = useRef({ x: 0, y: 0, z: 0 });
	const [accelerationMagnitude, setAcceleratedMagnitude] = useState(0);

	useEffect(() => {
		// 20 Hz update rate (50 ms interval）
		setUpdateIntervalForType(SensorTypes.accelerometer, 50);
		setUpdateIntervalForType(SensorTypes.gravity, 50);
		const alpha = 0.9;
		const gravitySub = gravity.subscribe(({ x, y, z }) => {
			gravityRef.current.x = alpha * gravityRef.current.x + (1 - alpha) * x;
			gravityRef.current.y = alpha * gravityRef.current.y + (1 - alpha) * y;
			gravityRef.current.z = alpha * gravityRef.current.z + (1 - alpha) * z;
		});

		const accelerometerSub = accelerometer.subscribe(({ x, y, z }) => {
			const linearAccelerationX = x - gravityRef.current.x;
			const linearAccelerationY = y - gravityRef.current.y;
			const linearAccelerationZ = z - gravityRef.current.z;

			const magnitude = Math.sqrt(linearAccelerationX * linearAccelerationX + linearAccelerationY * linearAccelerationY + linearAccelerationZ * linearAccelerationZ);
			const linearAcceleration = Platform.OS === 'ios' ? magnitude * 9.80665 : magnitude;

			setAcceleratedMagnitude(Math.max(0, linearAcceleration - 0.1)); // Subtracting a small threshold to filter out noise
		});

		return () => {
			gravitySub.unsubscribe();
			accelerometerSub.unsubscribe();
		};
	}, []);
	return (
		<>
			{UnitAdapter[unit].acceleratedSpeed(accelerationMagnitude).toFixed(1)} {UnitAdapter[unit].units.acceleratedSpeed}
		</>
	);
};
