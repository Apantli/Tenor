import React from "react";
import DeleteButton from "~/app/_components/buttons/DeleteButton";
import Popup from "~/app/_components/Popup";

interface Props {
  showPopup: boolean;
  setShowPopup: (show: boolean) => void;
}

export default function EditSprintPopup({ showPopup, setShowPopup }: Props) {
  return (
    <Popup
      show={showPopup}
      dismiss={() => setShowPopup(false)}
      className="min-h-[300px] w-[500px]"
      size="small"
      reduceTopPadding
      title={
        <h1 className="mb-4 text-3xl">
          <span className="font-bold">Edit Sprint</span>
        </h1>
      }
      footer={<DeleteButton>Delete sprint</DeleteButton>}
    ></Popup>
  );
}
