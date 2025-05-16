import React, { useEffect } from "react";
import ProfilePicture from "../ProfilePicture";

interface User {
  uid: string;
  displayName?: string;
  photoURL?: string;
}

interface Props {
  users?: User[];
}

export default function AssignUsersList({
  users,
}: Props) {
  const [selectedUsers = users ?? [], setSelectedUsers] = React.useState<User[]>([]);
  
  useEffect(() => {
    if (users) {
      setSelectedUsers(users);
    }
  });

  console.log("Usuarios recibidos:", selectedUsers);

  return (
    <div className="flex gap-2 relative marginLef" >
      {selectedUsers.map((user, index) => (
        <ProfilePicture key={user.uid} user={user} pictureClassName={index === 0 ? '' : '-ml-4'} />
      ))}
    </div>
  );
}
