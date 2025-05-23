"use client";
import { FC, useEffect, useRef } from 'react';
import embed from 'vega-embed';
import { api } from '~/trpc/react';
import type { TopLevelSpec } from 'vega-lite';

interface BurndownChartProps {
  projectId: string;
}

export const BurndownChart: FC<BurndownChartProps> = ({ projectId }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  
  // Fetch burndown data from your API
  const { data, isLoading, isError } = api.projects.getProjectScrumboardStats.useQuery({
    projectId,
  });

  useEffect(() => {
    if (!data || !data.burndownData || !chartRef.current) return;

    // Transform data for Vega
    const chartData = data.burndownData.map(point => ({
      date: point.date ? new Date(point.date).toISOString().split('T')[0] : '', // Format as YYYY-MM-DD
      ideal: point.ideal,
      actual: point.actual,
    }));

    // Vega specification with proper types
    const spec: TopLevelSpec = {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: 'container',
      height: 300,
      title: `Sprint ${data.sprintNumber || ''} Burndown Chart`,
      data: { values: chartData },
      encoding: {
        x: {
          field: 'date',
          type: 'temporal',
          title: 'Date',
          axis: { labelAngle: -45 }
        }
      },
      layer: [
        {
          // Ideal burndown line
          mark: {
            type: 'line' as const,
            point: true,
            stroke: '#4285F4',
            strokeDash: [5, 5]
          },
          encoding: {
            y: {
              field: 'ideal',
              type: 'quantitative',
              title: 'Remaining Points',
              scale: { zero: true }
            }
          }
        },
        {
          // Actual burndown line
          mark: {
            type: 'line' as const,
            point: true,
            stroke: '#EA4335'
          },
          encoding: {
            y: {
              field: 'actual',
              type: 'quantitative'
            }
          }
        }
      ]
    };

    // Render the chart
    embed(chartRef.current, spec, { actions: false })
      .catch(console.error);
      
  }, [data]);

  if (isLoading) return <div className="text-center p-4">Loading chart data...</div>;
  if (isError) return <div className="text-center p-4 text-red-500">Failed to load burndown data</div>;
  if (!data || !data.burndownData || data.burndownData.length === 0) {
    return <div className="text-center p-4">No sprint data available</div>;
  }

  return (
    <div className="p-4 border rounded-lg bg-white shadow">
      <h2 className="text-lg font-semibold mb-4">Sprint Burndown</h2>
      
      <div className="flex justify-between text-sm mb-4">
        <div>Total Points: <span className="font-medium">{data.totalPoints}</span></div>
        <div>Completed: <span className="font-medium">{data.completedPoints}</span></div>
        <div>
          {data.startDate && data.endDate && (
            <>
              {new Date(data.startDate).toLocaleDateString()} - {new Date(data.endDate).toLocaleDateString()}
            </>
          )}
        </div>
      </div>
      
      <div ref={chartRef} style={{ width: '100%', height: '300px' }}></div>
      
      <div className="flex justify-center mt-4 text-xs text-gray-500">
        <div className="flex items-center mr-4">
          <span className="inline-block w-4 h-0.5 bg-blue-500 mr-1 border-dashed border-t border-blue-500"></span>
          <span>Ideal Burndown</span>
        </div>
        <div className="flex items-center">
          <span className="inline-block w-4 h-0.5 bg-red-500 mr-1"></span>
          <span>Actual Progress</span>
        </div>
      </div>
    </div>
  );
};

export default BurndownChart;