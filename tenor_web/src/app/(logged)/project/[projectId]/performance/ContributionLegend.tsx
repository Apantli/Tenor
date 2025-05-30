import type { SampleContributionDataType } from "~/app/(logged)/project/[projectId]/performance/ContributionPieChart.tsx";

export const ContributionLegend: React.FC<{
  data?: SampleContributionDataType;
}> = ({ data }) => {
  const colorMap: Record<string, string> = {
    Tasks: "#88BB87",
    Issues: "#15734F",
    "User Stories": "#13918A",
  };

  const totalValue = data?.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="ml-4 flex flex-col gap-2">
      {data?.map((item) => (
        <div key={item.category} className="flex items-center gap-5">
          <div
            className="h-4 min-h-4 w-4 min-w-4 rounded-sm"
            style={{ backgroundColor: colorMap[item.category] }}
          />
          <span className="text-sm">{item.category}</span>
          <span className="ml-auto text-sm text-gray-500">
            {parseFloat(
              ((item.value / (totalValue ?? 1)) * 100).toFixed(2),
            ).toString()}
            %
          </span>
        </div>
      ))}
    </div>
  );
};
