export type BurndownDataPoint = {
  day: number;
  date: string;
  completedCount: number;
};

export type BurndownChartData = Array<{
  sprintDay: number;
  storyPoints: number;
  seriesType: number;
}>;

// Sample burndown data for initial rendering
export const SampleBurndownData: BurndownChartData = [{ sprintDay: 0, storyPoints: 0, seriesType: 0 }];