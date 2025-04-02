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
    scrumId: { visible: false },
    name: {
      label: "Name",
      width: 200,
      filterable: "list", // list: shows the user a list of row values to filter by
      // Optionally: You may provide a render function to present the information in any way you like
      // This is to be used when displaying a pill in the table, but can be used to add any component you like
      render(row) {
        return <span className="font-bold">{row.name}</span>;
      },
    },
    description: {
      label: "Description",
      width: 400,
      sortable: true,
    },
    priorityId: {
      label: "Priority",
      width: 200,
      filterable: "list",
      sortable: true,
    },
    size: {
      label: "Size",
      width: 150,
      sortable: true,
    },
    requirementTypeId: {
      label: "Type",
      width: 150,
      filterable: "list",
    },
    requirementFocusId: {
      label: "Focus",
      width: 150,
      filterable: "list",
    },
    deleted: {
      label: "Deleted",
      width: 100,
      render(row) {
        return <span>{row.deleted ? "Yes" : "No"}</span>;
      },
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
      <hr />
      <h2 className="my-2 text-2xl font-medium">Tables</h2>
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
}
