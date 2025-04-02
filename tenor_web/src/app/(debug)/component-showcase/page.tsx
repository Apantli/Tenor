"use client";

import Link from "next/link";
import React , { useState } from "react";
import SecondaryButton from "~/app/_components/SecondaryButton";
import Table, { type TableColumns } from "~/app/_components/table/Table";
import { useAlert } from "~/app/_hooks/useAlert";
import HideIcon from "@mui/icons-material/HideImageOutlined";
import type { Tag } from "~/lib/types/firebaseSchemas";
import PillComponent from "~/app/_components/PillComponent";
import Popup, { SidebarPopup } from "~/app/_components/Popup";
import PrimaryButton from "~/app/_components/PrimaryButton";
import DeleteButton from "~/app/_components/DeleteButton";
import useConfirmation from "~/app/_hooks/useConfirmation";
import { SegmentedControl } from "~/app/_components/SegmentedControl";
import { DatePicker } from "~/app/_components/DatePicker";

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
        <PopupShowcase />
        <ConfirmationShowcase />
        <DatePickerShowcase />
        <SegmentedControlShowcase />
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
    { id: 13, degree: "ITC", name: "Nicolas", age: 21 },
    { id: 14, degree: "ITC", name: "Nicolas", age: 21 },
    { id: 15, degree: "ITC", name: "Nicolas", age: 21 },
    { id: 16, degree: "ITC", name: "Nicolas", age: 21 },
    { id: 17, degree: "ITC", name: "Nicolas", age: 21 },
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
    <div>
      <hr />
      <h2 className="my-2 text-2xl font-medium">Tables</h2>
      {/* Include the table component in your page, give it a maximum height, as well as the data and columns */}
      {/* Optionally include extraOptions */}
      {/* multiselect: Show the checkboxes next to each row and in the header */}
      {/* deletable: Show delete actions for the rows */}
      {/* onDelete: Provide the functionality for what happens when a row is deleted, you get a list of ids */}
      <Table
        className="h-[250px]"
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
  const [tag2, setTag2] = useState(tags[1] as Tag);

  const dropdownCallback = async (tag: Tag) => {
    setTag(tag);
  };
  const dropdownCallback2 = async (tag: Tag) => {
    setTag2(tag);
  };

  return (
    <div>
      <hr />
      <h2 className="my-2 text-2xl font-medium">Pills</h2>
      <div className="flex justify-start gap-2">
        <PillComponent
          currentTag={tag}
          allTags={tags}
          callBack={dropdownCallback}
          labelClassName="w-32"
        />
        <PillComponent
          currentTag={tag2}
          allTags={tags}
          callBack={dropdownCallback2}
          labelClassName="w-64"
        />
      </div>
    </div>
  );
}

