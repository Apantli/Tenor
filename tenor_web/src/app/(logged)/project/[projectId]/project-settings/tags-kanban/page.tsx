"use client";

import { useParams } from "next/navigation";
import ItemTagTable from "./ItemTagTable";

export default function ProjectTags() {
  return (
    <div>
      <h1 className="mb-4 text-3xl font-semibold">Tags & Kanban</h1>
      <div>
        <h2 className="mb-4 text-xl font-medium">Backlog item tags</h2>
        <ItemTagTable></ItemTagTable>
        <h2 className="mb-4 mt-8 text-xl font-medium">Kanban status</h2>
      </div>
    </div>
  );
}
