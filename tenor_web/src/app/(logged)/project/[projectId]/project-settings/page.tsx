"use client";

import InputFileField from "~/app/_components/inputs/InputFileField";
import { useState } from "react";

export default function ProjectGeneralSettings() {
  const [icon, setImage] = useState<File | null>(null);
  function handleImageChange(file: File) {
    setImage(file);
  }
  return (
    <div className="flex flex-col">
      <h1 className="text-2xl font-bold">General</h1>
      <p className="font-bold">Project icon</p>
      <div className="flex flex-row gap-x-3">
        <img src="/colored_logo.png" alt="Project logo" />
        <InputFileField
          label="Icon"
          accept="image/*"
          className="h-12"
          image={icon}
          handleImageChange={handleImageChange}
        />
      </div>
    </div>
  );
}
