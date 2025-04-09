import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Size, Tag } from "~/lib/types/firebaseSchemas";
import { RequirementCol } from "~/server/api/routers/requirements";
import { api } from "~/trpc/react";
import Table, { TableColumns } from "../table/Table";
import PillComponent from "../PillComponent";
import { cn } from "~/lib/utils";
import Popup, { usePopupVisibilityState } from "../Popup";
import PrimaryButton from "../buttons/PrimaryButton";
import PillPickerComponent from "../PillPickerComponent";
import InputTextField from "../inputs/InputTextField";
import InputTextAreaField from "../inputs/InputTextAreaField";
import { useAlert } from "~/app/_hooks/useAlert";
import PriorityPicker from "../specific-pickers/PriorityPicker";
import RequirementTypePicker from "../specific-pickers/RequirementTypePicker";
import RequirementFocusPicker from "../specific-pickers/RequirementFocusPicker";

export const heightOfContent = "h-[calc(100vh-285px)]";

export default function RequirementsTable() {
  const { projectId } = useParams();

  const utils = api.useUtils();
  const [renderSmallPopup, showSmallPopup, setShowSmallPopup] =
    usePopupVisibilityState();

  //Hooks
  const params = useParams();
  const [requirementsData, setRequirementsData] = useState<RequirementCol[]>(
    [],
  );

  const [searchValue, setSearchValue] = useState("");

  // New requirement values
  const defaultRequirement = {
    name: "",
    description: "",
    priorityId: undefined as Tag | undefined,
    requirementTypeId: undefined as Tag | undefined,
    requirementFocusId: undefined as Tag | undefined,
  };
  const [newRequirement, setNewRequirement] = useState(defaultRequirement);
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setNewRequirement((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const { alert } = useAlert();
  const { mutateAsync: createRequirement, isPending } =
    api.requirements.createRequirement.useMutation();
  const handleCreateRequirement = async () => {
    const {
      priorityId,
      requirementTypeId,
      requirementFocusId,
      name,
      description,
    } = newRequirement;

    if (!name) {
      alert("Oops...", "Requirement Name must have a value.", {
        type: "error",
        duration: 5000, // time in ms (5 seconds)
      });
      return;
    }

    if (!priorityId?.id || !requirementTypeId?.id || !requirementFocusId?.id) {
      alert("Oops...", "All Properties must have a value.", {
        type: "error",
        duration: 5000, // time in ms (5 seconds)
      });
      return;
    }

    // Unwrap values
    const unwrappedPriorityId = priorityId.id;
    const unwrappedRequirementTypeId = requirementTypeId.id;
    const unwrappedRequirementFocusId = requirementFocusId.id;

    const response = await createRequirement({
      projectId: projectId as string,
      name,
      description,
      priorityId: unwrappedPriorityId,
      requirementTypeId: unwrappedRequirementTypeId,
      requirementFocusId: unwrappedRequirementFocusId,
      scrumId: -1,
      deleted: false,
    });

    await utils.requirements.getRequirementsTableFriendly.invalidate({
      projectId: projectId as string,
    });

    setNewRequirement(defaultRequirement);

    setShowSmallPopup(false);
    console.log(response);
  };

  // TRPC
  const {
    data: requirements,
    isLoading: isLoadingRequirements,
    refetch: refetchRequirements,
  } = api.requirements.getRequirementsTableFriendly.useQuery({
    projectId: params.projectId as string,
  });

  useEffect(() => {
    if (requirements) {
      setRequirementsData(requirements.fixedData);
    }
  }, [requirements]);

  const getTable = () => {
    if (requirements == undefined || isLoadingRequirements) {
      return <div>Loading...</div>;
    }

    if (requirementsData?.length == 0) {
      return <div>No Requirements found</div>;
    }

    const tableColumns: TableColumns<RequirementCol> = {
      id: { visible: false },
      scrumId: {
        label: "Id",
        width: 80,
        sortable: false,
        render(row) {
          return (
            <button className="truncate text-left underline-offset-4 hover:text-app-primary hover:underline">
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
            <button className="truncate text-left underline-offset-4 hover:text-app-primary hover:underline">
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
              <PriorityPicker
                priority={row.priorityId}
                // FIXME: Change value in DB
                onChange={(tag: Tag) => {
                  setRequirementsData((prevData) =>
                    prevData.map((item) =>
                      item.id === row.id ? { ...item, priorityId: newPriority } : item,
                    ),
                  );
                }}
              />
            </div>
          );
        },
      },
      requirementTypeId: {
        label: "Req. Type",
        width: 220,
        render(row) {
          return (
            <span className="flex w-full justify-start">
              <RequirementTypePicker
                type={row.requirementTypeId}
                // FIXME: Change value in DB
                onChange={(requirementTypeId) => {
                  setRequirementsData((prevData) =>
                    prevData.map((item) =>
                      item.id === row.id
                        ? { ...item, requirementTypeId: requirementTypeId }
                        : item,
                    ),
                  );
                }}
              />
            </span>
          );
        },
      },
      requirementFocusId: {
        label: "Req. Focus",
        width: 250,
        render(row) {
          return (
            <span className="flex w-full justify-start">
              <RequirementFocusPicker
                focus={row.requirementFocusId}
                // FIXME: Change value in DB
                onChange={(requirementFocusId) => {
                  setRequirementsData((prevData) =>
                    prevData.map((item) =>
                      item.id === row.id
                        ? { ...item, requirementFocusId: requirementFocusId }
                        : item,
                    ),
                  );
                }}
              />
            </span>
          );
        },
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
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex w-full justify-between">
        <h2 className="text-2xl font-medium">Requirements</h2>
        <div className="flex w-3/4 items-center justify-end gap-2">
          <div className="w-1/3 p-2"> 
            <SearchBar
              placeholder="Search..."
              searchValue={searchValue}
              handleUpdateSearch={(e) => setSearchValue(e.target.value)}
              />
        </div>
          <PrimaryButton
            onClick={() => {
              setShowSmallPopup(true);
            }}
          >
            + Add Requirement
          </PrimaryButton>
        </div>
      </div>
      {getTable()}
      {renderSmallPopup && (
        <Popup
          show={showSmallPopup}
          reduceTopPadding
          size="large"
          className="min-h-[400px] min-w-[500px]"
          dismiss={() => setShowSmallPopup(false)}
          footer={
            <div className="flex gap-2">
              <PrimaryButton
                onClick={async () => {
                  await handleCreateRequirement();
                }}
                loading={isPending}
              >
                Create Requirement
              </PrimaryButton>
            </div>
          }
          sidebar={
            <div className="w-[200px] space-y-2 text-xs font-bold">
              <div className="w-full space-y-2">
                <label>Priority</label>
                <PriorityPicker
                  priority={newRequirement.priorityId}
                  onChange={(priority) => {
                    setNewRequirement((prev) => ({
                      ...prev,
                      priorityId: priority,
                    }));
                  }}
                />
              </div>
              <div className="w-full space-y-2">
                <label>Type</label>
                <RequirementTypePicker
                  type={newRequirement.requirementTypeId}
                  onChange={(priority) => {
                    setNewRequirement((prev) => ({
                      ...prev,
                      requirementTypeId: priority,
                    }));
                  }}
                />
              </div>
              <div className="w-full space-y-2">
                <label>Focus</label>
                <RequirementFocusPicker
                  focus={newRequirement.requirementFocusId}
                  onChange={(priority) => {
                    setNewRequirement((prev) => ({
                      ...prev,
                      requirementFocusId: priority,
                    }));
                  }}
                />
              </div>
            </div>
          }
        >
          {" "}
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl">
              <strong>New Requirement</strong>{" "}
            </h1>
            <InputTextField
              label="Title"
              className="h-12"
              value={newRequirement.name}
              onChange={handleChange}
              name="name"
              placeholder="Requirement title"
            />
            <InputTextAreaField
              label="Description"
              html-rows="4"
              className="min-h-[400px] w-full"
              value={newRequirement.description}
              onChange={handleChange}
              name="description"
            />
          </div>
        </Popup>
      )}
    </div>
  );
}
