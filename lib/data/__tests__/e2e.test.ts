import { InMemoryCache } from 'apollo-cache-inmemory';
import ApolloClient from 'apollo-client';
import { ApolloLink } from 'apollo-link';
import gql from 'graphql-tag';
import { FrontierDataGraphQLProps, saveData, schemaFromGraphQLProps } from '../graphql';

jest.mock('apollo-client');

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

  describe('saving data', () => {
    const mutation = gql`
          mutation updateOrCreateTodo($todo: TodoInputType!) {
            update_or_create_todo(todo: $todo) {
              id
            }
          }
      `;
    let mutate = jest.fn().mockResolvedValue({});
    beforeEach(() => {
      jest.spyOn(global.console, 'error');
      (ApolloClient as jest.Mock).mockImplementation(() => ({
        mutate,
      }));
    });

    afterEach(() => {
      (ApolloClient as jest.Mock).mockClear();
    });
    it('should fail if client is not provided', () => {
      const props: FrontierDataGraphQLProps = {
        mutation,
      };

      const values = {
        id: '123',
      };
      const expectedMessage = 'Trying to save data with a mutation without providing an ApolloClient!';
      return saveData(props, values).catch(e => {
        expect(e).toEqual({});
        expect(global.console.error).toHaveBeenCalledWith(expectedMessage);
      });
    });
    it('uses client if mutation and client are provided', () => {
      const props: FrontierDataGraphQLProps = {
        mutation,
        client: new ApolloClient({
          cache: new InMemoryCache(),
          link: ApolloLink.empty()
        })
      };

      const values = { id: '123' };

      return saveData(props, values).then(data => {
        expect(data).toEqual(undefined);
        expect(mutate).toBeCalledWith({
          mutation,
          variables: values,
        });
      });
    });
    it('calls custom saving function', () => {
      const resp = { id: 1 };
      const save = jest.fn().mockResolvedValue(resp);
      const props: FrontierDataGraphQLProps = {
        save,
        client: new ApolloClient({
          cache: new InMemoryCache(),
          link: ApolloLink.empty()
        })
      };

      const values = { id: '123' };

      return saveData(props, values).then(data => {
        expect(data).toEqual(resp);
        expect(save).toBeCalledWith(values);
      });
    });
  });
});
