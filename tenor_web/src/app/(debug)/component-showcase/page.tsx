"use client";

import Link from "next/link";
import React, { useState } from "react";
import Table, { type TableColumns } from "~/app/_components/table/Table";
import { useAlert } from "~/app/_hooks/useAlert";
import HideIcon from "@mui/icons-material/HideImageOutlined";
import type { Tag, WithId } from "~/lib/types/firebaseSchemas";
import PillComponent from "~/app/_components/inputs/pickers/PillComponent";
import Popup, { SidebarPopup } from "~/app/_components/Popup";
import useConfirmation from "~/app/_hooks/useConfirmation";
import FileList from "~/app/_components/inputs/FileList";
import LinkList from "~/app/_components/inputs/LinkList";
import MemberTable from "~/app/_components/inputs/MemberTable";
import InputFileField from "~/app/_components/inputs/InputFileField";
import { SegmentedControl } from "~/app/_components/SegmentedControl";
import { DatePicker } from "~/app/_components/inputs/pickers/DatePicker";
import TagComponent from "~/app/_components/TagComponent";
import { UserPicker } from "~/app/_components/inputs/pickers/UserPicker";
import { useFirebaseAuth } from "~/app/_hooks/useFirebaseAuth";
import useGhostTableStateManager from "~/app/_hooks/useGhostTableStateManager";
import DropdownColorPicker from "~/app/_components/inputs/pickers/DropdownColorPicker";
import { acceptableTagColors, getPillColorByActivityType } from "~/utils/helpers/colorUtils";
import type { UserCol } from "~/lib/types/columnTypes";
import type { UserPreview } from "~/lib/types/detailSchemas";
import DeleteButton from "~/app/_components/inputs/buttons/DeleteButton";
import InputTextField from "~/app/_components/inputs/text/InputTextField";
import InputTextAreaField from "~/app/_components/inputs/text/InputTextAreaField";
import TertiaryButton from "~/app/_components/inputs/buttons/TertiaryButton";
import PrimaryButton from "~/app/_components/inputs/buttons/PrimaryButton";
import SecondaryButton from "~/app/_components/inputs/buttons/SecondaryButton";
import { defaultRoleList } from "~/lib/defaultValues/roles";

// Z index documentation:
// 0-1000: Default z-index range for most elements (feel free to contribute to the documentation)
//   10: Ghost table rows
//   60: Sticky table header
// 100000: Used for popups
// 200000: Used for confirmation popups
// 300000: Used for alerts
// 400000: Used for dropdowns
// 500000: Used for tooltips

// This file is to showcase how to use the components available in Tenor
export default function ComponentShowcasePage() {
  return (
    <main className="p-4">
      <Link className="text-blue-500" href="/">
        Go back to Tenor
      </Link>
      <h1 className="my-5 text-3xl font-semibold">Component Showcase</h1>
      <div className="flex flex-col gap-10">
        <ButtonShowcase />
        <AlertShowcase />
        <PillShowcase />
        <TagShowcase />
        <TableShowcase />
        <PopupShowcase />
        <ConfirmationShowcase />
        <InputComponents />
        <DatePickerShowcase />
        <EditableBoxShowCase />
        <SegmentedControlShowcase />
        <DropdownColorPickerShowcase />
      </div>
    </main>
  );
}

