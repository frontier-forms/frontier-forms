import gql from 'graphql-tag';
import { getMutationNameFromDocumentNode } from '../graphql';

describe('getMutationNameFromDocumentNode', () => {
  beforeEach(() => {
    jest.spyOn(global.console, 'warn');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('given a invalid GraphQL query document', () => {

    it('should return an `null` and warn the developer', () => {
      const mutation = gql`
          query getTodos {
            getTodos {
              id
            }
          }
      `;

      expect(getMutationNameFromDocumentNode(mutation)).toEqual(null);
      expect(global.console.warn).toHaveBeenCalledWith('please provide a mutation document, received a query document');
    });
  });

  describe('given a GraphQL document with an operation that define many mutations', () => {
    it('should return an `null` and warn the developer', () => {
      const mutation = gql`
          mutation updateTodo($id: ID!, $todo: TodoInputType!) {
            update_todo(id: $id, todo: $todo) {
              ...Todo
            }
          }

          mutation createTodo($todo: TodoInputType!) {
            create_todo(todo: $todo) {
              ...Todo
            }
          }
      `;

      expect(getMutationNameFromDocumentNode(mutation)).toEqual(null);
      expect(global.console.warn).toHaveBeenCalledWith('please provide 1 mutation document');
    });
  });

  describe('given a valid GraphQL document with a mutation', () => {
    it('should return mutation\'s name', () => {
      const mutation = gql`
        mutation createTodo($todo: TodoInputType!) {
          create_todo(todo: $todo) {
            ...Todo
          }
        }
      `;

      expect(getMutationNameFromDocumentNode(mutation)).toEqual('create_todo');
      expect(global.console.warn).not.toHaveBeenCalled();
    });
  });

});
