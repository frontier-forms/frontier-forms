# Usecases

## Batteries Included With access to schema for Web

User of the library has GraphQL endpoint and access to the schema (E.G. Full
stack developer) with constraint directives. Think of schema from `gql` tag.
Forms have to be automatically generated, meaning all the user needs to do is
run schema:generate and then just include generated files where needed. This
gives form and it's validation out of the box with default styling. Good for
quick admin dashboards which just require data entry for development.

## React Native Support

Simlar to the [Use case](#batteries-included-with-access-to-schema-for-web)
users should be able to user generated jsonSchema for use in native apps. Just
include Formidable form tag and feed it with the schema. This should render out
native default components.

## Adopting Existing Design Systems

In some cases there is existing design schema in the company or there is a need
to use component library (Material, Ant, Bootstrap etc.). There have to be
several optins available:
  1. If only few components are needed, user can import those components and
     register them with the form instance, either registering them as new or
     overriding the default.
  2. In cases where whole replacement is needed form needs to allow passing
     whole theme defined separately from:
     * predifined theme from npm.
     * manually created theme, which is scaffolded by CLI.

## Handling Complex Datatypes

Some mutations can work on complex data types. Table with editable fields could
be one of them. Formidable povides a way to define handling of such things.
