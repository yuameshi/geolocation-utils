import { useRef, useEffect } from 'react';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent } from 'echarts/components';
import SvgChart, { SVGRenderer } from '@wuba/react-native-echarts/svgChart';
import { useWindowDimensions } from 'react-native';
import { useVerticalLayout } from '@hooks/useVerticalLayout';

echarts.use([SVGRenderer, LineChart, GridComponent]);

export const Charts = () => {
	const svgRef = useRef<any>(null);
	const dimensions = useWindowDimensions();
	const verticalLayout = useVerticalLayout();
	console.log(verticalLayout, dimensions.width);

	useEffect(() => {
		const option: echarts.EChartsCoreOption = {
			xAxis: {
				type: 'category',
				data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
			},
			yAxis: {
				type: 'value',
			},
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
					data: [150, 230, 224, 218, 135, 147, 260],
					type: 'line',
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
	}, [dimensions, verticalLayout]);

	return <SvgChart ref={svgRef} />;
};
