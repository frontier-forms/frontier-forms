import { FormApi, FormState, FormSubscription, formSubscriptionItems, Unsubscribe } from 'final-form';
import { JSONSchema7 } from 'json-schema';
import { each, isEqual, memoize, set, values } from 'lodash';
import { Component, ComponentType } from 'react';
import * as React from 'react'; // tslint:disable-line no-duplicate-imports
import { getFormFromSchema, visitSchema } from '../core/core';
import { FrontierDataProps, schemaFromDataProps } from '../data';
import { saveData } from '../data/graphql';
import { UIKitAPI, UIKITFieldProps } from '../ui-kit';

export const allFormSubscriptionItems: FormSubscription = formSubscriptionItems.reduce(
  (result, key) => {
    result[key] = true;
    return result;
  },
  {}
);

export interface Modifiers {
  change: (value: any) => void; // tslint:disable-line no-any
  focus: () => void;
  blur: () => void;
}

// export type RenderPropsModifiersFieldObject = { [k: string]: RenderPropsModifiersFieldObject | Modifiers; }
// tslint:disable-next-line max-line-length
// export type RenderPropsUIKitFieldObject = { [k: string]: RenderPropsUIKitFieldObject | ComponentType<UIKITFieldProps>; }
// Component render props
export interface FrontierRenderProps {
  form: FormApi;
  state: FormState;
  modifiers: any; // tslint:disable-line no-any
  kit?: any; // tslint:disable-line no-any
}

// Component props
export interface FrontierProps extends FrontierDataProps {
  uiKit?: UIKitAPI;
  initialValues?: {};
  onSave?: (values: object) => void;
  resetOnSave?: boolean;
  order?: string[];

  children?: ({ modifiers, state, kit }: FrontierRenderProps) => JSX.Element;
}

// Component state
export interface FrontierState {
  formState?: FormState;
}

const MODIFIERS_KEY: string[] = ['blur', 'focus'];
type componentGetter = (path: string, definition: JSONSchema7, required: boolean) => ComponentType<UIKITFieldProps>;
export class Frontier extends Component<FrontierProps, FrontierState> {
  state: FrontierState = {};
  form?: FormApi;
  schema?: JSONSchema7;
  mutationName?: string;
  mounted: boolean = false;
  unsubformSubscription?: Unsubscribe;

  // Greatly inspired from the awesome https://github.com/final-form/react-final-form library
  constructor(props: FrontierProps) {
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
          this.setState({ formState });
        }
      },
      allFormSubscriptionItems
    );
  }

  componentWillMount () {
    if (this.unsubformSubscription) {
      this.unsubformSubscription();
      this.unsubformSubscription = undefined;
    }
    this.mounted = false;
  }

  componentDidUpdate(prevProps: FrontierProps) {
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
      // avoid re-render with previous mutation
      this.setState({ formState: undefined }, () => this.buildForm());
    }
  }

  onSubmit = (formValues: object) => {
    const save = saveData(this.props, formValues);
    save.then(() => {
      if (this.props.resetOnSave === true) {
        this.form!.reset();
      }
    });
    return save;
  }

  renderProps (): FrontierRenderProps {
    let modifiers: any = {}; // tslint:disable-line no-any
    let kit: any = {}; // tslint:disable-line no-any

    // for each field, create a `<field>.(change|blur|focus)` modifier function
    const fields = this.form!.getRegisteredFields();

    each(fields, fieldPath => {
      // set modifiers
      each(MODIFIERS_KEY, action => {
        set(
          modifiers,
          `${fieldPath}.${action}`,
          (...args) => {
            this.form![action](fieldPath, ...args);
          }
        );
      });

      set(
        modifiers,
        `${fieldPath}.change`,
        (arg: string | React.SyntheticEvent) => {
          if (!!(arg as React.SyntheticEvent).preventDefault) {
            this.form!.change(fieldPath, (arg as any).currentTarget.value); // tslint:disable-line no-any
          } else {
            this.form!.change(fieldPath, arg as string);
          }
        }
      );
    });

    if (this.props.uiKit) {
      visitSchema(
        this.schema!,
        (path, definition, required) => {
          set(
            kit,
            path, props => {
              const state = this.form!.getFieldState(path);
              const FieldComponent = this.uiKitComponentFor(path, definition, required);
              return <FieldComponent {...state!} {...props} />;
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
  uiKitComponentFor: componentGetter = memoize(
    (path: string, definition: JSONSchema7, required: boolean) =>
    // tslint:disable-next-line no-any
      this.props.uiKit!.__reducer(`${this.mutationName!}.${path}`, definition.type as any, required),
    // custom cache key resolver
    (path: string, definition: JSONSchema7, _required: boolean) => `${this.mutationName!}.${path}-${definition.type}`
  );

  renderWithKit () {
    let fields: { [k: string]: JSX.Element } = {};

    visitSchema(
      this.schema!,
      (path, definition, required) => {
        const state = this.form!.getFieldState(path);
        const FieldComponent = this.uiKitComponentFor(path, definition, required);
        fields[path] = <FieldComponent {...state!} key={path} />;
      },
      this.schema!.required || []
    );

    // Sorting fields if an `order` is provided
    if (this.props.order) {
      let sortedFields = {};
      each(this.props.order, (orderedPath: string) => {
        sortedFields[orderedPath] = fields[orderedPath];
        delete fields[orderedPath];
      });
      each(fields, (comp, p) => {
        sortedFields[p] = comp;
      });

      fields = sortedFields;
    }

    return this.props.uiKit!.__wrapWithForm(this.form!, values(fields));
  }

  render () {
    if (!this.state.formState) {
      return null; // TODO: do render with renderprops and pass a `loading` flag
    }

    const child = this.props.children;
    if (child) {
      if (typeof child !== 'function') {
        // tslint:disable-next-line no-console
        console.error(
          `Warning: Must specify a render function as children, received "${typeof child}"`
        );
        return null;
      } else {
        return child(this.renderProps());
      }
    } else if (this.props.uiKit) {
      return this.renderWithKit();
    } else {
      // tslint:disable-next-line no-console
      console.error(
        `Warning: Must specify either a render function as children or give a \`uiKit=\` props`
      );
      return null;
    }
  }
}
