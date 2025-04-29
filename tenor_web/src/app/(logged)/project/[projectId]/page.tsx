"use client";

import { useParams } from "next/navigation";
import { useState } from "react";

import InputTextField from "~/app/_components/inputs/InputTextField";

export default function ProjectOverview() {
  const { projectId } = useParams();
  const [name, setName] = useState("");
  return (
    <div>
      <h1 className="text-2xl font-semibold">Project overview</h1>
      <p>Project Id: {projectId}</p>
    </div>
  );
}
