import { shallow } from 'enzyme';
import gql from 'graphql-tag';
import * as React from 'react';
import '../../../setupTests';
import { Frontier } from '../frontier';

describe('<Frontier> usage with render props', () => {
  const schema = require('../../../fixtures/data/tests-jsonschema.json');
  const mutation = gql`
      mutation createTodo($todo: TodoInputType!) {
        create_todo(todo: $todo) {
          id
        }
      }
  `;

  // tslint:disable-next-line
  const wrapper = shallow(
    // tslint:disable-next-line no-any
    <Frontier mutation={mutation} schema={schema} client={null as any} initialValues={{ todo: { name: 'Todo 1' } }}>
      {
        ({ state, modifiers, form }) => {
          return (
            <form /* onSubmit={modifiers.save} */>
              <h2>Create a todo</h2>
              {
                form.getState().errors && <div>
                  {form.getState().errors}
                </div>
              }
              <p>
                <label htmlFor="name">Name*</label> <br />
                <input type="text" name="name" value={state.values.todo.name} /* onChange={modifiers.todo.change} */ />
              </p>
              <p>
                <input type="submit" value="Save" />
              </p>
            </form>
          );
        }
      }
    </Frontier>
  );

  it.todo('should set-up the fields with proper values');

  it.todo('should set-up the display proper errors');

});
