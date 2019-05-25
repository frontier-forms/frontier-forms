import gql from 'graphql-tag';
import { schemaFromGraphQLProps } from '../graphql';

describe('Frontier Data GraphQl', () => {
  describe('given a valid GraphQL mutation document', () => {
    it('should return the proper Form Schema', done => {
      const schema = require('../../../fixtures/data/tests-jsonschema.json');

      const mutation = gql`
          mutation createTodo($todo: TodoInputType!) {
            create_todo(todo: $todo) {
              id
            }
          }
      `;

      schemaFromGraphQLProps({
        mutation,
        schema,
        client: null as any // tslint:disable-line no-any
      }).then(result => {
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

  describe('given a invalid GraphQL query document', () => {
    beforeEach(() => {
      jest.spyOn(global.console, 'warn');
    });

    it('should return an empty Form Schema and warn the developer', done => {
      const schema = require('../../../fixtures/data/tests-jsonschema.json');

      const mutation = gql`
          query getTodos {
            getTodos {
              id
            }
          }
      `;

      schemaFromGraphQLProps({
        mutation,
        schema,
        client: null as any, // tslint:disable-line no-any
      }).then(result => {
        expect(result).toEqual(null);
        expect(global.console.warn).toHaveBeenCalledWith(
          'please provide a mutation document, received a query document'
        );

        done();
      });
    });
  });

  describe('given a unknown GraphQL mutation document', () => {
    beforeEach(() => {
      jest.spyOn(global.console, 'warn');
    });

    it('should return an empty Form Schema and warn the developer', done => {
      const schema = require('../../../fixtures/data/tests-jsonschema.json');

      const mutation = gql`
          mutation updateOrCreateTodo($todo: TodoInputType!) {
            update_or_create_todo(todo: $todo) {
              id
            }
          }
      `;

      schemaFromGraphQLProps({
        mutation,
        schema,
        client: null as any // tslint:disable-line no-any
      }).then(result => {
        expect(result).toEqual({ 'mutationName': 'update_or_create_todo', 'schema': {} });
        expect(global.console.warn).toHaveBeenCalledWith('Unknown mutation update_or_create_todo provided');

        done();
      });
    });
  });

});
