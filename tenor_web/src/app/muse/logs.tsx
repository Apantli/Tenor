"use client";

import { api } from "~/trpc/react";

function LogsList() {
  const { data, isLoading, error } = api.logs.listLogs.useQuery();

  if (error?.data?.code == "UNAUTHORIZED") {
    return <p>Please sign in to view your logs</p>;
  }

  if (isLoading || !data) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <div className="flex flex-row items-center gap-4">
        <span className="w-80 font-semibold">Emotion</span>
        <span className="w-80 font-semibold">Date</span>
      </div>
      {data.map((log) => (
        <div className="flex flex-row items-center gap-4" key={log.id}>
          <span className="w-80">{log.emotion}</span>
          <span className="w-80">
            {new Date(log.created_at).toDateString()}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function Logs() {
  return (
    <div className="pt-4">
      <h1 className="text-xl font-bold">Logs</h1>
      <LogsList />
    </div>
  );
}
