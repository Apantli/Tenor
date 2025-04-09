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
import { SizeSchema } from "~/lib/types/zodFirebaseSchema";

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
  const [allTags, setAllTags] = useState<Tag[]>([]); // States for the tags
  const [allReqTypeTags, setAllReqTypeTags] = useState<Tag[]>([]); // States for the req type tags
  const [allFocusTags, setAllFocusTags] = useState<Tag[]>([]); // States for the focus tags
  const [searchValue, setSearchValue] = useState("");

  const sizeTags: Tag[] = SizeSchema.options.map((size) => ({
    id: size.valueOf(),
    name: size.valueOf(),
    color: "#444444",
    deleted: false,
  }));

  console.log("projectId:", params.projectId);

  // New requirement values
  const defaultRequirement = {
    name: "",
    description: "",
    priorityId: undefined as Tag | undefined,
    requirementTypeId: undefined as Tag | undefined,
    requirementFocusId: undefined as Tag | undefined,
    size: undefined as Tag | undefined,
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
  const { mutateAsync: createRequirement } =
    api.requirements.createRequirement.useMutation();
  const handleCreateRequirement = async () => {
    const {
      priorityId,
      requirementTypeId,
      requirementFocusId,
      name,
      description,
      size,
    } = newRequirement;

    if (!priorityId?.id || !requirementTypeId?.id || !requirementFocusId?.id)
      return;

    // Unwrap values
    const unwrappedPriorityId = priorityId.id;
    const unwrappedRequirementTypeId = requirementTypeId.id;
    const unwrappedRequirementFocusId = requirementFocusId.id;

    // Validate size
    const sizeValidation = SizeSchema.safeParse(size?.id);
    if (!sizeValidation.success) {
      console.error("Invalid size value:", size);
      return;
    }

    const response = await createRequirement({
      projectId: projectId as string,
      name,
      description,
      priorityId: unwrappedPriorityId,
      requirementTypeId: unwrappedRequirementTypeId,
      requirementFocusId: unwrappedRequirementFocusId,
      size: sizeValidation.data,
      scrumId: -1,
      deleted: false,
    });

    await utils.requirements.getRequirementsTableFriendly.invalidate({
      projectId: projectId as string,
    });

    setNewRequirement(defaultRequirement);

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
      setAllTags(requirements.allTags);
      setAllReqTypeTags(requirements.allRequirementTypeTags);
      setAllFocusTags(requirements.allRequirementFocusTags ?? []);
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
              <PillComponent
                labelClassName="w-full"
                currentTag={row.priorityId}
                allTags={allTags}
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
        render(row) {
          return (
            <span className="flex w-full justify-start">
              <PillComponent
                labelClassName="w-full"
                currentTag={row.requirementTypeId}
                allTags={allReqTypeTags}
                callBack={(tag: Tag) => {
                  setRequirementsData((prevData) =>
                    prevData.map((item) =>
                      item.id === row.id
                        ? { ...item, requirementTypeId: tag }
                        : item,
                    ),
                  );
                }}
                className="w-[calc(100%-10px)]"
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
              <PillComponent
                labelClassName="w-full"
                currentTag={row.requirementFocusId}
                allTags={allFocusTags}
                callBack={(tag: Tag) => {
                  setRequirementsData((prevData) =>
                    prevData.map((item) =>
                      item.id === row.id
                        ? { ...item, requirementFocusId: tag }
                        : item,
                    ),
                  );
                }}
                className="w-[calc(100%-10px)]"
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
          <input
            type="text"
            placeholder="Search..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-1/3 rounded-md border-2 border-gray-300 p-2"
          />
          <PrimaryButton
            onClick={() => {
              setShowSmallPopup(true);
            }}
          >
            + Add Sprint
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
                  setShowSmallPopup(false);
                }}
              >
                Create Requirement
              </PrimaryButton>
            </div>
          }
          sidebar={
            <div className="w-[200px] space-y-2 text-xs font-bold">
              <div className="w-full space-y-2">
                <label>Priority</label>
                <PillComponent
                  labelClassName="w-full"
                  currentTag={newRequirement.priorityId}
                  allTags={allTags}
                  callBack={(tag: Tag) => {
                    setNewRequirement((prev) => ({
                      ...prev,
                      priorityId: tag,
                    }));
                  }}
                  className="w-full"
                />
              </div>
              <div className="w-full space-y-2">
                <label>Type</label>
                <PillComponent
                  labelClassName="w-full"
                  currentTag={newRequirement.requirementTypeId}
                  allTags={allReqTypeTags}
                  callBack={(tag: Tag) => {
                    setNewRequirement((prev) => ({
                      ...prev,
                      requirementTypeId: tag,
                    }));
                  }}
                  className="w-full"
                />
              </div>
              <div className="w-full space-y-2">
                <label>Focus</label>
                <PillComponent
                  labelClassName="w-full"
                  currentTag={newRequirement.requirementFocusId}
                  allTags={allFocusTags}
                  callBack={(tag: Tag) => {
                    setNewRequirement((prev) => ({
                      ...prev,
                      requirementFocusId: tag,
                    }));
                  }}
                  className="w-full"
                />
              </div>
              <div className="w-full space-y-2">
                <label>Size</label>
                <PillComponent
                  labelClassName="w-full"
                  currentTag={newRequirement.size}
                  allTags={sizeTags}
                  callBack={(tag: Tag) => {
                    setNewRequirement((prev) => ({
                      ...prev,
                      size: tag,
                    }));
                  }}
                  className="w-full"
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
