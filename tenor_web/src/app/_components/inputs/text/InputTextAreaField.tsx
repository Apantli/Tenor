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
  ref?: React.Ref<HTMLTextAreaElement>;
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
  ...props
}: Props & React.InputHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <InputField
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
