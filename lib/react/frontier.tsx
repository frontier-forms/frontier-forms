import { Component, Children, createElement, ReactChildren } from "react";
import { FrontierDataProps, schemaFromDataProps } from "../data";
import { JSONSchema7 } from "json-schema";
import { FormApi, FieldState } from "final-form";
import { getFormFromSchema } from "../core/core";
import { each, set, partition, includes } from "lodash";

// only keep readonly `FieldState` attributes, exclude modifiers functions
export type FieldStateReadOnly = Readonly<{
  [k in keyof FieldState]: FieldState[k] extends Function ? never : FieldState[k]
}>;

// only keep function `FieldState` attributes, exclude readonly attributes
export type FieldStateModifiers = {
  [k in keyof FieldState]: FieldState[k] extends Function ? FieldState[k] : never
};

export interface FrontierRenderProps {
  form: FormApi;
  state: {
    [k: string]: FieldStateReadOnly;
  },
  modifiers: {
    [k: string]: FieldStateModifiers;
    // save: () => void;
  },
  // kit: {
  //   [k: string]: UIKitComponent;
  // }
}

const MODIFIERS_KEY: string[] = ['blur', 'focus', 'change'];

export interface FrontierProps extends FrontierDataProps {
  uiKit?: {};
  initialValues?: {};
  onSave?: (values: object) => void;

  children: ({ modifiers, state, /* kit */ }: FrontierRenderProps) => JSX.Element;
};

export interface FrontierState {
  schema?: JSONSchema7;
  form?: FormApi;
}

export class Frontier extends Component<FrontierProps, FrontierState> {
  state: FrontierState = {};

  componentDidMount () {
    const schema = schemaFromDataProps(this.props);
    const form = getFormFromSchema(
      schema,
      this.onSubmit,
      this.onFieldUpdate,
      this.props.initialValues || {}
    );
    this.setState({ schema, form });
  }

  componentWillReceiveProps (nextProps) {
    // TODO
  }

  onSubmit = (values: object) => {
    // call Frontier Data save handler 
  }

  onFieldUpdate = (fieldName: string, state: FieldState) => { }

  renderProps (): FrontierRenderProps {
    // `state`, `modifiers` and `kit`
    const fields = this.state.form.getRegisteredFields();
    let state = {};
    let modifiers = {};

    each(fields, (fieldPath) => {
      const fieldState = this.state.form.getFieldState(fieldPath);
      each(fieldState, (v, k) => {
        set(includes(MODIFIERS_KEY, k) ? modifiers : state, `${fieldPath}.${k}`, v)
      })
    });

    return {
      form: this.state.form,
      state,
      modifiers,
      // kit: createRenderPropsKit(),
    };
  }

  render () {
    if (!this.state.form) {
      return null;
    }

    const child = this.props.children;
    if (child) {
      if (typeof child !== 'function') {
        // if (process.env.NODE_ENV !== 'production') {
        //   console.error(
        //     `Warning: Must specify either a render prop, a render function as children, or a component prop to ${name}`
        //   )
        // }
        return null;
      } else {
        return child(this.renderProps());
      }
    } else {
      return null; // ui-kit
    }
  }
}
