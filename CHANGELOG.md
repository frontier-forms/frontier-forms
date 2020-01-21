# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.1.2](https://github.com/frontier-forms/frontier-forms/compare/v0.1.1...v0.1.2) (2019-10-21)


### Bug Fixes

* **react:** added key to form children when using ui-kit ([c979fca](https://github.com/frontier-forms/frontier-forms/commit/c979fca)), closes [#29](https://github.com/frontier-forms/frontier-forms/issues/29)



### [0.1.1](https://github.com/frontier-forms/frontier-forms/compare/v0.1.0-6...v0.1.1) (2019-05-25)


### Bug Fixes

* **react:** ignore tests ([8507292](https://github.com/frontier-forms/frontier-forms/commit/8507292))
* **react:** typo in tests ([ef417b4](https://github.com/frontier-forms/frontier-forms/commit/ef417b4))
* **readme:** add syntax highlighting for code example ([a294b08](https://github.com/frontier-forms/frontier-forms/commit/a294b08))



## [0.1.0](https://github.com/frontier-forms/frontier-forms/compare/v0.1.0-6...v0.1.0) (2019-05-25)


### Bug Fixes

* **react:** ignore tests ([8507292](https://github.com/frontier-forms/frontier-forms/commit/8507292))
* **react:** typo in tests ([ef417b4](https://github.com/frontier-forms/frontier-forms/commit/ef417b4))
* **readme:** add syntax highlighting for code example ([a294b08](https://github.com/frontier-forms/frontier-forms/commit/a294b08))



## [0.1.0-6](https://github.com/frontier-forms/frontier-forms/compare/v0.1.0-5...v0.1.0-6) (2019-05-18)


### Bug Fixes

* **react:** typo in `modifiers.change` definition ([a1f35f0](https://github.com/frontier-forms/frontier-forms/commit/a1f35f0))



## [0.1.0-5](https://github.com/frontier-forms/frontier-forms/compare/v0.1.0-4...v0.1.0-5) (2019-05-18)


### Features

* **react:** `modifiers.change` can either receive a value or a `SyntheticEvent` object ([3e05d16](https://github.com/frontier-forms/frontier-forms/commit/3e05d16))



## [0.1.0-4](https://github.com/frontier-forms/frontier-forms/compare/v0.1.0-3...v0.1.0-4) (2019-05-18)


### Bug Fixes

* **react:** TS fix ([7dded5a](https://github.com/frontier-forms/frontier-forms/commit/7dded5a))


### Tests

* fix all specs ([d8c5108](https://github.com/frontier-forms/frontier-forms/commit/d8c5108))



## [0.1.0-3](https://github.com/frontier-forms/frontier-forms/compare/v0.1.0-2...v0.1.0-3) (2019-05-12)



## [0.1.0-2](https://github.com/frontier-forms/frontier-forms/compare/v0.1.0-1...v0.1.0-2) (2019-05-12)


### Bug Fixes

* **react:** ensure to clean state when `mutation={}` changed ([ef5ca8c](https://github.com/frontier-forms/frontier-forms/commit/ef5ca8c))


### Features

* add support for `formats` (custom validations) ([00d4e27](https://github.com/frontier-forms/frontier-forms/commit/00d4e27))



## [0.1.0-1](https://github.com/frontier-forms/frontier-forms/compare/v0.1.0-0...v0.1.0-1) (2019-05-12)



## [0.1.0-0](https://github.com/frontier-forms/frontier-forms/compare/v0.0.1...v0.1.0-0) (2019-05-12)


### Bug Fixes

* **core:** check all fields when validating, handle "required" errors ([5664c40](https://github.com/frontier-forms/frontier-forms/commit/5664c40))
* **data/graphql:** return Form Schema and not GraphQL JSON-Schema ([5c03d54](https://github.com/frontier-forms/frontier-forms/commit/5c03d54))
* **react:** flag component as "mounted" properly ([70adc6a](https://github.com/frontier-forms/frontier-forms/commit/70adc6a))
* **react:** make form state updates re-render <Frontier> ([894ec25](https://github.com/frontier-forms/frontier-forms/commit/894ec25))
* **react:** memoize the uiKit renderer ([49e1a82](https://github.com/frontier-forms/frontier-forms/commit/49e1a82))
* **react:** typo in render props `modifiers` definition ([8daa050](https://github.com/frontier-forms/frontier-forms/commit/8daa050))
* **uikit:** path matcher issue ([d234863](https://github.com/frontier-forms/frontier-forms/commit/d234863))


### Features

* **core:** add support for `required` flag in `visitSchema()` ([42dea9c](https://github.com/frontier-forms/frontier-forms/commit/42dea9c))
* **core:** handle `mutation` prop update properly ([3dda2e0](https://github.com/frontier-forms/frontier-forms/commit/3dda2e0))
* **data:** add support for `array` type ([ffc2689](https://github.com/frontier-forms/frontier-forms/commit/ffc2689))
* **data:** GraphQL Schema can now be retrieve via ApolloClient instance ([eb0b7e4](https://github.com/frontier-forms/frontier-forms/commit/eb0b7e4))
* **data/graphql:** add support for `saveData` ([9118caa](https://github.com/frontier-forms/frontier-forms/commit/9118caa))
* **react:** add `order` props ([734136e](https://github.com/frontier-forms/frontier-forms/commit/734136e))
* **react:** add `resetOnSave` props ([8784453](https://github.com/frontier-forms/frontier-forms/commit/8784453))
* **react:** add Support for UI-kit with render props ([c616f33](https://github.com/frontier-forms/frontier-forms/commit/c616f33))
* **react:** allow to pass custom props to uiKit handler component ([51a62a9](https://github.com/frontier-forms/frontier-forms/commit/51a62a9))
* **react:** basic support for full UI-kit rendering ([bed93a4](https://github.com/frontier-forms/frontier-forms/commit/bed93a4))
* **ui-kit:** introduce a new `UIKit` API for building Frontier UIKit ([eafab46](https://github.com/frontier-forms/frontier-forms/commit/eafab46))
* **uikit:** pass the mutation's name to the UIKit handlers ([48ff23a](https://github.com/frontier-forms/frontier-forms/commit/48ff23a))


### Tests

* **react:** set-up some basic Enzyme tests for Frontier React HoC ([1dbfee6](https://github.com/frontier-forms/frontier-forms/commit/1dbfee6))



## 0.0.1 (2019-04-14)


### Features

* **core:** setup of `final-form` and `ajv` ([86ed0de](https://github.com/frontier-forms/frontier-forms/commit/86ed0de))
* **data/graphql:** write a basic GQL to JSON Schema in Frontiers.Data ([5a88f89](https://github.com/frontier-forms/frontier-forms/commit/5a88f89))
