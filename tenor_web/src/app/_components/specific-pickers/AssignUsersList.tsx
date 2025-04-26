import React, { useEffect } from "react";
import ProfilePicture from "../ProfilePicture"; // Asegúrate que esté bien el path

interface User {
  uid: string;
  displayName?: string;
  photoURL?: string;
}

interface Props {
  users?: User[];
  onChange: (users: User[]) => void;
  allUsers: User[];
}

export default function AssignUsersList({
  users,
  onChange,
  allUsers,
}: Props) {
  const [selectedUsers, setSelectedUsers] = React.useState<User[]>([]);

  useEffect(() => {
    if (users) {
      setSelectedUsers(users);
    }
  }, [users]);

  console.log("Usuarios recibidos:", selectedUsers);

  return (
    <div className="flex gap-2">
      {selectedUsers.map((user) => (
        <ProfilePicture key={user.uid} user={user} />
      ))}
    </div>
  );
}
