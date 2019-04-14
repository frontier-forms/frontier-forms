import { Component, Children, createElement, ReactChildren } from "react";
import { FrontierDataProps, schemaFromDataProps } from "../data";
import { JSONSchema7 } from "json-schema";
import { FormApi, FieldState } from "final-form";
import { getFormFromSchema } from "../core/core";

export interface FrontierProps extends FrontierDataProps {
  uiKit?: {};
  initialValues?: {}
}

export class Frontier extends Component<FrontierProps> {
  schema: JSONSchema7;
  form: FormApi;

  componentDidMount() {
    this.schema = schemaFromDataProps(this.props);
    this.form = getFormFromSchema(this.schema, this.onSubmit, this.onFieldUpdate);
  }

  onSubmit = (values: object) => {
    // call Frontier Data save handler 
  }

  onFieldUpdate = (fieldName: string, state: FieldState) => { }

  renderProps() {
    return {};
  }

  render() {
    const child = Children.only(this.props.children) as (p: any) => JSX.Element;
    if (child) {
      if (typeof child !== 'function') {
        // if (process.env.NODE_ENV !== 'production') {
        //   console.error(
        //     `Warning: Must specify either a render prop, a render function as children, or a component prop to ${name}`
        //   )
        // }
        return null;
      } else {
        return child(this.renderProps);
      }
    } else {
      return null; // ui-kit
    }
  }
}