function PopupShowcase() {
  // Theres 2 kinds of popups you can use: small, large
  // These are customizable so that you can show whatever information you want to the user.

  // You are responsible for handling the visibility state for the popup (think of isPresented for sheets in SwiftUI)
  const [showSmallPopup, setShowSmallPopup] = useState(false);
  const [showLargePopup, setShowLargePopup] = useState(false);
  // Additionally, if you want to show a sidebar popup inside another popup, you also need to keep track of that state
  const [showSidebarPopup, setShowSidebarPopup] = useState(false);

  return (
    <div>
      <hr />
      <h2 className="my-2 text-2xl font-medium">Popup</h2>
      <div className="flex gap-2">
        {/* You can trigger the popup with your state variable however you like */}
        <SecondaryButton onClick={() => setShowSmallPopup(true)}>
          Show small popup
        </SecondaryButton>
        <SecondaryButton onClick={() => setShowLargePopup(true)}>
          Show large popup
        </SecondaryButton>
      </div>
      {/* Popups take the show state variable, a size, what happens when they're dismissed */}
      {/* They also have special sections that can be used to place certain elements */}
      {/* Footer: Use this section to place buttons on the bottom */}
      {/* Sidebar: Use this section to place a vertical divider and have things on the right */}
      <Popup
        show={showSmallPopup}
        size="small"
        dismiss={() => setShowSmallPopup(false)}
        showEdit
        footer={
          <div className="flex gap-2">
            <SecondaryButton>Show user stories</SecondaryButton>
            <DeleteButton>Delete epic</DeleteButton>
          </div>
        }
      >
        {/* Inside the popup, you can include whatever content you want */}
        <h1 className="mb-5 text-2xl">
          <strong>EP01:</strong> Login System
        </h1>
        <p className="text-lg">
          The Login System enables users to securely access their accounts using
          email and password authentication. It includes features like form
          validation, password recovery, and optional social login integration.
          The system ensures a seamless and secure user experience while
          maintaining compliance with authentication best practices.
        </p>
      </Popup>
      {/* Large popup example */}
      <Popup
        show={showLargePopup}
        size="large"
        dismiss={() => {
          setShowLargePopup(false);
          setShowSidebarPopup(false);
        }}
        showEdit
        footer={
          <PrimaryButton onClick={() => setShowSidebarPopup(true)}>
            Open sidebar
          </PrimaryButton>
        }
        sidebar={<div className="w-48">Sidebar content goes here</div>}
      >
        <h1 className="mb-5 text-2xl">
          <strong>US03:</strong> Validate user login credentials
        </h1>
        <p className="text-lg">
          As a user, I want to enter my login credentials (username/email and
          password) and have them validated, so that I can access my account
          securely.
        </p>

        {/* Include SidebarPopups inside a Popup */}
        <SidebarPopup
          show={showSidebarPopup}
          dismiss={() => setShowSidebarPopup(false)}
        >
          <h1 className="mb-5 text-2xl">
            <strong>US03:</strong> Validate user login credentials
          </h1>
          <p className="text-lg">
            As a user, I want to enter my login credentials (username/email and
            password) and have them validated, so that I can access my account
            securely.
          </p>
        </SidebarPopup>
      </Popup>
    </div>
  );
}

function ConfirmationShowcase() {
  // There is a specialized version of popup that can be accessed via a hook to request the user for confirmation

  // Call the useConfirmation hook to get a confirm function
  const confirm = useConfirmation();

  const handleDestructiveAction = async () => {
    // Await for a response by calling the function with an await, you may specify a title, a message, confirmation message, cancellation message, and whether this is a destructive action
    // By default, the action is considered destructive and you don't need to specify confirmation or cancellation message
    if (
      await confirm(
        "Are you sure?",
        "This action is not revertible",
        "Delete item",
      )
    ) {
      // If the function returns true, the user confirmed the action
      console.log("User confirmed");
      await confirm(
        "Are you really really sure?",
        "This action is not revertible",
        "Delete item",
      );
    } else {
      // Otherwise, the user clicked cancel or dismissed the popup in another way
      console.log("User cancelled");
    }
  };

  const handlePositiveAction = async () => {
    // Here is how you can specify a non-destructive confirmation popup
    if (
      await confirm(
        "Are you sure?",
        "You are about to create an account",
        "Create account",
        "Cancel",
        /*destructive=*/ false,
      )
    ) {
      console.log("User confirmed");
    } else {
      console.log("User cancelled");
    }
  };

  return (
    <div>
      <hr />
      <h2 className="my-2 text-2xl font-medium">Confirmation warning</h2>
      <div className="flex gap-2">
        <DeleteButton onClick={handleDestructiveAction}>
          Destructive Action
        </DeleteButton>
        <SecondaryButton onClick={handlePositiveAction}>
          Positive Action
        </SecondaryButton>
      </div>
    </div>
  );
}

// Showcase of the segmented control component
function SegmentedControlShowcase(){
  // Default value must match with one of the options (in this case "Selected option" as it is seen in the options array).
  const [selectedValue, setSelectedValue] = useState("Selected Option");
  return (
    <div>
      <hr />
      <h2 className="my-2 text-2xl font-medium">Segmented Control</h2>
      <SegmentedControl 
        // Can add more than 2 options
        options={['Selected Option', 'Option']} 
        selectedOption={selectedValue}
        onChange={setSelectedValue}
        // Adjust the text and component size to your needs"
        className="w-full max-w-md"
      />
    </div>
  );
};

function DatePickerShowcase (){
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  return (
    <div>
      <hr />
      <h2 className="my-2 text-2xl font-medium">Date Picker</h2>
      <DatePicker
        selectedDate={selectedDate}
        onChange={setSelectedDate}
        placeholder="Select a date"
        className="w-64"
      />
    </div>
  )
}