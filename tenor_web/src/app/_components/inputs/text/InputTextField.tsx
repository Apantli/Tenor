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
  ...props
}: Props & React.InputHTMLAttributes<HTMLInputElement>) {
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
      disablePlaceholder
      ref={ref}
      onChange={onChange as InputFieldProps["onChange"]}
      {...props}
    />
  );
}
