import gql from 'graphql-tag';
import { schemaFromGraphQLProps } from './graphql';

describe('given a valid GraphQL mutation document', () => {
  it('should return the proper JSON-Schema', () => {
    const schema = require('../../fixtures/data/todo-jsonschema.json');

    const mutation = gql`
        mutation createTodo($todo: TodoInputType!) {
          create_todo(todo: $todo) {
            id
          }
        }
    `;

    expect(
      schemaFromGraphQLProps({
        mutation,
        schema
      })
    ).toEqual({
      "type": "object",
      "properties": {
        "todo": {
          "type": "object",
          "properties": {
            "completed": {
              "type": "boolean"
            },
            "name": {
              "type": "string"
            }
          },
          "required": [
            "name"
          ]
        }
      },
      "required": [
        "todo"
      ]
    })
  })
})
