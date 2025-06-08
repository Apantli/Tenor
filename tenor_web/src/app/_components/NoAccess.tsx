import LockPersonIcon from "@mui/icons-material/LockPerson";
import { cn } from "~/lib/helpers/utils";
import MoreInformation from "./helps/MoreInformation";

interface Props {
  className?: string;
  label?: string;
}

export default function NoAccess({
  className,
  label = "You don't have access to this information because of your role",
}: Props) {
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center text-[80px] text-gray-500",
        className,
      )}
    >
      <div className="flex items-start pl-5">
        <LockPersonIcon fontSize="inherit" />
        <MoreInformation
          size="large"
          labelHTML={`${label}<br><span style='color: #ccc'>Ask an administrator for access if you believe this is a mistake.</span>`}
        />
      </div>
    </div>
  );
}
