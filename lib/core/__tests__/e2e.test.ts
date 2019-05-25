import gql from 'graphql-tag';
import { buildFormSchema, getMutationNameFromDocumentNode } from '../../data/graphql';
import { getFormFromSchema } from '../core';

describe('Frontier Core', () => {
  describe('when providing a valid `schema` and `mutation`', () => {
    it('should return a register proper fields', () => {
      const schema = require('../../../fixtures/data/tests-jsonschema.json');
      const mutation = gql`
          mutation createTodo($todo: TodoInputType!) {
            create_todo(todo: $todo) {
              id
            }
          }
      `;

      const formSchema = buildFormSchema(schema, getMutationNameFromDocumentNode(mutation)!);
      const form = getFormFromSchema(formSchema, jest.fn(), jest.fn());

      expect(form.getRegisteredFields()).toContain('todo.name');
      expect(form.getRegisteredFields()).toContain('todo.completed');
    });
  });

  describe('when providing a valid `schema` and `mutation` with `initialValues`', () => {
    it('should return a register proper fields and set proper values', () => {
      const schema = require('../../../fixtures/data/tests-jsonschema.json');
      const mutation = gql`
          mutation createTodo($todo: TodoInputType!) {
            create_todo(todo: $todo) {
              id
            }
          }
      `;

      const formSchema = buildFormSchema(schema, getMutationNameFromDocumentNode(mutation)!);
      const form = getFormFromSchema(
        formSchema,
        jest.fn(),
        {
          todo: {
            name: 'Write tests for Frontier Core'
          }
        }
      );

      expect(form.getRegisteredFields()).toContain('todo.name');
      expect(form.getRegisteredFields()).toContain('todo.completed');

      expect(form.getFieldState('todo.name')!.value).toEqual('Write tests for Frontier Core');
    });
  });

  describe('when providing a valid `schema` and `mutation` and updating a field with incorrect value', () => {
    it(
      'should return a register proper fields and forward the update to `onFieldUpdate` argument and run validations',
      () => {
        const schema = require('../../../fixtures/data/tests-jsonschema.json');
        const mutation = gql`
          mutation createTodo($todo: TodoInputType!) {
            create_todo(todo: $todo) {
              id
            }
          }
      `;

        const formSchema = buildFormSchema(schema, getMutationNameFromDocumentNode(mutation)!);
        const form = getFormFromSchema(
          formSchema,
          jest.fn(),
          {
            todo: {
              name: 'My 1st todo',
              completed: false
            }
          }
        );

        expect(form.getRegisteredFields()).toContain('todo.name');
        expect(form.getRegisteredFields()).toContain('todo.completed');

        form.change('todo.completed', 'completed');

        expect(form.getFieldState('todo.completed')).toEqual(
          expect.objectContaining({
            value: 'completed',
            error: 'type',
            dirty: true,
            pristine: false,
            name: 'todo.completed'
          })
        );
      });
  });
});
