import * as Ajv from 'ajv';
import ajv = require('ajv');
import { Config, createForm, FieldSubscription, fieldSubscriptionItems, FormApi } from 'final-form';
import { JSONSchema7 } from 'json-schema';
import { each, noop, set } from 'lodash';

export const allFieldSubscriptionItems: FieldSubscription = fieldSubscriptionItems.reduce((result, key) => {
  result[key] = true;
  return result;
},                                                                                        {});

const formatsRegistry: { [k: string]: ajv.FormatValidator } = {};

export const addFormat = (formatName: string, validator: ajv.FormatValidator) => {
  formatsRegistry[formatName] = validator;
};

// Given a definitions and a mutation, should subscribe to proper fields
export function getFormFromSchema (
  schema: JSONSchema7,
  onSubmit: Config['onSubmit'],
  initialValues = {} // tslint:disable-line typedef
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
  visitSchema(schema, (path, _definition) => {
    form.registerField(
      path,
      noop,
      allFieldSubscriptionItems
    );
  },
              schema.required || []
  );
}

export function visitSchema (
  schema: JSONSchema7,
  visitProperty: (path: string, definition: JSONSchema7, required: boolean) => void,
  requiredFields: string[],
  namespace?: string
) {
  each(schema.properties, (value: JSONSchema7, key: string) => {
    const pathKey = namespace ? `${namespace}.${key}` : key;
    if (value.type === 'object') {
      visitSchema(
        value,
        visitProperty,
        value.required || [],
        pathKey
      );
    } else {
      visitProperty(pathKey, value, requiredFields.includes(key));
    }
  });
}

// Return a configured `ajv` validator for the given `schema` Form Schema
function validateWithSchema (schema: JSONSchema7): (values: object) => object | Promise<object> {
  const ajvCompiler = new Ajv({ allErrors: true });
  const validateFunction = ajvCompiler.compile(schema);
  // apply custom validators
  each(formatsRegistry, (validator, name) => {
    ajvCompiler.addFormat(name, validator);
  });
  return function (values: object) {
    const valid = validateFunction(values);
    return valid ? {} : formatErrors(validateFunction.errors || []);
  };
}

// Take `ajv` error:
//  [
//    {
//        "keyword": "type",
//        "dataPath": ".todo.completed",
//        "schemaPath": "#/properties/todo/properties/completed/type",
//        "params": {
//            "type": "boolean"
//        },
//        "message": "should be boolean"
//    }
//  ]
// and transform is to:
//  {
//    todo: {
//      completed: "type"
//    }
//  }
function formatErrors (ajvErrors: Ajv.ErrorObject[]): object {
  let errors = {};
  each(ajvErrors, (value: Ajv.ErrorObject, _key: string) => {
    // required errors have a specific format
    if (value.keyword === 'required') {
      const path = value.dataPath ?
        [
          value.dataPath.substr(1, value.dataPath.length),
          (value.params as Ajv.RequiredParams).missingProperty
        ].join('') :
        (value.params as Ajv.RequiredParams).missingProperty;

      set(
        errors,
        path,
        value.keyword
      );

      // all others (type, pattern) are handled here
    } else {
      set(
        errors,
        // remove the leading "." for root path
        value.dataPath.substr(1, value.dataPath.length),
        value.keyword
      );
    }
  });
  return errors;
}
