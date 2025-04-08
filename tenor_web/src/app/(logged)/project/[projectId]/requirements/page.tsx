"use client"; 
import { useParams } from "next/navigation";
import Table, { type TableColumns } from "~/app/_components/table/Table";
import HideIcon from "@mui/icons-material/HideImageOutlined";
import { api } from "~/trpc/react";
import { type Requirement } from "~/lib/types/firebaseSchemas";
import RequirementsTable from "~/app/_components/sections/RequirementsTable";

export default function ProjectRequirements() {
  const { projectId } = useParams();

  return (
    <div>
      {/* Include the table component in your page, give it a maximum height, as well as the data and columns */}
      {/* Optionally include extraOptions */}
      {/* multiselect: Show the checkboxes next to each row and in the header */}
      {/* deletable: Show delete actions for the rows */}
      {/* onDelete: Provide the functionality for what happens when a row is deleted, you get a list of ids */}
      <RequirementsTable />
    </div>
  );
}

