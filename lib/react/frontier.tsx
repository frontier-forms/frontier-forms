/**
 * TODO FIXME
 * Boolean value doesn't change
 */

import { FormApi, FormState, FormSubscription, formSubscriptionItems, Unsubscribe, setIn } from 'final-form';
import { JSONSchema7 } from 'json-schema';
import { each, isEqual, memoize, set, values } from 'lodash';
import * as React from "react";  // tslint:disable-line no-duplicate-imports
import { getFormFromSchema, visitSchema } from '../core/core';
import { FrontierDataProps, schemaFromDataProps } from '../data';
import { saveData, buildFormSchema } from '../data/graphql';
import { UIKitAPI, UIKITFieldProps } from '../ui-kit';
import { DocumentNode } from 'graphql';

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
  return ref.current || value;  // For first iteration
}

export function Frontier (props: FrontierProps): any {
  const [schema, setSchema] = React.useState<JSONSchema7>();
  const [mutationName, setMutationName] = React.useState<String>();
  const [form, setForm] = React.useState<FormApi>();
  const [formState, setFormState] = React.useState<FormState>();
  const [unsubscribeFn, setUnsubscribeFn] = React.useState<Unsubscribe>();
  const [initialized, setInitialized] = React.useState<Boolean>(false);

  // From props
  const [initialValues, setInitialValues] = React.useState<Object>(props.initialValues || {});
  const [mutation, setMutation] = React.useState<DocumentNode>(props.mutation)

  async function buildForm() {
    const result = await schemaFromDataProps(props)
    if (result) {
      const form = getFormFromSchema(
        /* schema */ result.schema, 
        /* onSubmit */ onSubmit, 
        /* initialValues */ initialValues
      );
      
      setSchema(result.schema);
      setMutationName(result.mutationName);
      setForm(form)
    }
  }
  
  if (!initialized) {
    buildForm();
    setInitialized(true);
  }

  React.useEffect(() => {
    /**
     * This hook is called after form is built and component is mounted
     */
    const unsubscribeFn = form!.subscribe(
      /* subscriber, called when values in subscription change*/ (formState: FormState) => setFormState(formState),
      /* subscription */ allFormSubscriptionItems
    );
    setUnsubscribeFn(unsubscribeFn)

    if (props.onReady) { props.onReady(); }

    return () => {
      unsubscribeFn()
      setUnsubscribeFn(undefined);
    }
  },[/*form is set*/ form, /*mutation name is changed*/mutationName])

  React.useEffect(() => {
    if (form) {
      if (!isEqual(props.initialValues, initialValues)) {
        // Reinitialize form when initialValues change
        setInitialValues(props.initialValues || {})
        form.initialize(initialValues);
      }
    }
  }, [form])

  React.useEffect(() => {
    // if `mutation = {}` changed, rebuild the form
    if (!isEqual(props.mutation, mutation)) {
      buildForm();
      setMutation(props.mutation);
    }
  }, [mutationName])

  const onSubmit = React.useCallback((formValues: Object) => {
    const save = saveData(props, formValues);
    save.then(() => {
      if(props.resetOnSave) {form!.reset()}
    });
    return save;
  }, [])

  // Revisit this
  const uiKitComponentFor: componentGetter = React.useCallback(memoize(
    (path: string, definition: JSONSchema7, required: boolean) =>
    // tslint:disable-next-line no-any
      props.uiKit!.__reducer(`${mutationName!}.${path}`, definition.type as any, required),
    // custom cache key resolver
    (path: string, definition: JSONSchema7, _required: boolean) => `${mutationName!}.${path}-${definition.type}`
  ), [mutationName]);

  const renderProps = React.useCallback(() => {
    let modifiers: any = {};
    let kit: any = {};

    /**
     * for each field, create a `<field>.(change|blur|focus)` modifier function
     */
    const fields = form!.getRegisteredFields();
    fields.forEach((fieldPath) => {
      MODIFIERS_KEY.forEach((action) => {
        set(
          modifiers,
          /* key */ `${fieldPath}.${action}`,
          /* value */ (...args) => {
            form![action](fieldPath, ...args);
          }
        )
      });

      set(
        modifiers,
        /* key */ `${fieldPath}.change`,
        /* value */ (arg: string | React.SyntheticEvent) => {
          if (!!(arg as React.SyntheticEvent).preventDefault) {
            form!.change(fieldPath, (arg as any).currentTarget.value); // tslint:disable-line no-any
          } else {
            form!.change(fieldPath, arg as string);
          }
        }
      );

      set(
        modifiers,
        '.save',
        (e?: React.SyntheticEvent) => {
          if (e && !!e.preventDefault) { e.preventDefault(); }
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
      state: formState!,
      modifiers,
      kit,
    };
  }, [form, /* maybe? props.uiKit */])

  const renderWithKit = React.useCallback(() => {
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
  }, [form, /* maybe? props.Order */])

  if(initialized) {
    if (!formState){
      // TODO: do render with renderprops and pass a `loading` flag
      return null;
    }

    const children = props.children;
    if (children) {
      if (typeof children !== 'function') {
        // tslint:disable-next-line no-console
        console.error(
          `Warning: Must specify a render function as children, received "${typeof children}"`
        );
        return null;
      } else {
        return children(renderProps());
      }
    } else if (props.uiKit) {
      return renderWithKit();
    } else {
      // tslint:disable-next-line no-console
      console.error(
        `Warning: Must specify either a render function as children or give a \`uiKit=\` props`
      );
      return null;
    }
  }

  return null;
}
