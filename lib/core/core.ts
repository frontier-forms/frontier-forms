import * as Ajv from "ajv";
import { JSONSchema7 } from "json-schema";
import { FormApi, createForm, Config, FieldSubscription, fieldSubscriptionItems, FieldState } from "final-form";
import { each } from "lodash";

const allFieldSubscriptionItems: FieldSubscription = fieldSubscriptionItems.reduce((result, key) => {
  result[key] = true
  return result
}, {})

export type OnFieldUpdateCallback = (fieldName: string, state: FieldState) => void;

// Given a definitions and a mutation, should subscribe to proper fields
export function getFormFromSchema(
  schema: JSONSchema7,
  onSubmit: Config['onSubmit'],
  onFieldUpdate: OnFieldUpdateCallback
): FormApi {
  const form = createForm({
    validate: validateWithSchema(schema),
    onSubmit
    // initialValues: {}
  });

  registerFields(form, schema, onFieldUpdate);

  return form;
}

function registerFields(form: FormApi, schema: JSONSchema7, onFieldUpdate: OnFieldUpdateCallback, namespace?: string) {
  each(schema.properties, (value, key) => {
    if (value.type === 'object') {
      registerFields(form, value, onFieldUpdate, key);
    } else {
      form.registerField(
        key,
        (state: FieldState) => onFieldUpdate(key, state),
        allFieldSubscriptionItems
      );
    }
  })
}

function validateWithSchema(schema: JSONSchema7): (values: object) => object | Promise<object> {
  const ajv = new Ajv();
  const validator = ajv.compile(schema);
  return function (values: object) {
    const valid = validator(values);
    return valid ? {} : ajv.errors;
  }
}
