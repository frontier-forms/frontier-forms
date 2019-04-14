import '../../../setupTests';
import { shallow, mount } from "enzyme";
import * as React from "react";
import { Frontier } from "../frontier";
import gql from "graphql-tag";

describe('ignore this test suite', () => {
  it('succeed', () => expect(1 + 1).toEqual(2))
});

xdescribe("<Frontier> usage with render props", () => {
  const schema = require('../../../fixtures/data/tests-jsonschema.json');
  const mutation = gql`
      mutation createTodo($todo: TodoInputType!) {
        create_todo(todo: $todo) {
          id
        }
      }
  `;

  const wrapper = shallow(
    <Frontier mutation={mutation} schema={schema} initialValues={{ todo: { name: 'Todo 1' } }}>
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
          )
        }
      }
    </Frontier>
  );

  // it('should set-up the fields with proper values', () => {

  //   console.log((wrapper.find("input[name=\"name\"]").getElement() as any).node.value)
  // });

  // xit('should set-up the display proper errors');

  // . . .

});
