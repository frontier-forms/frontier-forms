## React Formidable forms

## Plain forms


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

## UI-kit forms


```ts
import { FormidableKit } from 'react-formidable';
import gql from 'graphql-tag';

const mutation = gql`
    mutation myMutation(user: UserInputType) {}
`;

<FormidableKit client={myApolloClient} mutation={mutation} kit={kit} />

```
