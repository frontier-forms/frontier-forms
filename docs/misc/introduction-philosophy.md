## React Formidable forms

### Philosophy

> Formidable, the smartest React forms

The `Formidable` forms library came from a simple idea.

While `Formik` solves the issue of state management and data validation tools,
`Formidable` forms bring the last missing block to the form library eco-system.

`Formidable` forms let you be the _smart guy/girl in the room_ and stop dealing with
repetitive work to focus on what matter the most, __your application added value: the domain__.

This last block is: _"fields declaration and validation"_.
This logic, shared with the back-end (API) is too often repetitive code and work.


### How it looks

```ts
import { Formidable } from 'react-formidable';
import gql from 'graphql-tag';

const mutation = gql`
    mutation myMutation(user: UserInputType) {}
`;

<Formidable client={myApolloClient} mutation={mutation}>
    {
        () => {

        }
    }
</Formidable>

```

[Getting started with Formidable forms](/misc/getting-started.md)


### Under the hood

At the era of the "typed-web front-end" bring by TypeScript and GraphQL,
we should be able to build forms that are linked to the APIs, leverage _true isomorphism_.
`Formidable` forms take advantage of GraphQL by pulling for you all fields informations you need:
- fields definitions (name, type, mandatory)
- validations
