"use client";

import Link from "next/link";
import React from "react";
import SecondaryButton from "~/app/_components/SecondaryButton";
import Table, { type TableColumns } from "~/app/_components/table/Table";
import { useAlert } from "~/app/_hooks/useAlert";
import HideIcon from "@mui/icons-material/HideImageOutlined";

// This file is to showcase how to use the components available in Tenor

export default function ComponentShowcasePage() {
  return (
    <main className="p-4">
      <Link className="text-blue-500" href="/">
        Go back to Tenor
      </Link>
      <h1 className="my-5 text-3xl font-semibold">Component Showcase</h1>
      <div className="flex flex-col gap-10">
        <AlertShowcase />
        <TableShowcase />
      </div>
    </main>
  );
}

function AlertShowcase() {
  // Add the useAlert hook to any client component where you want to show alerts
  // Then you can use the alert function wherever you want
  // You can also use predefined alerts, or even add another predefined alert (in useAlert.tsx) if you want to repeat the same message in multiple places
  const { alert, predefinedAlerts } = useAlert();

  return (
    <div>
      <hr />
      <h2 className="my-2 text-2xl font-medium">Alerts</h2>
      <div className="flex gap-2">
        {/* Different types of alerts: info, success, error and warning*/}
        <SecondaryButton
          onClick={() => alert("Info Alert title", "Alert description")} // The info type is the default
        >
          Show Info Alert
        </SecondaryButton>

        <SecondaryButton
          onClick={() =>
            alert("Success Alert title", "Alert description", {
              type: "success",
            })
          }
        >
          Show Success Alert
        </SecondaryButton>

        <SecondaryButton
          onClick={() =>
            alert("Error Alert title", "Alert description", { type: "error" })
          }
        >
          Show Error Alert
        </SecondaryButton>

        <SecondaryButton
          onClick={() =>
            alert("Warning Alert title", "Alert description", {
              type: "warning",
            })
          }
        >
          Show Warning Alert
        </SecondaryButton>

        <SecondaryButton
          onClick={() =>
            alert("Timed alert title", "Alert description", {
              type: "error",
              duration: 5000, // time in ms (5 seconds)
            })
          }
        >
          Show Timed Alert
        </SecondaryButton>

        {/* Use predefined alerts if one exists for your use case already, like unexpected errors */}
        <SecondaryButton onClick={() => predefinedAlerts.unexpectedError()}>
          Show Unexpected Error Alert
        </SecondaryButton>
      </div>
    </div>
  );
}

function TableShowcase() {
  interface ExampleUser {
    id: number;
    name: string;
    age: number;
  }

  const data: ExampleUser[] = [
    { id: 1, name: "Luis", age: 21 },
    { id: 2, name: "Sergio", age: 20 },
    { id: 3, name: "Alonso", age: 19 },
    { id: 4, name: "Oscar", age: 21 },
    { id: 5, name: "Luis", age: 21 },
    { id: 6, name: "Nicolas", age: 21 },
    { id: 7, name: "Nicolas", age: 21 },
    { id: 8, name: "Nicolas", age: 21 },
    { id: 9, name: "Nicolas", age: 21 },
    { id: 10, name: "Nicolas", age: 21 },
    { id: 11, name: "Nicolas", age: 21 },
    { id: 12, name: "Nicolas", age: 21 },
    { id: 13, name: "Nicolas", age: 21 },
    { id: 14, name: "Nicolas", age: 21 },
    { id: 15, name: "Nicolas", age: 21 },
    { id: 16, name: "Nicolas", age: 21 },
    { id: 17, name: "Nicolas", age: 21 },
    { id: 18, name: "Nicolas", age: 21 },
    { id: 19, name: "Nicolas", age: 21 },
    { id: 20, name: "Nicolas", age: 21 },
    { id: 21, name: "Nicolas", age: 21 },
    { id: 22, name: "Nicolas", age: 21 },
    { id: 23, name: "Nicolas", age: 21 },
    { id: 24, name: "Nicolas", age: 21 },
    { id: 25, name: "Nicolas", age: 21 },
    { id: 26, name: "Nicolas", age: 21 },
    { id: 27, name: "Nicolas", age: 21 },
  ];

  const columns: TableColumns<ExampleUser> = {
    id: { label: "Id", width: 100 },
    name: {
      label: "Name",
      width: 400,
      sortable: true,
      filterable: "search-only",
    },
    age: {
      label: "Age",
      width: 200,
      filterable: "list",
      sortable: true,
    },
  };

  const extraOptions = [
    {
      label: "Hide",
      icon: <HideIcon />,
      action: (ids: number[]) => {
        console.log("Hid", ids);
      },
    },
  ];

  return (
    <div className="h-[10px]">
      <hr />
      <h2 className="my-2 text-2xl font-medium">Tables</h2>
      <Table
        className="h-[600px]"
        data={data}
        columns={columns}
        extraOptions={extraOptions}
        multiselect
        deletable
        onDelete={(ids) => console.log("Deleted", ids)}
      />
    </div>
  );
}
