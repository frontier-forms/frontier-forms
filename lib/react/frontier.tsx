import { Component, Children, createElement, ReactChildren } from "react";
import { FrontierDataProps, schemaFromDataProps } from "../data";
import { JSONSchema7 } from "json-schema";

export interface FrontierProps extends FrontierDataProps {
  uiKit?: {};
  initialValues?: {}
}

export class Frontier extends Component<FrontierProps> {
  schema: JSONSchema7;

  componentDidMount() {
    this.schema = schemaFromDataProps(this.props);
    // this.form = ...
  }

  renderProps () {
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
