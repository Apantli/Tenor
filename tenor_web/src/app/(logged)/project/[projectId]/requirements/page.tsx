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
      <RequirementsTable />
    </div>
  );
}

