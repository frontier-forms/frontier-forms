import { FormApi, FormState, FormSubscription, formSubscriptionItems, Unsubscribe } from 'final-form';
import { JSONSchema7 } from 'json-schema';
import { each, isEqual, memoize, set, values } from 'lodash';
import * as React from "react";  // tslint:disable-line no-duplicate-imports
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
  save: (e?: React.SyntheticEvent) => ReturnType<typeof saveData>;
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
  onReady?: () => void;
  children?: ({ modifiers, state, kit }: FrontierRenderProps) => JSX.Element;
}

// Component state
export interface FrontierState {
  formState?: FormState;
}

const MODIFIERS_KEY: string[] = ['blur', 'focus'];
type componentGetter = (path: string, definition: JSONSchema7, required: boolean) => React.ComponentType<UIKITFieldProps>;

/**
 * Source code above is from `frontier.tsx`
 */

/**
  * Custom hooks
  */
function usePrevious(value: FrontierProps): FrontierProps | undefined {
  const ref: React.MutableRefObject<FrontierProps | undefined> = React.useRef<FrontierProps>();
  React.useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

export const Frontier = (props: FrontierProps) => {
  const [state, setState] = React.useState<FrontierState>({});
  const [form, setForm] = React.useState<FormApi>();
  const [schema, setSchema] = React.useState<JSONSchema7>();
  const [mutationName, setMutationName] = React.useState<string>();
  const [mounted, setMounted] = React.useState<boolean>(false); // used in buildForm()
  const [unsubformSubscription, setUnsubformSubscription] = React.useState<Unsubscribe>();

  const onSubmit = (formValues: object) => {
    const save = saveData(props, formValues);
    save.then(() => {
      if (props.resetOnSave === true) form!.reset();
    });
    return save;
  }

  const buildForm = () => {
    schemaFromDataProps(props)
      .then(result => {
        if (result) {
          setSchema(result.schema);
          setMutationName(result.mutationName);

          setForm(getFormFromSchema(
            result.schema,
            onSubmit,
            props.initialValues || {}
          ));

          if (mounted && !unsubformSubscription) {
            subscribeToForm();
          } else {
            form!.subscribe(
              initialState => {
                setState((prevState: FrontierState) => ({ ...prevState, formState: initialState }))
              },
              allFormSubscriptionItems
            )();
          }

          // Form is ready
          if (props.onReady) props.onReady();
        }
      });
  };

  const subscribeToForm = () => {
    // subscribe to form and set unsubscribe function
    const unsubformSubscription = form!.subscribe(
      formState => {
        if (mounted) {
          setState((prevState: FrontierState) => ({ ...prevState, formState }));
        }
      },
      allFormSubscriptionItems
    );
    setUnsubformSubscription(unsubformSubscription);
  }

  React.useEffect(() => {
    buildForm();

    // From componentDidMount and componentWillMount
    if (unsubformSubscription) {
      unsubformSubscription();
      setUnsubformSubscription(undefined);
    }

    setMounted(true);
    if (form) subscribeToForm();
  }, [] /* run only once */);


  const prevProps: FrontierProps | undefined = usePrevious(props);

  React.useEffect(() => {
    /* From componentDidUpdate */
    if (this.form) {
      // initialValues changed
      if (!isEqual(props.initialValues, prevProps!.initialValues)) {
        form!.initialize(props.initialValues || {});
      }
    }
    // if `mutation={}` changed, we rebuild the form
    if (!isEqual(props.mutation, prevProps!.mutation)) {
      if (unsubformSubscription) {
        unsubformSubscription();
        setUnsubformSubscription(undefined);
      }
      // avoid re-render with previous mutation
      setState((prevState) => ({ ...prevState, formState: undefined }));
      buildForm();
    }
  }, [props]);

  const renderProps: () => FrontierRenderProps = () => {
    let modifiers: any = {}; // tslint:disable-line no-any
    let kit: any = {}; // tslint:disable-line no-any

    // for each field, create a `<field>.(change|blur|focus)` modifier function
    const fields = form!.getRegisteredFields();

    each(fields, fieldPath => {
      // set modifiers
      each(MODIFIERS_KEY, action => {
        set(
          modifiers,
          `${fieldPath}.${action}`,
          (...args) => {
            form![action](fieldPath, ...args);
          }
        );
      });

      set(
        modifiers,
        `${fieldPath}.change`,
        (arg: string | React.SyntheticEvent) => {
          if (!!(arg as React.SyntheticEvent).preventDefault) {
            form!.change(fieldPath, (arg as any).currentTarget.value); // tslint:disable-line no-any
          } else {
            form!.change(fieldPath, arg as string);
          }
        }
      );

      // modifiers.save()
      set(
        modifiers,
        '.save',
        (e?: React.SyntheticEvent) => {
          if (e && !!e.preventDefault) {
            e.preventDefault();
          }
          form!.submit();
        }
      );
    });

    if (props.uiKit) {
      visitSchema(
        schema!,
        (path, definition, required) => {
          set(
            kit,
            path, props => {
              const state = form!.getFieldState(path);
              const FieldComponent = uiKitComponentFor(path, definition, required);
              return <FieldComponent {...state!} {...props} />;
            });
        },
        schema!.required || []
      );
    }

    return {
      form: form!,
      state: state.formState!,
      modifiers,
      kit,
    };
  }

  const uiKitComponentFor: componentGetter = memoize(
    (path: string, definition: JSONSchema7, required: boolean) =>
      // tslint:disable-next-line no-any
      props.uiKit!.__reducer(`${mutationName!}.${path}`, definition.type as any, required),
    // custom cache key resolver
    (path: string, definition: JSONSchema7, _required: boolean) => `${mutationName!}.${path}-${definition.type}`
  );

  const renderWithKit = () => {
    let fields: { [k: string]: JSX.Element } = {};

    visitSchema(
      schema!,
      (path, definition, required) => {
        const state = form!.getFieldState(path);
        const FieldComponent = uiKitComponentFor(path, definition, required);
        fields[path] = <FieldComponent {...state!} key={path} />;
      },
      schema!.required || []
    );

    // Sorting fields if an `order` is provided
    if (props.order) {
      let sortedFields = {};
      each(props.order, (orderedPath: string) => {
        sortedFields[orderedPath] = fields[orderedPath];
        delete fields[orderedPath];
      });
      each(fields, (comp, p) => {
        sortedFields[p] = comp;
      });

      fields = sortedFields;
    }

    return props.uiKit!.__wrapWithForm(form!, values(fields));
  }

  let returnValue: any;

  /* TODO: Return placeholder component for null value */
  if (form) {
    if (!state.formState) {
      returnValue = null; // TODO: do render with renderprops and pass a `loading` flag
    }

    const child = props.children;
    if (child) {
      if (typeof child !== 'function') {
        // tslint:disable-next-line no-console
        console.error(
          `Warning: Must specify a render function as children, received "${typeof child}"`
        );
        returnValue = null;
      } else {
        returnValue = child(renderProps());
      }
    } else if (props.uiKit) {
      returnValue = renderWithKit();
    } else {
      // tslint:disable-next-line no-console
      console.error(
        `Warning: Must specify either a render function as children or give a \`uiKit=\` props`
      );
      returnValue = null;
    }
  }

  return returnValue as React.ReactElement<any>;
}