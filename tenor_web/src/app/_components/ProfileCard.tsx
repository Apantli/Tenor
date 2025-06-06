import ProfilePicture from "~/app/_components/ProfilePicture";
import InputTextField from "~/app/_components/inputs/text/InputTextField";
import { useFirebaseAuth } from "../_hooks/useFirebaseAuth";
import Popup from "./Popup";
import { useState } from "react";
import InputFileField from "./inputs/InputFileField";
import { api } from "~/trpc/react";
import { toBase64 } from "~/lib/helpers/base64";
import { useInvalidateQueriesUser } from "../_hooks/invalidateHooks";

interface ProfileCardProps {
  show: boolean;
  setShow: (show: boolean) => void;
}

export default function ProfileCard({ show, setShow }: ProfileCardProps) {
  const user = useFirebaseAuth().user;

  const { mutateAsync: updateUser, isPending } =
    api.users.updateUser.useMutation();

  const [image, setImage] = useState<File | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [editMode, setEditMode] = useState<boolean>(false);

  const invalidateQueriesUser = useInvalidateQueriesUser();

  return (
    <Popup
      show={show}
      saving={isPending}
      size={"small"}
      dismiss={() => {
        setShow(false);
        setEditMode(false);
      }}
      editMode={editMode}
      setEditMode={async (value) => {
        if (editMode) {
          await updateUser({
            displayName: userName,
            photoBase64: image
              ? ((await toBase64(image)) as string)
              : undefined,
          });
          await invalidateQueriesUser(user?.uid ?? "");
          await user?.reload();
        }
        setUserName(user?.displayName ?? "");
        setEditMode(value);
      }}
      className="h-[350px] w-[600px]"
      title={<h1 className="mb-4 items-center text-3xl font-bold">Profile</h1>}
    >
      <div className="flex h-full flex-col justify-center">
        {editMode ? (
          <div>
            <div className="flex flex-row gap-x-3">
              <ProfilePicture
                user={{
                  displayName: userName,
                  uid: user?.uid ?? "",
                  photoURL: image
                    ? URL.createObjectURL(image)
                    : (user?.photoURL ?? undefined),
                }}
                size={80}
                hideTooltip={true}
              />
              <InputFileField
                label=""
                accept="image/*"
                containerClassName="mt-auto h-12"
                image={image}
                handleImageChange={(file) => {
                  setImage(file);
                }}
                displayText="Change profile picture..."
              />
            </div>
            <InputTextField
              label="Display Name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your display name"
              containerClassName="my-4"
              disableAI={true}
            />
          </div>
        ) : (
          <div className="flex">
            {/* Profile Picture */}
            <ProfilePicture hideTooltip={true} user={user} size={160} />
            {/* Information */}
            <div className="ml-[20px] flex h-full flex-col justify-center pb-5">
              <div className="mb-5 flex w-full flex-col items-stretch justify-between">
                <strong className="text-xs">Username</strong>
                <p className="text-xl">{user?.displayName}</p>
              </div>
              <div className="mb-5 flex w-full flex-col items-stretch justify-between">
                <strong className="text-bold text-xs">Email</strong>
                <p className="text-xl">{user?.email}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Popup>
  );
}
