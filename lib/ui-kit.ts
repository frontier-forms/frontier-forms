import { JSONSchema7TypeName } from "json-schema";
import { ReactNode, ComponentType } from "react";
import { FieldState } from "final-form";

export type UIKITFieldProps = FieldState & { children?: ReactNode };
export interface UIKitResolver {
  (path: string, type: JSONSchema7TypeName, required: boolean, children?: ReactNode): ComponentType<UIKITFieldProps>;
}
