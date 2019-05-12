import * as React from 'react';
import { Component, ComponentType } from "react";
import { FrontierDataProps, schemaFromDataProps } from "../data";
import { FormApi, FormSubscription, formSubscriptionItems, FormState, Unsubscribe } from "final-form";
import { getFormFromSchema, visitSchema } from "../core/core";
import { each, set, isEqual, memoize } from "lodash";
import { saveData } from "../data/graphql";
import { UIKITFieldProps, UIKitResolver, UIKitAPI } from "../ui-kit";
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
  uiKit?: UIKitAPI;
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
  mutationName?: string;
  mounted: boolean = false;
  unsubformSubscription?: Unsubscribe;

  // Greatly inspired from the awesome https://github.com/final-form/react-final-form library
  constructor(props) {
    super(props);

    this.buildForm();
  }

  buildForm () {
    schemaFromDataProps(this.props).then(result => {
      if (result) {
        this.schema = result.schema;
        this.mutationName = result.mutationName;

        this.form = getFormFromSchema(
          result.schema,
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
      this.unsubformSubscription = undefined;
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
    // if `mutation={}` changed, we rebuild the form
    if (!isEqual(this.props.mutation, prevProps.mutation)) {
      if (this.unsubformSubscription) {
        this.unsubformSubscription();
        this.unsubformSubscription = undefined;
      }
      this.buildForm();
    }
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
      visitSchema(
        this.schema!,
        (path, definition, required) => {
          set(
            kit,
            path, () => {
              const state = this.form!.getFieldState(path);
              const Component = this.uiKitComponentFor(path, definition, required);
              return <Component {...state!} />
            });
        },
        this.schema!.required || []
      );
    }

    return {
      form: this.form!,
      state: this.state.formState!,
      modifiers,
      kit,
    };
  }

  uiKitComponentFor: (path: string, definition: JSONSchema7, required: boolean) => ComponentType<UIKITFieldProps> = memoize(
    (path: string, definition: JSONSchema7, required: boolean) => this.props.uiKit!.__reducer(`${this.mutationName!}.${path}`, definition.type as any, required),
    // custom cache key resolver
    (path: string, definition: JSONSchema7, _required: boolean) => `${this.mutationName!}.${path}-${definition.type}`
  )

  renderWithKit () {
    const fields: JSX.Element[] = [];

    visitSchema(
      this.schema!,
      (path, definition, required) => {
        const state = this.form!.getFieldState(path);
        const Component = this.uiKitComponentFor(path, definition, required);
        fields.push(<Component {...state!} />);
      },
      this.schema!.required || []
    );

    return this.props.uiKit!.__wrapWithForm(this.form!, fields);
  }

  render () {
    if (!this.state.formState) {
      return null; // TODO: do render with renderprops and pass a `loading` flag
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
      return this.renderWithKit();
    } else {
      console.error(
        `Warning: Must specify either a render function as children or give a \`uiKit=\` props`
      )
      return null;
    }
  }
}
