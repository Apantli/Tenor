import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import { cn } from "~/lib/helpers/utils";

interface Props {
  sidebarShown: boolean;
  setSidebarShown: (value: boolean) => void;
  flipped?: boolean;
  label?: string;
}

export default function SidebarToggleIcon({
  sidebarShown,
  setSidebarShown,
  flipped,
  label = "details",
  ...props
}: Props & React.HTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className="flex items-center text-3xl text-gray-600"
      onClick={() => {
        setSidebarShown(!sidebarShown);
      }}
      data-tooltip-id="tooltip"
      data-tooltip-content={sidebarShown ? `Hide ${label}` : `Show ${label}`}
      data-tooltip-delay-show={500}
      {...props}
    >
      <MenuOpenIcon
        fontSize="inherit"
        className={cn({
          "rotate-180":
            (!flipped && sidebarShown) || (flipped && !sidebarShown),
        })}
      />
    </button>
  );
}
