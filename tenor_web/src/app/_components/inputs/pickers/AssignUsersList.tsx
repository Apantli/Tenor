import React, { useEffect } from "react";
import ProfilePicture from "../../ProfilePicture";

interface User {
  uid: string;
  displayName?: string;
  photoURL?: string;
}

interface Props {
  users?: User[];
  maxUsers?: number;
}

export default function AssignUsersList({ users, maxUsers = 10 }: Props) {
  const [selectedUsers = users ?? [], setSelectedUsers] = React.useState<
    User[]
  >([]);

  useEffect(() => {
    if (users) {
      setSelectedUsers(users);
    }
  }, [users]);

  const displayUsers = selectedUsers.slice(0, maxUsers);
  const additionalUsers = selectedUsers.length - maxUsers;

  return (
    <div className="relative flex items-center gap-2">
      {displayUsers.map((user, index) => (
        <ProfilePicture
          key={user.uid}
          user={user}
          pictureClassName={index === 0 ? "" : "-ml-4"}
        />
      ))}
      {additionalUsers > 0 && (
        <div className="flex h-8 w-8 -ml-4 items-center justify-center rounded-full bg-gray-300 text-xs font-medium text-gray-700">
          +{additionalUsers}
        </div>
      )}
    </div>
  );
}
