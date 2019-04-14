import gql from 'graphql-tag';
import { schemaFromGraphQLProps } from '../graphql';

describe('schemaFromGraphQLProps', () => {
  beforeEach(() => {
    jest.spyOn(global.console, 'warn')
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('given a invalid GraphQL props', () => {
    it('should return an `null`', () => {
      const props: any = {};

      expect(schemaFromGraphQLProps(props)).toEqual(null);
    })
  });

  describe('given a `schema` and `mutation` GraphQL props', () => {
    it('should return a valid From Schema', () => {
      const props = {
        mutation: gql`
          mutation createTodo($todo: TodoInputType!) {
            create_todo(todo: $todo) {
              id
            }
          }
      `,
        schema: require('../../../fixtures/data/todo-jsonschema.json')
      };

      expect(schemaFromGraphQLProps(props)).toEqual({
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
  });

});
