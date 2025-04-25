"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import PrimaryButton from "~/app/_components/buttons/PrimaryButton";
import { api } from "~/trpc/react";

export default function ProjectOverview() {
  const { projectId } = useParams();
  const [messages, setMessages] = useState<string[]>([]);
  const { mutateAsync: generateResponse, isPending: generating } =
    api.frida.genericAIResponse.useMutation();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Project overview</h1>
      <p>Project Id: {projectId}</p>
      {messages.length > 0 ? (
        <div className="mt-4">
          <h2 className="text-xl font-semibold">Message</h2>
          <ul className="list-disc pl-5">
            {messages.map((msg, index) => (
              <li key={index} className="mt-2">
                {msg}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-4">
          No messages yet. You can generate a new project by entering a name
          below.
        </p>
      )}

      <input
        type="text"
        className="mt-4 rounded-md border-2 border-gray-300 p-2"
        placeholder="Enter project name"
      />
      <PrimaryButton
        onClick={async () => {
          const response = await generateResponse({
            schema: "string",
            context: "string",
            messages: ["string"],
            prompt: "string",
          });
          setMessages([...messages, response]);
        }}
        className="mt-4"
      >
        Generate
      </PrimaryButton>
    </div>
  );
}
