"use client"; 

import { useParams } from "next/navigation";
import Table, { type TableColumns } from "~/app/_components/table/Table";
import HideIcon from "@mui/icons-material/HideImageOutlined";
import { api } from "~/trpc/react";
import { type Requirement } from "~/lib/types/firebaseSchemas";
"use client"; 

import { useParams } from "next/navigation";
import Table, { type TableColumns } from "~/app/_components/table/Table";
import HideIcon from "@mui/icons-material/HideImageOutlined";
import { api } from "~/trpc/react";
import { type Requirement } from "~/lib/types/firebaseSchemas";

export default function ProjectRequirements() {
  const { projectId } = useParams();

  const { data: project } = api.projects.getProjectById.useQuery(
    { id: projectId as string },
    { enabled: !!projectId } 
  );

  const columns: TableColumns<Requirement> = {
    scrumId: {
      label: "Id",
      width: 200,
      filterable: "list", // list: shows the user a list of row values to filter by
    },
    name: {
      label: "Title",
      width: 400,
      sortable: false,
    },
    priorityId: {
      label: "Priority",
      width: 120,
      filterable: "list",
      sortable: true,
    },
    size: {
      visible: false,
    },
    requirementTypeId: {
      label: "Req. Type",
      width: 180,
      filterable: "list",
    },
    requirementFocusId: {
      label: "Req. Focus",
      width: 220,
      filterable: "list",
    },
    deleted: {
      visible: false,
    },  
  };

  const extraOptions = [
    {
      label: "Hide",
      icon: <HideIcon />, // Find an icon you like under @mui/icons-material/*
      action: (ids: number[]) => {
        // If the button gets clicked, this function will get called with the list of ids that are supposed to be affected
        console.log("Hid", ids);
      },
    },
  ];

  return (
    <div>
      <h2 className="my-2 text-2xl font-medium">Requirements</h2>
      {/* Include the table component in your page, give it a maximum height, as well as the data and columns */}
      {/* Optionally include extraOptions */}
      {/* multiselect: Show the checkboxes next to each row and in the header */}
      {/* deletable: Show delete actions for the rows */}
      {/* onDelete: Provide the functionality for what happens when a row is deleted, you get a list of ids */}
      <Table
        className="h-[250px]"
        data={project?.requirements.map(req => ({ ...req, id: parseInt(req.id, 10) })) || []}
        columns={columns as TableColumns<Record<string, any> & { id: number; }>}
        extraOptions={extraOptions}
        multiselect
        deletable
        onDelete={(ids) => console.log("Deleted", ids)}
      />
    </div>
  );
  );
}

