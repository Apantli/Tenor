"use client";

import React from "react";
import InputCheckbox from "./inputs/InputCheckbox";
import HelpIcon from "@mui/icons-material/Help";

interface Props {
  isAutomatic: boolean;
  onChange: (value: boolean) => void;
}

export default function ItemAutomaticStatus({ isAutomatic, onChange }: Props) {
  return (
    <div className="mt-1 flex items-center justify-start gap-1 text-sm text-gray-500">
      <InputCheckbox checked={isAutomatic} onChange={onChange} />
      <div className="flex items-center">
        <strong>Automatic</strong>
        <HelpIcon
          className="ml-[3px] text-gray-500"
          data-tooltip-id="tooltip"
          data-tooltip-content="A status is assigned based on the progress of all its tasks."
          data-tooltip-place="top-start"
          style={{ width: "15px" }}
        />
      </div>
    </div>
  );
}
