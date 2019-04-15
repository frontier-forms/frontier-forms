import { Component, Children, createElement, ReactChildren } from "react";
import { FrontierDataProps, schemaFromDataProps } from "../data";
import { FormApi, FieldState, FormSubscription, formSubscriptionItems, FormState, Unsubscribe } from "final-form";
import { getFormFromSchema } from "../core/core";
import { each, set, isEqual, includes } from "lodash";
import { saveData } from "../data/graphql";

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

export type ModifiersField = {
  [k: string]: ModifiersField | Modifiers;
}

export interface FrontierRenderProps {
  form: FormApi;
  state: FormState,
  modifiers: ModifiersField,
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
  formState?: FormState;
}

export class Frontier extends Component<FrontierProps, FrontierState> {
  state: FrontierState = {};
  form?: FormApi;
  mounted: boolean = false;
  formSubscription?: Unsubscribe;

  // Greatly inspired from the awesome https://github.com/final-form/react-final-form library
  constructor(props) {
    super(props);

    schemaFromDataProps(this.props).then(schema => {
      if (schema) {
        this.form = getFormFromSchema(
          schema,
          this.onSubmit,
          this.props.initialValues || {}
        );
        if (this.mounted && !this.formSubscription) {
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
    this.formSubscription = this.form!.subscribe(
      formState => {
        if (this.mounted) {
          this.setState({ formState })
        }
      },
      allFormSubscriptionItems
    )
  }

  componentWillMount () {
    if (this.formSubscription) {
      this.formSubscription();
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

  onSubmit = (values: object) => saveData(
    this.props.client,
    this.props.mutation,
    values
  )

  renderProps (): FrontierRenderProps {
    let modifiers: any = {};

    // for each field, create a `<field>.(change|blur|focus)` modifier function
    const fields = this.form!.getRegisteredFields();
    each(fields, (fieldPath) => {
      each(['focus', 'blur', 'change'], action => {
        set(
          modifiers,
          `${fieldPath}.${action}`,
          (...args) => {
            this.form![action](fieldPath, ...args);
          }
        )
      });
    });

    return {
      form: this.form!,
      state: this.state.formState!,
      modifiers,
      // kit: createRenderPropsKit(),
    };
  }

  render () {
    if (!this.state.formState) {
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
