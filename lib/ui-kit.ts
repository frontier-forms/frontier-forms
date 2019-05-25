import { FieldState, FormApi } from 'final-form';
import { JSONSchema7TypeName } from 'json-schema';
import { find } from 'lodash';
import { ComponentType, ReactNode } from 'react';

export type UIKITFieldProps = FieldState & { children?: ReactNode };
export interface UIKitResolver {
  (path: string, type: JSONSchema7TypeName, required: boolean, children?: ReactNode): ComponentType<UIKITFieldProps>;
}

export type UIKitPathHandler =
  (path: string, type: JSONSchema7TypeName, required: boolean, children?: ReactNode) => ComponentType<UIKITFieldProps>;
export type UIKitTypeHandler =
  (path: string, required: boolean, children?: ReactNode) => ComponentType<UIKITFieldProps>;
export type UIKitUnknownHandler = (path: string, type: JSONSchema7TypeName) => ComponentType<UIKITFieldProps>;
export type UIKitFormHandler = (form: FormApi, children?: ReactNode) => ReactNode;

export interface UIKitAPI {
  form: (f: UIKitFormHandler) => UIKitAPI;
  unknown: (f: UIKitUnknownHandler) => UIKitAPI;
  path: (path: string | RegExp, f: UIKitPathHandler) => UIKitAPI;
  type: (type: JSONSchema7TypeName, f: UIKitTypeHandler) => UIKitAPI;
  // internals
  __reducer: (
    path: string, type: JSONSchema7TypeName, required: boolean, children?: ReactNode
  ) => ComponentType<UIKITFieldProps>;
  __wrapWithForm: UIKitFormHandler;
}

interface UIKitHandlers {
  unknown: UIKitUnknownHandler;
  types: { [k: string]: UIKitTypeHandler };
  paths: { [k: string]: UIKitPathHandler };
  form?: UIKitFormHandler;
}

export const UIKit = (): UIKitAPI => {
  let handlers: UIKitHandlers = {
    unknown: (path, type) => {
      console.warn(`No component matching for field "${path}" with type ${type}`);
      return () => null;
    },
    types: {},
    paths: {}
  };

  const api: UIKitAPI = {
    unknown: handler => {
      if (handlers.unknown) {
        console.warn('Frontier: overwritting a already define handler for `unknown`');
      }
      handlers.unknown = handler;
      return api;
    },
    type: (type, handler) => {
      handlers.types[type] = handler;
      return api;
    },
    path: (path, handler) => {
      handlers.paths[path.toString()] = handler;
      return api;
    },
    form: handler => {
      handlers.form = handler;
      return api;
    },
    // internals (called by Frontier/core)

    __wrapWithForm: (state, children) => {
      if (!handlers.form) {
        // tslint:disable-next-line no-console
        console.error('Frontier: no `form` handler defined in UIKit!');
        return null;
      } else {
        return handlers.form(state, children);
      }
    },

    __reducer: (path, type, required, children) => {
      let pathHandler: UIKitPathHandler | undefined = find(handlers.paths, (_handler, handlerPath: string) => {
        if (handlerPath[0] === '/') {
          const regex = new RegExp(handlerPath.substr(1, handlerPath.length).substr(0, handlerPath.length - 2));
          return regex.test(path);
        } else {
          return handlerPath === path;
        }
      });

      if (pathHandler) {
        return pathHandler(path, type, required, children);
      }

      if (handlers.types[type]) {
        return (handlers.types[type] as UIKitTypeHandler)(path, required, children);
      }

      return handlers.unknown(path, type);
    },
  };
  return api;
};
