import MoreInformation, { type IconSize } from "../MoreInformation";

interface Props {
  size?: IconSize;
}

export default function AIDisclaimer({ size = "small" }: Props) {
  return (
    <MoreInformation
      label="The data shared, including files and links, is private and used solely as context for the AI."
      size={size}
    />
  );
}
