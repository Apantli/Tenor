"use client";

import React from "react";
import Popup from "~/app/_components/Popup";

interface Props {
  showPopup: boolean;
  setShowPopup: (show: boolean) => void;
}

export default function CreateStatusPopup({ showPopup, setShowPopup }: Props) {
  // REACT

  // TRPC

  // GENERAL

  // HANDLES
  const handleDismiss = () => {
    setShowPopup(false);
  };

  return (
    <Popup
      show={showPopup}
      size="large"
      className="min-h-[400px] min-w-[400px]"
      dismiss={async () => {
        handleDismiss();
      }}
      // disablePassiveDismiss={isModified()}
      footer={<div className="flex gap-2">WIP</div>}
      title={
        <>
          <h1 className="mb-4 text-3xl">
            <span className="font-bold">Conversation Mode</span>
          </h1>
        </>
      }
    >
      WIP
    </Popup>
  );
}
