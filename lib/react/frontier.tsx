import * as React from 'react';
import { Component, Children, createElement, ReactChildren, ComponentType } from "react";
import { FrontierDataProps, schemaFromDataProps } from "../data";
import { FormApi, FieldState, FormSubscription, formSubscriptionItems, FormState, Unsubscribe } from "final-form";
import { getFormFromSchema, visitSchema } from "../core/core";
import { each, set, isEqual, includes } from "lodash";
import { saveData } from "../data/graphql";
import { UIKITFieldProps, UIKitResolver } from "../ui-kit";
import { JSONSchema7 } from "json-schema";

export const allFormSubscriptionItems: FormSubscription = formSubscriptionItems.reduce(
  (result, key) => {
    result[key] = true
    return result
  },
  {}
)

export interface Modifiers {
  change: (value: any) => void;
  focus: () => void;
  blur: () => void;
}

export type RenderPropsModifiersFieldObject = { [k: string]: RenderPropsModifiersFieldObject | Modifiers; }
export type RenderPropsUIKitFieldObject = { [k: string]: RenderPropsUIKitFieldObject | ComponentType<UIKITFieldProps>; }
// Component render props
export interface FrontierRenderProps {
  form: FormApi;
  state: FormState,
  modifiers: RenderPropsModifiersFieldObject,
  kit?: RenderPropsUIKitFieldObject;
}

// Component props
export interface FrontierProps extends FrontierDataProps {
  uiKit?: UIKitResolver;
  initialValues?: {};
  onSave?: (values: object) => void;

  children?: ({ modifiers, state, kit }: FrontierRenderProps) => JSX.Element;
};

// Component state
export interface FrontierState {
  formState?: FormState;
}

const MODIFIERS_KEY: string[] = ['blur', 'focus', 'change'];
export class Frontier extends Component<FrontierProps, FrontierState> {
  state: FrontierState = {};
  form?: FormApi;
  schema?: JSONSchema7;
  mounted: boolean = false;
  unsubformSubscription?: Unsubscribe;

  // Greatly inspired from the awesome https://github.com/final-form/react-final-form library
  constructor(props) {
    super(props);

    schemaFromDataProps(this.props).then(schema => {
      if (schema) {
        this.schema = schema;
        this.form = getFormFromSchema(
          schema,
          this.onSubmit,
          this.props.initialValues || {}
        );
        if (this.mounted && !this.unsubformSubscription) {
          this.subscribeToForm();
        } else {
          this.form.subscribe(
            initialState => {
              this.state = { formState: initialState };
            },
            allFormSubscriptionItems
          )();
        }
      }
    });
  }

  componentDidMount () {
    this.mounted = true;
    if (this.form) {
      this.subscribeToForm();
    }
  }

  subscribeToForm () {
    this.unsubformSubscription = this.form!.subscribe(
      formState => {
        if (this.mounted) {
          this.setState({ formState })
        }
      },
      allFormSubscriptionItems
    )
  }

  componentWillMount () {
    if (this.unsubformSubscription) {
      this.unsubformSubscription();
    }
    this.mounted = false;
  }

  componentDidUpdate (prevProps) {
    if (this.form) {
      // initialValues changed
      if (!isEqual(this.props.initialValues, prevProps.initialValues)) {
        this.form.initialize(this.props.initialValues || {});
      }

    }
    // TODO: what do we do if mutation or schema change?
  }

  onSubmit = (values: object) => saveData(this.props, values)

  renderProps (): FrontierRenderProps {
    let modifiers: RenderPropsModifiersFieldObject = {};
    let kit: RenderPropsUIKitFieldObject = {};

    // for each field, create a `<field>.(change|blur|focus)` modifier function
    const fields = this.form!.getRegisteredFields();

    each(fields, (fieldPath) => {
      // set modifiers
      each(MODIFIERS_KEY, action => {
        set(
          modifiers,
          `${fieldPath}.${action}`,
          (...args) => {
            this.form![action](fieldPath, ...args);
          }
        )
      });
    });

    const { uiKit } = this.props;

    if (uiKit) {
      console.log('kit render props!')
      visitSchema(
        this.schema!,
        (path, definition) => {
          console.log(`${path}`, uiKit(path, definition.type as any))
          set(
            kit,
            path, () => {
              const state = this.form!.getFieldState(path);
              // FIXME: remove `any`
              const Component = uiKit(path, definition.type as any);
              return <Component {...state!} />
            });
        }
      );
    }

    return {
      form: this.form!,
      state: this.state.formState!,
      modifiers,
      kit,
    };
  }

  render () {
    if (!this.state.formState) {
      return null; // loading ...
    }

    const child = this.props.children;
    if (child) {
      if (typeof child !== 'function') {
        console.error(
          `Warning: Must specify a render function as children, received "${typeof child}"`
        )
        return null;
      } else {
        return child(this.renderProps());
      }
    } else if (this.props.uiKit) {
      // render with ui-kit
      return null;
    } else {
      console.error(
        `Warning: Must specify either a render function as children or give a \`uiKit=\` props`
      )
      return null;
    }
  }
}
