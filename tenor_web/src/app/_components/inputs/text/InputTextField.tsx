import React from "react";
import InputField, {
  type Props as InputFieldProps,
} from "./GenericTextInputField";

interface Props {
  label?: string;
  labelClassName?: string;
  containerClassName?: string;
  disableAI?: boolean;
  aiTitle?: string;
  ref?: React.Ref<HTMLInputElement>;
  chatPosition?: "top" | "bottom" | "left" | "right";
}

export default function InputTextField({
  label,
  id,
  labelClassName,
  containerClassName,
  className,
  disableAI,
  aiTitle,
  value,
  onChange,
  ref,
  chatPosition,
  ...props
}: Props & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <InputField
      chatPlacement={chatPosition}
      label={label}
      id={id}
      labelClassName={labelClassName}
      containerClassName={containerClassName}
      className={className}
      disableAI={disableAI}
      aiTitle={aiTitle}
      value={value as string}
      disablePlaceholder
      ref={ref}
      onChange={onChange as InputFieldProps["onChange"]}
      {...props}
    />
  );
}
