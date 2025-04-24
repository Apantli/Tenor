import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import { usePopupVisibilityState } from "../Popup";
import { useEffect, useMemo, useState} from "react";
import Table, { type TableColumns } from "../table/Table";
import type { Tag } from "~/lib/types/firebaseSchemas";
import { cn } from "~/lib/utils";
import LoadingSpinner from "../LoadingSpinner";
import { IssueCol } from "~/server/api/routers/issues";
import { useFormatIssueScrumId } from "~/app/_hooks/scrumIdHooks";
import PriorityPicker from "../specific-pickers/PriorityPicker";
import { duration } from "@mui/material";
import { useAlert } from "~/app/_hooks/useAlert";

export const heightOfContent = "h-[calc(100vh-285px)]";

export default function IssuesTable() {
  const { projectId } = useParams();

  const utils = api.useUtils();
  const [renderSmallPopup, showSamllPopup, setShowSmallPopup] = usePopupVisibilityState();
  const [issueEdited, setIssueEdited] = useState<IssueCol | null>(null);
  const [editForm, setEditForm] = useState({name: "", description: "",})

  // Hooks
  const params = useParams();
  const [issuesData, setIssuesData] = useState<IssueCol[]>([]);
  
  // TRPC
  const {
    data: issue,
    isLoading: isLoadingIssues,
    refetch: refetchIssues,
  } = api.issues.getIssuesTableFriendly.useQuery({
    projectId: params.projectId as string,
  });

  const { alert } = useAlert();

  const hanldeEditIssue = async (issue: IssueCol, checkValues = true) => {
    let { name, description } = editForm;
    const { priorityId, scrumId } = issue;
    if (checkValues) {
      if (!name) {
        alert("Oops...", "Issue name musta have a value.", {
          type: "error",
          duration: 5000,
        });
        return;
      }
      if (!priorityId?.id) {
        alert("Oops...", "All properties must have a value.", {
          type: "error",
          duration: 5000, // time in ms (5 seconds)
        });
        return;
      }

      if (!name || !description) {
        name = issue.name ?? "";
        description = issue.description;
      }

      //Unwrap values
      const unwrappedPriorityId = priorityId.id;
      
      const newIssue = {
        projectId: projectId as string,
        name,
        description,
        priorityId: unwrappedPriorityId ?? "",
        scrumId,
        deleted: false,
      }
    }
  }

  useEffect(() => {
    if (issue?.fixedData) {
      setIssuesData(issue.fixedData);
    }
  })

  const table = useMemo(() => {

    if (issue === undefined || isLoadingIssues) {
      return (
        <div className="flex h-full w-full flex-1 items-start justify-center p-10">
          <LoadingSpinner color="primary" />
        </div>
      )
    }

    const tableColumns: TableColumns<IssueCol> = {
      id: { visible: false },
      scrumId: {
        label: "Id",
        width: 80,
        sortable: true,
        render(row) {
          const formattedScrumId = useFormatIssueScrumId();
          return (
          <button className="truncate text-left underline-offset-4 hover:text-app-primary hover:underline">
            {formattedScrumId(Number(row.scrumId))}
          </button>
          );
        },
      },
      name: {
        label: "Title",
        width: 450,
        sortable: true,
        render(row) {
          return (
            <button className="truncate text-left underline-offset-4 hover:text-app-primary hover:underline">
              {row.name}
            </button>
          );
        }
      },
      description: {
        visible: false,
      },
      priorityId: {
        label: "Priority",
        width: 120,
        sortable: true,
        filterable: "list",
        filterValue(row) {
          return row.priorityId?.name ?? "";
        },
        sorter(a, b) {
          if (!a.priorityId && !b.priorityId) return 0;
          if (!a.priorityId) return -1;
          if (!b.priorityId) return 1;
          return a.priorityId?.name.localeCompare(b.priorityId?.name);
        },
        render(row) {
          return (
            <PriorityPicker
              priority={row.priorityId}
              onChange={ async (tag: Tag) => {
                setIssuesData((prevData) => 
                  prevData.map((item) => 
                    item.id === row.id ? { ...item, projectId: tag } : item,),
                );
                await hanldeEditIssue({
                  ...row,
                  priorityId: tag,
                }, false);
              }
            }/>
          );
        },
      },
      relatedUserStoryId: {
        visible: false,
      },
      stepsToRecreate: {
        visible: false,
      },
    };
    return (
      <Table 
        className={cn("w-full", heightOfContent)}
        data={issuesData}
        columns={tableColumns}
        emptyMessage="No issues found"
        multiselect
        deletable
      />
    );
  }, [issuesData, isLoadingIssues]);

  return (
    <div className="flex flex-col gap-2">
      {table}
    </div>
  )
}