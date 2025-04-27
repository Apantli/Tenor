"use client";

import { useParams } from "next/navigation";

import AIInputText from "~/app/_components/inputs/AIInput";

export default function ProjectOverview() {
  const { projectId } = useParams();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Project overview</h1>
      <p>Project Id: {projectId}</p>
      <AIInputText title="Project overview" className="" />
    </div>
  );
}
