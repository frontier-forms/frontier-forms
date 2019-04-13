import { JSONSchema7 } from 'json-schema';
import { DocumentNode, FieldNode } from 'graphql';
import { omit, pick, reduce, cloneDeep, has, get } from 'lodash';

// Given a GQL client and a mutation, should return a JSON Schema including definitions and the mutation

export type GraphQLClient = { query: () => any };

export interface FrontierDataGraphQLProps {
  mutation: DocumentNode;
  client?: GraphQLClient; // ApolloClient<any>;
  schema?: JSONSchema7;
}

// Given GraphQL data props, return a valid form JSONSchema (or null)
export function schemaFromGraphQLProps(props: FrontierDataGraphQLProps): JSONSchema7 | null {
  if (props.mutation) {
    if (props.schema) {
      return buildFormSchema(props.schema, props.mutation);
    } else if (props.client) {
      // TODO
      return null;
    } else {
      return null;
    }
  } else {
    return null;
  }
}

// Example of `mutation` object:
// {
//   "kind": "Document",
//   "definitions": [
//       {
//           "kind": "OperationDefinition",
//           "operation": "mutation",
//           "name": {
//               "kind": "Name",
//               "value": "updateTodo"
//           },
//           "variableDefinitions": [
//               {
//                   "kind": "VariableDefinition",
//                   "variable": {
//                       "kind": "Variable",
//                       "name": {
//                           "kind": "Name",
//                           "value": "todo"
//                       }
//                   },
//                   "type": {
//                       "kind": "NonNullType",
//                       "type": {
//                           "kind": "NamedType",
//                           "name": {
//                               "kind": "Name",
//                               "value": "TodoInputType"
//                           }
//                       }
//                   },
//                   "directives": []
//               }
//           ],
//           "directives": [],
//           "selectionSet": {
//               "kind": "SelectionSet",
//               "selections": [
//                   {
//                       "kind": "Field",
//                       "name": {
//                           "kind": "Name",
//                           "value": "update_todo"
//                       },
//                       "arguments": [
//                           {
//                               "kind": "Argument",
//                               "name": {
//                                   "kind": "Name",
//                                   "value": "todo"
//                               },
//                               "value": {
//                                   "kind": "Variable",
//                                   "name": {
//                                       "kind": "Name",
//                                       "value": "todo"
//                                   }
//                               }
//                           }
//                       ],
//                       "directives": [],
//                       "selectionSet": {
//                           "kind": "SelectionSet",
//                           "selections": [
//                               {
//                                   "kind": "FragmentSpread",
//                                   "name": {
//                                       "kind": "Name",
//                                       "value": "Todo"
//                                   },
//                                   "directives": []
//                               }
//                           ]
//                       }
//                   }
//               ]
//           }
//       }
//   ],
//   "loc": {
//       "start": 0,
//       "end": 137
//   }
// }
export function getMutationNameFromDocumentNode(mutation: DocumentNode): string | null {
  if (mutation.definitions.length > 1) {
    console.warn("please provide 1 mutation document")
    return null;
  } else {
    const definition = mutation.definitions[0];
    if (definition.kind === 'OperationDefinition' && definition.operation === 'mutation') {
      if (definition.selectionSet.selections.length == 1 && definition.selectionSet.selections[0].kind === 'Field') {
        const selection = definition.selectionSet.selections[0] as FieldNode;
        if (!selection.name) {
          console.warn("please provide a named mutation")
          return null;
        } else {
          return selection.name.value;
        }
      } else {
        console.warn(`please provide a valid mutation definition`);
        return null;
      }
    } else {
      console.warn(`please provide a mutation document, received a ${definition.kind} document`)
      return null;
    }
  }
}

// Given a GraphQL schema JSON Schema and a mutation, return a form schema
export function buildFormSchema(schema: JSONSchema7, mutation: DocumentNode): JSONSchema7 {
  const mutationName = getMutationNameFromDocumentNode(mutation);
  if (!mutationName) {
    return {};
  }

  const mutationSchema = (schema.properties.Mutation as JSONSchema7).properties[mutationName] as JSONSchema7;
  if (!mutationSchema) {
    console.warn(`Unknown mutation ${mutationName} provided`)
    return {};
  }

  const args = mutationSchema.properties.arguments as JSONSchema7;
  if (args) {
    return formPropertiesReducer(args, schema);
  } else {
    console.warn(`mutation ${mutationName} has no arguments`)
    return {};
  }
}

function formPropertiesReducer(schema, referenceSchema): JSONSchema7 {
  return {
    type: 'object',
    properties: reduce<JSONSchema7, { [k: string]: any }>(
      schema.properties,
      (result, value, key) => {
        if (get(value, '$ref')) {
          const refTypeName = get(value, '$ref').replace('#/definitions/', '');
          const refType = referenceSchema.definitions[refTypeName];
          result[key] = refType ? cloneDeep(formPropertiesReducer(refType, referenceSchema)) : {};
        } else {
          result[key] = has(value, 'properties') ?
            { ...value, properties: formPropertiesReducer(value, referenceSchema) }
            : value;
        }
        return result;
      },
      {}
    ),
    required: schema.required
  }
}
