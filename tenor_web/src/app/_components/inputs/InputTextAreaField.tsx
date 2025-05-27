import React from "react";

import InputField, {
  type Props as InputFieldProps,
} from "./GenericTextInputField";
interface Props {
  label?: string | React.ReactNode;
  labelClassName?: string;
  containerClassName?: string;
  disableAI?: boolean;
  aiTitle?: string;
  ref?: React.Ref<HTMLTextAreaElement>;
  chatPosition?: "top" | "bottom" | "left" | "right";
}

export default function InputTextAreaField({
  label,
  id,
  labelClassName,
  containerClassName,
  className,
  disableAI,
  aiTitle,
  value,
  ref,
  onChange,
  chatPosition,
  ...props
}: Props & React.InputHTMLAttributes<HTMLTextAreaElement>) {
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
      onChange={onChange as InputFieldProps["onChange"]}
      isTextArea
      ref={ref}
      {...props}
    />
  );
}
