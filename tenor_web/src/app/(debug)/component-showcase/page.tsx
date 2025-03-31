"use client";

import Link from "next/link";
import React, { useState } from "react";
import SecondaryButton from "~/app/_components/SecondaryButton";
import Table, { type TableColumns } from "~/app/_components/table/Table";
import { useAlert } from "~/app/_hooks/useAlert";
import HideIcon from "@mui/icons-material/HideImageOutlined";
import type { Tag } from "~/lib/types/firebaseSchemas";
import PillComponent from "~/app/_components/PillComponent";

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
        <PillShowcase />
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
  // This showcases how to use the Table component, which is supposed to display rows of information that can be filtered and sorted by columns

  // Firstly, you should create a data type for your table, this should include all the columns you want to display in the table
  // Important: this data type must contain an id which can be a number or a string and is used for identifying the rows when performing actions
  interface ExampleUser {
    id: number;
    degree: string;
    name: string;
    age: number;
  }

  // Secondly, you should create an array with your data, this might come from the API.
  // If you need to rearrange the data provided by the API to conform to your data type, use the map function.
  const data: ExampleUser[] = [
    { id: 1, degree: "ITC", name: "Luis", age: 21 },
    { id: 2, degree: "ITC", name: "Sergio", age: 20 },
    { id: 3, degree: "ITC", name: "Alonso", age: 19 },
    { id: 4, degree: "ITC", name: "Oscar", age: 21 },
    { id: 5, degree: "ITC", name: "Luis", age: 21 },
    { id: 6, degree: "ITC", name: "Nicolas", age: 21 },
    { id: 7, degree: "ITC", name: "Nicolas", age: 21 },
    { id: 8, degree: "ITC", name: "Nicolas", age: 21 },
    { id: 9, degree: "ITC", name: "Nicolas", age: 21 },
    { id: 10, degree: "ITC", name: "Nicolas", age: 21 },
    { id: 11, degree: "ITC", name: "Nicolas", age: 21 },
    { id: 12, degree: "ITC", name: "Nicolas", age: 21 },
    { id: 13, degree: "ITD", name: "Nicolas", age: 21 },
    { id: 14, degree: "ITD", name: "Nicolas", age: 21 },
    { id: 15, degree: "ITD", name: "Nicolas", age: 21 },
    { id: 16, degree: "ITD", name: "Nicolas", age: 21 },
    { id: 17, degree: "ITD", name: "Nicolas", age: 21 },
    { id: 18, degree: "ITD", name: "Nicolas", age: 21 },
    { id: 19, degree: "ITD", name: "Nicolas", age: 21 },
    { id: 20, degree: "ITD", name: "Nicolas", age: 21 },
    { id: 21, degree: "ITD", name: "Nicolas", age: 21 },
    { id: 22, degree: "ITD", name: "Nicolas", age: 21 },
    { id: 23, degree: "ITD", name: "Nicolas", age: 21 },
    { id: 24, degree: "ITD", name: "Nicolas", age: 21 },
    { id: 25, degree: "ITD", name: "Nicolas", age: 21 },
    { id: 26, degree: "ITD", name: "Nicolas", age: 21 },
    { id: 27, degree: "ITD", name: "Nicolas", age: 21 },
  ];

  // You also need to provide column definitions for the table
  // Here is where you specify certain parameters for each column like their width in pixels and whether they can be filtered by or sorted

  // This must contain all the fields dictated by your data type above,
  // but if you don't want to display some information in the table, like for example an internal ID, you can choose to hide that column.
  const columns: TableColumns<ExampleUser> = {
    id: { visible: false },
    degree: {
      label: "Degree",
      width: 200,
      filterable: "list", // list: shows the user a list of row values to filter by
      // Optionally: You may provide a render function to present the information in any way you like
      // This is to be used when displaying a pill in the table, but can be used to add any component you like
      render(row) {
        return <span className="font-bold">{row.degree}</span>;
      },
    },
    name: {
      label: "Name",
      width: 400,
      sortable: true,
      filterable: "search-only", // search-only: The user must type their query
    },
    age: {
      label: "Age",
      width: 200,
      filterable: "list",
      sortable: true,
    },
  };

  // The final set of parameters are extra options you want to provide to the user
  // These are available when the user clicks the • • • button, or appear at the top when the user selects multiple rows
  // Note: Only use this if you have something extra that could be done, DO NOT use this to provide a delete option
  const extraOptions = [
    {
      label: "Hide",
      icon: <HideIcon />, // Find an icon you like under @mui/icons-material/*
      action: (ids: number[]) => {
        // If the button gets clicked, this function will get called with the list of ids that are supposed to be affected
        console.log("Hid", ids);
      },
    },
  ];

  return (
    <div className="h-[10px]">
      <hr />
      <h2 className="my-2 text-2xl font-medium">Tables</h2>
      {/* Include the table component in your page, give it a maximum height, as well as the data and columns */}
      {/* Optionally include extraOptions */}
      {/* multiselect: Show the checkboxes next to each row and in the header */}
      {/* deletable: Show delete actions for the rows */}
      {/* onDelete: Provide the functionality for what happens when a row is deleted, you get a list of ids */}
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

function PillShowcase() {
  const tags = [
    {
      name: "Green",
      color: "#009719",
      deleted: false,
    },
    {
      name: "Pink",
      color: "#CD4EC0",
      deleted: false,
    },
    {
      name: "Blue",
      color: "#0737E3",
      deleted: false,
    },
  ];

  const [tag, setTag] = useState(tags[0] as Tag);

  const dropdownCallback = async (tag: Tag) => {
    try {
      setTag(tag);
    } catch (error) {
      console.error("Error in pill dropdown callback", error);
    }
  };

  return (
    <div>
      <hr />
      <h2 className="my-2 text-2xl font-medium">Pills</h2>
      <div className="flex justify-start">
        <PillComponent
          currentTag={tag}
          allTags={tags}
          callBack={dropdownCallback}
        />
      </div>
    </div>
  );
}
