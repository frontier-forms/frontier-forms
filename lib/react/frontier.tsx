import { FormApi, FormState, FormSubscription, formSubscriptionItems, Unsubscribe } from 'final-form';
import { JSONSchema7 } from 'json-schema';
import { each, memoize, set, values } from 'lodash';
import * as React from 'react';  // tslint:disable-line no-duplicate-imports
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

const MODIFIERS_KEY: string[] = ['blur', 'focus'];
type componentGetter = (path: string, definition: JSONSchema7, required: boolean) =>
  React.ComponentType<UIKITFieldProps>;

export function Frontier(props: FrontierProps) {
  const [formState, setFormState] = React.useState<FormState>();

  const schema = React.useRef<JSONSchema7>();
  const mutationName = React.useRef<String>();
  const form = React.useRef<FormApi>();
  const unsubscribeFn = React.useRef<Unsubscribe>();
  const initialized = React.useRef<Boolean>(false);

  const onSubmit = React.useCallback((formValues: Object) => {
    const save = saveData(props, formValues);
    save.then(() => {
      if (props.resetOnSave) { form.current!.reset(); }
    });
    return save;
  }, []);

  React.useEffect(() => {
    schemaFromDataProps(props).then(result => {
      if (result) {
        schema.current = result.schema;
        mutationName.current = result.mutationName;

        form.current = getFormFromSchema(
        /* schema */ result.schema,
        /* onSubmit */ onSubmit,
        /* initialValues */ props.initialValues || {}
        );

        unsubscribeFn.current = form.current!.subscribe(
          /* subscriber, called when values in subscription change*/
          (_formState: FormState) => {
            setFormState(_formState);
          },
          /* subscription */ allFormSubscriptionItems
        );

        initialized.current = true;
        if (props.onReady) { props.onReady(); }
      }
    });
  }, [
    /* not passing the whole props as the calculation is too costly */
    props.initialValues,
    props.schema,
    props.mutation  // if `mutation = {}` changed, rebuild the form
  ]);

  React.useEffect(() => {
    return () => {
      // Unsubscribe
      if (unsubscribeFn.current) { unsubscribeFn.current(); }
      unsubscribeFn.current = undefined;
    };
  }, [mutationName]);

  React.useEffect(() => {
    if (form.current) {
      // Reinitialize form when initialValues change
      form.current.initialize(props.initialValues || {});
    }
  }, [props.initialValues]);

  // Revisit this
  const uiKitComponentFor: componentGetter = React.useCallback(memoize(
    (path: string, definition: JSONSchema7, required: boolean) =>
      // tslint:disable-next-line no-any
      props.uiKit!.__reducer(`${mutationName!}.${path}`, definition.type as any, required),
    // custom cache key resolver
    (path: string, definition: JSONSchema7, _required: boolean) => `${mutationName!}.${path}-${definition.type}`
  ), []);

  const renderProps = React.useCallback(() => {
    let modifiers: any = {};  // tslint:disable-line no-any
    let kit: any = {}; // tslint:disable-line no-any

    /**
     * for each field, create a `<field>.(change|blur|focus)` modifier function
     */
    const fields = form.current!.getRegisteredFields();
    each(fields, fieldPath => {
      each(MODIFIERS_KEY, action => {
        set(
          modifiers,
          `${fieldPath}.${action}`,
          (...args) => {
            form.current![action](fieldPath, ...args);
          }
        );
      });

      set(
        modifiers,
        /* key */ `${fieldPath}.change`,
        /* value */(arg: string | React.SyntheticEvent) => {
          if (!!(arg as React.SyntheticEvent).preventDefault) {
            form.current!.change(fieldPath, (arg as any).currentTarget.value); // tslint:disable-line no-any
          } else {
            form.current!.change(fieldPath, arg as string);
          }
        }
      );

      set(
        modifiers,
        '.save',
        (e?: React.SyntheticEvent) => {
          if (e && !!e.preventDefault) { e.preventDefault(); }
          form.current!.submit();
        }
      );
    });

    if (props.uiKit) {
      visitSchema(
        schema.current!,
        /* visitPropertyFn */(path, definition, required) => {
          set(
            kit,
            path,
            _props => {
              const state = form.current!.getFieldState(path);
              const FieldComponent = uiKitComponentFor(path, definition, required);
              return <FieldComponent {...state!} {..._props} />;
            });
        },
        schema.current!.required || []
      );
    }
    return {
      form: form.current!,
      state: formState!,
      modifiers,
      kit,
    };
  }, [form.current]);

  const renderWithKit = React.useCallback(() => {
    let fields: { [k: string]: JSX.Element; } = {};

    visitSchema(
      schema.current!,
      (path, definition, required) => {
        const state = form.current!.getFieldState(path);
        const FieldComponent = uiKitComponentFor(path, definition, required);
        fields[path] = <FieldComponent {...state!} key={path} />;
      },
      schema.current!.required || []
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

    return props.uiKit!.__wrapWithForm(form.current!, values(fields));
  }, [form.current]);

  if (form.current && initialized.current) {
    if (!formState) {
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
