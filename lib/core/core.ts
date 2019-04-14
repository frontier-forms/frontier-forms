import * as Ajv from "ajv";
import { JSONSchema7 } from "json-schema";
import { FormApi, createForm, Config, FieldSubscription, fieldSubscriptionItems, FieldState } from "final-form";
import { each, set } from "lodash";

export const allFieldSubscriptionItems: FieldSubscription = fieldSubscriptionItems.reduce((result, key) => {
  result[key] = true
  return result
}, {})

export type OnFieldUpdateCallback = (fieldName: string, state: FieldState) => void;

// Given a definitions and a mutation, should subscribe to proper fields
export function getFormFromSchema (
  schema: JSONSchema7,
  onSubmit: Config['onSubmit'],
  initialValues = {}
): FormApi {
  const form = createForm({
    validate: validateWithSchema(schema),
    onSubmit,
    initialValues
  });

  registerFields(form, schema);

  return form;
}

// FIXME: find a nice way to handle field unsubscribe!
function registerFields (form: FormApi, schema: JSONSchema7, namespace?: string) {
  each(schema.properties, (value, key) => {
    const pathKey = namespace ? `${namespace}.${key}` : key;
    if (value.type === 'object') {
      registerFields(
        form,
        value,
        pathKey
      );
    } else {
      form.registerField(
        pathKey,
        () => { },
        allFieldSubscriptionItems
      );
    }
  })
}

// Return a configured `ajv` validator for the given `schema` Form Schema
function validateWithSchema (schema: JSONSchema7): (values: object) => object | Promise<object> {
  const ajv = new Ajv();
  const validator = ajv.compile(schema);
  return function (values: object) {
    const valid = validator(values);
    return valid ? {} : formatErrors(validator.errors);
  }
}

// Take `ajv` error:
// [
//   {
//       "keyword": "type",
//       "dataPath": ".todo.completed",
//       "schemaPath": "#/properties/todo/properties/completed/type",
//       "params": {
//           "type": "boolean"
//       },
//       "message": "should be boolean"
//   }
// ]
// and transform is to a key-value object (value is field error)
function formatErrors (ajvErrors: Ajv.ErrorObject[]): object {
  let errors = {};
  each(ajvErrors, (value, _key) => {
    set(
      errors,
      // remove the leading "." for root path
      value.dataPath.substr(1, value.dataPath.length),
      value.message
    );
  });
  return errors;
}
