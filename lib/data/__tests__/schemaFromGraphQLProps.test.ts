import gql from 'graphql-tag';
import { schemaFromGraphQLProps } from '../graphql';

describe('schemaFromGraphQLProps', () => {
  beforeEach(() => {
    jest.spyOn(global.console, 'warn');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('given a invalid GraphQL props', () => {
    it('should return an `null`', done => {
      const props: any = {}; // tslint:disable-line no-any

      schemaFromGraphQLProps(props).then(schema => {
        expect(schema).toEqual(null);

        done();
      });
    });
  });

  describe('given a `schema` and `mutation` GraphQL props', () => {
    it('should return a valid From Schema', done => {
      const props = {
        mutation: gql`
          mutation createTodo($todo: TodoInputType!) {
            create_todo(todo: $todo) {
              id
            }
          }
      `,
        schema: require('../../../fixtures/data/tests-jsonschema.json'),
        client: null as any, // tslint:disable-line no-any
      };

      schemaFromGraphQLProps(props).then(result => {
        expect(result!.schema).toEqual({
          'type': 'object',
          'properties': {
            'todo': {
              'type': 'object',
              'properties': {
                'completed': {
                  'type': 'boolean'
                },
                'name': {
                  'type': 'string'
                }
              },
              'required': [
                'name'
              ]
            }
          },
          'required': [
            'todo'
          ]
        });

        done();
      });

    });
  });

});
