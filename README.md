# Frontier forms [![npm version](https://badge.fury.io/js/frontier-forms.svg)](https://badge.fury.io/js/frontier-forms)

Data-driven forms that let you focus on what matters: your application.

Provide a `GraphQL` mutation and `<Frontier/>` will do the rest for you.

Both fast to use and performant ⚡!

➡️ [See all capabilites by watching the introduction talk from React Europe 2019!](https://www.youtube.com/watch?v=Ovg9CYwWFBM&list=PLCC436JpVnK3H8Gm28TuFn2wjL9sj_q_Y&index=5&t=0s)

```js
import gql from "graphql-tag";
import { Frontier } from "frontier-forms";
import { myApplicationKit } from "./uiKit";
import { client } from "./apollo-client";

const mutation = gql`
    mutation($user: User!) {
      createUser(user: $user) { id }
    }
`;

<Frontier
  client={client}
  mutation={mutation}
  uiKit={myApplicationKit}
/>
```



<ul>
  <li>
    <h3>
      Simple
    </h3>
    <p>
      <strong>You already know how to use Frontier</strong>, because it works like other form libraries. <br/>
      More, Frontier will bring you the full data lifecycle management, <strong>with zero configuration</strong>.
    </p>
  </li>

  <li>
    <h3>
      Scalable
    </h3>
    <p>
      Just define your <strong>Application Frontier UI-kit</strong>. <br/>
      Then, take advantage of the <strong>UI-kit full rendering feature</strong> to bring consistent UX to your users.
    </p>
  </li>

  <li>
    <h3>
      Iterative
    </h3>
    <p>
      <strong>Choose your way</strong> to build forms, with or without Frontier UI-kit. <br/>
      Frontier will <strong>adapt to your needs</strong>.
    </p>
  </li>
</ul>

-------------------------

## Installation

In order to use Frontier, you will need:

- `react` (`^16.8.6`)
- `apollo-client` (`^2.5.1`)
- `graphql-tag` (`^2.10.1`)

<br />

Then, install `frontier-forms`:

```
yarn add frontier-forms
```

*OR*

```
npm i frontier-forms
```


--------------------------

## Links

- [What is Frontier](https://frontier-forms.dev/what-is-frontier)
- [Getting started](https://frontier-forms.dev/getting-started)
- [Frontier UI-Kit](https://frontier-forms.dev/frontier-ui-kit)
- [API: `<Frontier>`](https://frontier-forms.dev/api/frontier-component)
- [API: Frontier UI-Kit](https://frontier-forms.dev/api/frontier-ui-kit)
