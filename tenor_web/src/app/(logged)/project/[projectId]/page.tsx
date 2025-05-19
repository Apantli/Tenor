"use client";

import { useParams } from "next/navigation";

export default function ProjectOverview() {

  const params = useParams();
  const projectId = params.projectId as string;

  return (
    <div className="">
      <div className="flex w-2/4 flex-col gap-5 border-2 border-[#BECAD4] rounded-lg p-5">
        
      </div>
      <div className="flex w-2/4 flex-col gap-5 border-2 border-[#BECAD4] rounded-lg p-5">
        
      </div>
    </div>
  );
}
