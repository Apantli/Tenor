import type { User } from "firebase/auth";
import ProfilePicture from "~/app/_components/ProfilePicture";
import EditIcon from "@mui/icons-material/EditOutlined";
import { useRef, useState } from "react";
import PrimaryButton from "~/app/_components/inputs/buttons/PrimaryButton";
import CheckIcon from "@mui/icons-material/Check";
import InputTextField from "~/app/_components/inputs/text/InputTextField";

interface ProfileCardProps {
  user: User | null;
}

export default function ProfileCard({ user }: ProfileCardProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const openFilePicker = () => {
    console.log("Opening file picker");
    fileInputRef.current?.click();
  };
  const [editMode, setEditMode] = useState(false);
  const [userName, setUserName] = useState<string>("");
  return (
    <div className="flex w-[500px]">
      {/* Picture Edit  */}
      <div className="group relative w-[160px]">
        <input
          accept="image/*"
          type="file"
          className="hidden"
          ref={fileInputRef}
        />
        {/* Profile Picture */}
        <ProfilePicture
          hideTooltip={true}
          user={user}
          className="h-auto w-full"
        />
        {/* Input Button */}

        <button
          onClick={openFilePicker}
          className="absolute inset-0 flex items-center justify-center rounded-full bg-gray-500 opacity-0 transition-opacity group-hover:opacity-40"
        >
          <EditIcon sx={{ fontSize: 48 }} />
        </button>
      </div>
      {/* Information */}
      <div className="ml-[20px] flex w-full flex-col">
        <div className="mb-5 flex w-full items-stretch justify-between">
          <div className="flex items-center pr-[40px]">
            {editMode ? (
              <InputTextField
                disableAI={true}
                value={userName}
                onChange={(event) => {
                  setUserName(event.target.value);
                }}
              />
            ) : (
              <strong className="text-xl">{user?.displayName}</strong>
            )}
          </div>
          <PrimaryButton
            onClick={() => {
              if (!editMode) {
                setUserName(user?.displayName ?? "");
              }
              setEditMode(!editMode);
            }}
          >
            {editMode ? (
              <CheckIcon sx={{ fontSize: 20 }} />
            ) : (
              <EditIcon sx={{ fontSize: 20 }} />
            )}
          </PrimaryButton>
        </div>
        <p>{user?.email}</p>
      </div>
    </div>
  );
}
