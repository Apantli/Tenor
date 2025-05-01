"use client";

import ItemTagTable from "./ItemTagTable";
import StatusTable from "./StatusTable";

export default function ProjectTags() {
  return (
    <div>
      <h1 className="mb-4 text-3xl font-semibold">Tags & Kanban</h1>
      <div>
        <h2 className="mb-4 text-xl font-semibold">Backlog item tags</h2>
        <ItemTagTable></ItemTagTable>
        <h2 className="mb-4 mt-10 text-xl font-semibold">Kanban status</h2>
        <StatusTable></StatusTable>
      </div>
    </div>
  );
}
