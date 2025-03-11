"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

export default function Page() {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");

  const { data, isLoading } = api.frida.generateREQ.useQuery(submittedQuery, {
    enabled: !!submittedQuery,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedQuery(query);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-app-text">
        FRIDA - Requirement Generator
      </h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Context..."
          className="rounded-md border p-2"
        />
        <button
          type="submit"
          className="ml-2 rounded-md bg-app-primary p-2 text-white"
        >
          Generate
        </button>
      </form>
      <p>
        {isLoading
          ? "Loading..."
          : data?.response.candidates[0].content.parts[0].text}
      </p>
    </div>
  );
}
