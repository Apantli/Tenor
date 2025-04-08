import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Tag } from "~/lib/types/firebaseSchemas";
import { RequirementCol } from "~/server/api/routers/requirements";
import { api } from "~/trpc/react";
import Table, { TableColumns } from "../table/Table";
import PillComponent from "../PillComponent";
import { cn } from "~/lib/utils";


export const heightOfContent = "h-[calc(100vh-285px)]";

export default function RequirementsTable() {

  //Hooks
  const params = useParams();
  const [requirementsData, setRequirementsData] = useState<RequirementCol[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [selectedUS, setSelectedUS] = useState<string>("");

  console.log("projectId:", params.projectId);

  // TRPC
  const  {
    data: requirements,
    isLoading: isLoadingRequirements,
    refetch: refetchRequirements,
  } = api.requirements.getRequirementsTableFriendly.useQuery({ projectId: params.projectId as string });

  useEffect(() => {
    if (requirements) {
      setRequirementsData(requirements);
    }
  }, [requirements]);

  const getTable = () => {
    if (requirements == undefined || isLoadingRequirements) {
      return <div>Loading...</div>;
    }

    if (requirementsData?.length == 0) {
      return <div>No Requirements found</div>;
    }

    const priorityTags: Tag[] = Array.from(
      new Map(
        requirementsData.map((tag) => [
          tag.priorityId.name + tag.priorityId.color + tag.priorityId.deleted,
          tag.priorityId,
        ]),
      ).values(),
    );

    const tableColumns: TableColumns<RequirementCol> = {
      id: { visible: false },
      scrumId: {
        label: "Id",
        width: 80, 
        sortable: false,
        render(row) {
          return (
          <button
            className="truncate text-left underline-offset-4 hover:text-app-primary hover:underline"
            
          >
            {row.scrumId}
          </button>
          );
        },
      },
      name: {
        label: "Title",
        width: 450,
        sortable: false,
        render(row) {
          return (
            <button
              className="truncate text-left underline-offset-4 hover:text-app-primary hover:underline"
              
            >
              {row.name}
            </button>
          );
        },
      },
      description: {
        visible: false,
      },
      priorityId: {
        label: "Priority",
        width: 120,
        render(row) {
          return (
            <span className="flex w-32 justify-start">
              <PillComponent
                currentTag={row.priorityId}
                allTags={priorityTags}
                callBack={(tag: Tag) => {
                  setRequirementsData((prevData) =>
                    prevData.map((item) =>
                      item.id === row.id ? { ...item, priorityId: tag } : item,
                    ),
                  );
                }}
                className="w-[calc(100%-10px)]"
              />
            </span>
          );
        },
      },
      size: {
        visible: false,
      },
      requirementTypeId: {
        label: "Req. Type",
        width: 220,
        filterable: "list",
      },
      requirementFocusId: {
        label: "Req. Focus",
        width: 250,
        filterable: "list",
      },
    };

    return (
      <Table
        className={cn("w-full", heightOfContent)}
        data={requirementsData}
        columns={tableColumns}
        multiselect
        deletable
        onDelete={(ids) => console.log("Deleted", ids)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex w-full justify-between">
        <h2 className="text-2xl font-medium">Requirements</h2>
        <input
          type="text"
          placeholder="Search..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="w-1/3 rounded-md border-2 border-gray-300 p-2"
        />
      </div>
      {getTable()}
    </div>
  );
}