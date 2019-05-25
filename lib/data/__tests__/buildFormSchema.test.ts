import gql from 'graphql-tag';
import { buildFormSchema, getMutationNameFromDocumentNode } from '../graphql';

describe('buildFormSchema', () => {
  beforeEach(() => {
    jest.spyOn(global.console, 'warn');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('given a `schema` and `mutation`, with a mutation without arguments', () => {
    it('should return `{}` and warn developer', () => {
      const mutation = gql`
          mutation {
            update_online_status {
              onlineStatus
            }
          }
      `;
      const schema = require('../../../fixtures/data/tests-jsonschema.json');

      expect(buildFormSchema(schema, getMutationNameFromDocumentNode(mutation)!)).toEqual({});
      expect(global.console.warn).toHaveBeenCalledWith('mutation update_online_status has no arguments');
    });
  });

  describe('given a `schema` and `mutation`, with a mutation that is not defined in `schema`', () => {
    it('should return `{}` and warn developer', () => {
      const mutation = gql`
          mutation($userId: ID!) {
            create_online_status(userId: $userId) {
              onlineStatus
            }
          }
      `;
      const schema = require('../../../fixtures/data/tests-jsonschema.json');

      expect(buildFormSchema(schema, getMutationNameFromDocumentNode(mutation)!)).toEqual({});
      expect(global.console.warn).toHaveBeenCalledWith('Unknown mutation create_online_status provided');
    });
  });

  describe('given a `schema` and `mutation`, with a schema that have an unknown $ref property value', () => {
    it('should assign `{}` to property and warn developer', () => {
      const mutation = gql`
          mutation($id: ID!, $user: UnknowRef!) {
            unknown_ref_mutation(id: $userId, user: $user) {
              id
            }
          }
      `;
      const schema = require('../../../fixtures/data/tests-invalid-ref-jsonschema.json');

      expect(buildFormSchema(schema, getMutationNameFromDocumentNode(mutation)!)).toEqual({
        'properties': {
          'id': {
            'type': 'string',
          },
          'user': {},
        },
        'required': [
          'id',
          'user',
        ],
        'type': 'object',
      });
      expect(global.console.warn).toHaveBeenCalledWith('unknown $ref "UnknowRef" for user');
    });
  });

});