function ButtonShowcase() {
  // This showcases how to use the buttons available in Tenor
  // You can use the PrimaryButton and SecondaryButton components to create buttons with different styles

  return (
    <div>
      <hr />
      <h2 className="my-2 text-2xl font-medium">Buttons</h2>
      <div className="flex gap-2">
        <PrimaryButton>Primary Button</PrimaryButton>
        <SecondaryButton>Secondary Button</SecondaryButton>
        <TertiaryButton>Tertiary Button</TertiaryButton>
        <DeleteButton>Delete Button</DeleteButton>
      </div>
      <p className="mt-4">Disabled buttons</p>
      <div className="mt-2 flex gap-2">
        <PrimaryButton disabled>Primary Button</PrimaryButton>
        <SecondaryButton disabled>Secondary Button</SecondaryButton>
        <TertiaryButton disabled>Tertiary Button</TertiaryButton>
        <DeleteButton disabled>Delete Button</DeleteButton>
      </div>
      <p className="mt-4">Buttons with a loading state</p>
      <div className="mt-2 flex gap-2">
        <PrimaryButton loading>Primary Button</PrimaryButton>
        <SecondaryButton loading>Secondary Button</SecondaryButton>
        <DeleteButton loading>Delete Button</DeleteButton>
      </div>
      <p className="mt-4">Links that look like buttons</p>
      <div className="mt-2 flex gap-2">
        {/* When you include an href prop, the underlying component automatically becomes a <Link /> component instead of a button */}
        {/* This also works with dropdown buttons */}
        <PrimaryButton href="/component-showcase/why">
          Go to other page
        </PrimaryButton>
        {/* You can use any prop for links such as target="_blank" */}
        <SecondaryButton href="/component-showcase/why" target="_blank">
          Open in another tab
        </SecondaryButton>
        <TertiaryButton href="/component-showcase/why">
          Go to other page
        </TertiaryButton>
      </div>
    </div>
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
    number: number;
    degree: string;
    name: string;
    age: number;
  }

  // Secondly, you should create an array with your data, this might come from the API.
  // If you need to rearrange the data provided by the API to conform to your data type, use the map function.
  const [data, setData] = useState<ExampleUser[]>([
    { id: 1, number: 5, degree: "ITC", name: "Luis", age: 21 },
    // { id: 2, number: 5, degree: "ITC", name: "Sergio", age: 20 },
    // { id: 3, number: 5, degree: "ITC", name: "Alonso", age: 19 },
    // { id: 4, number: 5, degree: "ITC", name: "Oscar", age: 21 },
    // { id: 5, number: 5, degree: "ITC", name: "Luis", age: 21 },
    // { id: 6, number: 5, degree: "ITC", name: "Nicolas", age: 21 },
  ]);

  const dummyGhostData: ExampleUser[] = [
    {
      id: -1,
      number: -1,
      degree: "ITC",
      name: "First person created by AI",
      age: 21,
    },
    {
      id: -2,
      number: -1,
      degree: "ITC",
      name: "Second person created by AI",
      age: 21,
    },
    {
      id: -3,
      number: -1,
      degree: "ITC",
      name: "Third person created by AI",
      age: 21,
    },
  ];

  // You also need to provide column definitions for the table
  // Here is where you specify certain parameters for each column like their width in pixels and whether they can be filtered by or sorted

  // This must contain all the fields dictated by your data type above,
  // but if you don't want to display some information in the table, like for example an internal ID, you can choose to hide that column.
  const columns: TableColumns<ExampleUser> = {
    id: { visible: false },
    number: {
      label: "Number",
      width: 80,
      hiddenOnGhost: true,
    },
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

  const generationTime = 5000;

  // Helper hook to manage the state of the ghost items
  const {
    onAccept,
    onReject,
    beginLoading,
    finishLoading,
    ghostData,
    ghostRows,
    setGhostRows,
  } = useGhostTableStateManager<ExampleUser, number>(async (ids: number[]) => {
    // Use the callback to perform the action you want when the user accepts the ghosts
    const newData = data.concat(
      dummyGhostData.filter((ghost) => ids.includes(ghost.id)),
    );
    setData(newData);
  });

  const generate = async () => {
    beginLoading(3);
    // Simulate ai generation waiting time
    await new Promise((resolve) => setTimeout(resolve, generationTime));
    finishLoading(dummyGhostData);
  };

  return (
    <div>
      <hr />
      <h2 className="my-2 text-2xl font-medium">Tables</h2>
      <div className="flex w-full justify-end gap-2">
        <PrimaryButton
          onClick={generate}
          disabled={ghostRows !== undefined && ghostData === undefined}
        >
          Generate with AI
        </PrimaryButton>
        <SecondaryButton
          onClick={() => {
            finishLoading(dummyGhostData);
          }}
        >
          Create manually
        </SecondaryButton>
        <SecondaryButton
          onClick={() => {
            beginLoading(3);
          }}
        >
          Show loading
        </SecondaryButton>
      </div>
      {/* Include the table component in your page, give it a maximum height, as well as the data and columns */}
      {/* Optionally include extraOptions */}
      {/* multiselect: Show the checkboxes next to each row and in the header */}
      {/* deletable: Show delete actions for the rows */}
      {/* onDelete: Provide the functionality for what happens when a row is deleted, you get a list of ids */}
      <Table
        className="h-[250px]"
        data={data}
        ghostData={ghostData}
        acceptGhosts={onAccept}
        rejectGhosts={onReject}
        ghostRows={ghostRows}
        setGhostRows={setGhostRows}
        ghostLoadingEstimation={generationTime}
        columns={columns}
        extraOptions={extraOptions}
        multiselect
        deletable
        onDelete={(ids) => console.log("Deleted", ids)}
        tableKey="component-showcase-table" // Each table must have a unique key. This is used to identify the table in the local storage
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

function TagShowcase() {
  // This showcases how to use the Tag component, which is supposed to display a tag with a name and a color

  const tags = [
    {
      name: "S",
      color: "#009719",
      deleted: false,
    },
    {
      name: "L",
      color: "#CC9900", // Darker yellow color
      deleted: false,
    },
    {
      name: "M",
      color: "#9932CC", // Bright purple color
      deleted: false,
    },
    {
      name: "P0",
      color: "#EA2B4E", // App fail color
      deleted: false,
    },
  ];

  const coloredTags = acceptableTagColors.map((color) => ({
    name: "Tag",
    color,
    deleted: false,
  }));

  return (
    <div>
      <hr />
      <h2 className="my-2 text-2xl font-medium">Tags</h2>
      <div className="flex justify-start gap-2">
        {tags.map((tag) => (
          <TagComponent
            key={tag.name}
            color={tag.color}
            reducedPadding
            className="min-w-8"
          >
            {tag.name}
          </TagComponent>
        ))}
      </div>
      <br />
      <div className="flex justify-start gap-2">
        {coloredTags.map((tag, i) => (
          <TagComponent
            key={i}
            color={tag.color}
            reducedPadding
            className="min-w-8"
          >
            {tag.name}
          </TagComponent>
        ))}
      </div>
      <br />
      <div className="flex justify-start gap-2">
        <TagComponent>US001</TagComponent>
        <TagComponent onDelete={() => console.log("HELLO")}>US003</TagComponent>
        <TagComponent onDelete={() => console.log("HELLO")} color="#009719">
          Login
        </TagComponent>
      </div>
      <br />
      <div className="flex justify-start gap-2">
        <TagComponent color={getPillColorByActivityType("create")}>Create</TagComponent>
        <TagComponent color={getPillColorByActivityType("update")}>Update</TagComponent>
        <TagComponent color={getPillColorByActivityType("delete")}>Delete</TagComponent>
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
        editMode={false}
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
        editMode={false}
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
          footer={<DeleteButton>Delete task</DeleteButton>}
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
        "This action is not reversible",
        "Delete item",
      )
    ) {
      // If the function returns true, the user confirmed the action
      console.log("User confirmed");
      await confirm(
        "Are you really really sure?",
        "This action is not reversible",
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

function InputComponents() {
  const teamMembers: UserCol[] = [
    {
      id: "1",
      photoURL: undefined,
      displayName: "Alonso Huerta",
      email: "email@addres.com",
      roleId: "developer_role_id",
    },
    {
      id: "2",
      photoURL: undefined,
      displayName: "Sergio Gonzalez",
      email: "email@addres.com",
      roleId: "admin_role_id",
    },
    {
      id: "3",
      photoURL: undefined,
      displayName: "Luis Amado",
      email: "email@addres.com",
      roleId: "viewer_role_id",
    },
  ];

  const links = [
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://www.tiktok.com/@ramizeinn/video/7474372494661635358",
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://www.tiktok.com/@ramizeinn/video/7474372494661635358",
  ];

  return (
    <div>
      <InputTextField id="component-showcase-text-field" label="Text Field" />
      <InputFileField
        label="File"
        accept="image/*"
        image={null}
        handleImageChange={() => {
          console.log("File added");
        }}
      />

      <InputTextAreaField
        label="Text Area"
        id="component-showcase-text-area-field"
      />
      <FileList
        label="Context Files"
        files={[]}
        memoryLimit={100_000_000} // 100MB
        handleFileAdd={() => {
          console.log("File added");
        }}
        handleFileRemove={() => {
          console.log("File added");
        }}
      />
      <LinkList
        label="Context Links"
        links={links.map((link) => ({
          link: link,
          content: "placeholder",
        }))}
        handleLinkAdd={() => {
          console.log("File added");
        }}
        handleLinkRemove={() => {
          console.log("File added");
        }}
      />
      <MemberTable
        label="Team Members"
        teamMembers={teamMembers}
        handleMemberAdd={() => {
          console.log("File added");
        }}
        handleMemberRemove={() => {
          console.log("File added");
        }}
        handleEditMemberRole={() => {
          console.log("File added");
        }}
        roleList={defaultRoleList}
      />
    </div>
  );
}

// Showcase of the segmented control component
function SegmentedControlShowcase() {
  // Default value must match with one of the options to prevent bugs
  // (in this case "Selected option" as it is seen in the options array).
  const [selectedValue, setSelectedValue] = useState("Selected Option");
  return (
    <div>
      <hr />
      <h2 className="my-2 text-2xl font-medium">Segmented Control</h2>
      <SegmentedControl
        // Can add more than 2 options, this is just an example.
        options={["Selected Option", "Option"]}
        selectedOption={selectedValue}
        onChange={setSelectedValue}
        // Adjust the text and component size to the desired size
        className="w-full max-w-md"
      />
    </div>
  );
}

// Showcase of the date picker component
function DatePickerShowcase() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  return (
    <div>
      <hr />
      <h2 className="my-2 text-2xl font-medium">Date Picker</h2>
      <DatePicker
        selectedDate={selectedDate}
        onChange={setSelectedDate}
        // Any placeholder, can be due date or something similar
        placeholder="Select a date"
        // Adjust for any size
        className="h-3.5 w-48"
      />
    </div>
  );
}

function EditableBoxShowCase() {
  const [selectedPerson, setSelectedPerson] = useState<
    WithId<UserPreview> | undefined
  >(undefined);
  const { user } = useFirebaseAuth();

  const mockUser = {
    uid: user?.uid ?? "",
    displayName: user?.displayName ?? "",
    photoURL: user?.photoURL ?? "",
  };

  // Option = id, name, image? (in case is not used for users), user? (profilepicture component accepts only users)
  const people: WithId<UserPreview>[] = [
    {
      id: mockUser.uid,
      email: "",
      ...mockUser,
    },
  ];

  return (
    <div>
      <hr />
      <h2 className="my-2 text-2xl font-medium">Editable Box</h2>
      <UserPicker
        options={people}
        selectedOption={selectedPerson}
        onChange={setSelectedPerson}
        placeholder="Select a person"
        className="h-4 w-48"
      />
    </div>
  );
}

function DropdownColorPickerShowcase() {
  const [color, setColor] = useState("#009719");
  return (
    <div>
      <hr />
      <h2 className="my-2 text-2xl font-medium">Dropdown Color Picker</h2>
      <DropdownColorPicker
        label="Select a color"
        value={color}
        onChange={setColor}
        className="w-48"
      />
    </div>
  );
}
