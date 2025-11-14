import { useRef, useEffect, useState } from 'react';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent } from 'echarts/components';
import SvgChart, { SVGRenderer } from '@wuba/react-native-echarts/svgChart';
import { useWindowDimensions } from 'react-native';
import { useVerticalLayout } from '@hooks/useVerticalLayout';
import Geolocation from '@react-native-community/geolocation';
import { useTheme } from 'react-native-paper';
import { useStoredValue } from '@hooks/useStoredState';
import { UnitAdapter } from '@utils/unit-adapter';

echarts.use([SVGRenderer, LineChart, GridComponent]);

export const Charts = () => {
	const svgRef = useRef<any>(null);
	const dimensions = useWindowDimensions();
	const verticalLayout = useVerticalLayout();
	const [speeds, setSpeeds] = useState<{ speed: number; ts: number }[]>([]);
	const {
		colors: { primary },
	} = useTheme();
	const [dataY, setDataY] = useState<number[]>([]);
	const [dataX, setDataX] = useState<number[]>([]);
	const unit = useStoredValue<'Metric' | 'Imperial'>('settings.unit') ?? 'Metric';

	useEffect(() => {
		const watchId = Geolocation.watchPosition(
			position => {
				setSpeeds(prev =>
					[
						...prev,
						{
							speed: position.coords.speed ?? 0,
							ts: position.timestamp,
						},
					].slice(-300),
				);
			},
			error => console.warn('Failed to get FINE location at module Charts: ', error),
			{
				enableHighAccuracy: true,
				distanceFilter: 0,
				interval: 1000,
				fastestInterval: 1000,
				maximumAge: 5000,
			},
		);

		return () => Geolocation.clearWatch(watchId);
	}, []);

	useEffect(() => {
		const now = Date.now();
		setDataX(speeds.map(s => Math.floor((s.ts - now) / 1000)));
		setDataY(speeds.map(s => UnitAdapter[unit].speed(s.speed)));
	}, [speeds, unit]);

	useEffect(() => {
		const option: echarts.EChartsCoreOption = {
			animation: false,
			color: primary,
			xAxis: {
				type: 'category',
				data: dataX,
			},
			yAxis: [
				{
					id: 'speed',
					type: 'value',
					name: UnitAdapter[unit].units.speed.toUpperCase(),

					alignTicks: true,
					nameTextStyle: {
						align: 'left',
					},
				},
			],
			// remove padding around the chart
			grid: verticalLayout
				? undefined
				: {
						top: '15%',
						left: '10%',
						right: 0,
						bottom: '10%',
				  },
			series: [
				{
					yAxisId: 'speed',
					data: dataY,
					type: 'line',
					symbol: 'none',
				},
			],
		};

		let chart: echarts.ECharts;
		if (svgRef.current) {
			chart = echarts.init(svgRef.current, 'light', {
				renderer: 'svg',
				...(verticalLayout
					? {
							width: dimensions.width,
							height: dimensions.height * 0.6,
					  }
					: {
							// Compact layout for landscape phones
							width: dimensions.height < 540 ? dimensions.width * 0.6 : dimensions.width * 0.75,
							height: dimensions.height,
					  }),
			});
			chart.setOption(option);
		}

		return () => chart?.dispose();
	}, [dataX, dataY, dimensions, verticalLayout, primary, unit]);

	return <SvgChart ref={svgRef} />;
};
