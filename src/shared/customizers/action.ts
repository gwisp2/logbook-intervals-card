import _ from 'lodash-es';
import { object, optional, Struct } from 'superstruct';

import { IntersectTypes } from './type-magic';

/*
 * Action<Target> is something that can modify objects of type Target
 */
export interface Action<Target extends object> {
  apply(obj: Target): void;
}

/*
 * Action that does nothing
 */
export const NopAction: Action<object> = {
  apply: (_obj: any) => {},
};

/*
 * Action factory is a tuple of:
 * 1. a configuration schema
 * 2. function that builds an action using the configuration provided
 */
export interface ActionFactory<Config, Target extends object> {
  configSchema: Struct<Config>;
  createAction(config: Config): Action<Target>;
}

/*
 * Returns new object of type Value with changes from Change applied
 */
export type ReduceFn<Value, Change> = (r: Value, update: Change) => Value;
export const replaceFn = <R>(_r: R, c: R): R => c;
export const assignFn = <R extends object>(r: R, c: R): R => {
  return { ...r, ...c };
};
export const mergeFn = <R extends object>(r: R, c: R): R => {
  return _.merge(r, c);
};

/*
 * Action factory that creates action that uses ReduceFn<PropType, Change> to update
 * an object with a property with name Name and type PropType.
 * Other properties of the object are not affected.
 */
export class PropertyActionFactory<Name extends string, Change, PropType = Change>
  implements ActionFactory<{ [k in Name]?: Change }, { [k in Name]: PropType }>
{
  configSchema: Struct<{ [k in Name]?: Change }>;

  constructor(
    private name: Name,
    configSchema: Struct<Change>,
    private reduceFn: (r: PropType, config: Change) => PropType,
  ) {
    this.configSchema = object({ [name]: optional(configSchema) }) as any;
  }

  createAction(config: { [k in Name]?: Change | undefined }): Action<{ [k in Name]: PropType }> {
    const valueFromConfig = config[this.name];
    if (valueFromConfig !== undefined) {
      return {
        apply: (obj: { [k in Name]: PropType }) => {
          const oldValue = obj[this.name];
          obj[this.name] = this.reduceFn(oldValue, valueFromConfig!);
        },
      };
    } else {
      return NopAction;
    }
  }
}

/*
 * Config & Target types extractors
 */
export type ConfigType<M extends ActionFactory<any, any>> = M extends ActionFactory<infer C, any> ? C : never;
export type ConfigTypes<X extends readonly ActionFactory<any, any>[]> = { [K in keyof X]: ConfigType<X[K]> };
export type TargetType<M extends ActionFactory<any, any>> = M extends ActionFactory<any, infer R> ? R : never;
export type TargetTypes<X extends readonly ActionFactory<any, any>[]> = { [K in keyof X]: TargetType<X[K]> };

/*
 * Action factory that combines multiple actions type.
 * Config type is an intersection of config types of each of the actions.
 * Target type is an intersection of target types of each of the actions.
 */
export class CombinedActionFactory<ActionFactoriesTuple extends readonly ActionFactory<any, any>[]>
  implements
    ActionFactory<IntersectTypes<ConfigTypes<ActionFactoriesTuple>>, IntersectTypes<TargetTypes<ActionFactoriesTuple>>>
{
  configSchema: Struct<IntersectTypes<ConfigTypes<ActionFactoriesTuple>>>;

  constructor(private actionTypes: ActionFactoriesTuple) {
    const properties: Record<string, Struct<any>> = {};
    for (const actionType of actionTypes) {
      const schema = actionType.configSchema.schema as Record<string, Struct<any>>;
      for (const [key, valueSchema] of Object.entries(schema)) {
        properties[key] = valueSchema;
      }
    }
    this.configSchema = object(properties) as any;
  }

  createAction(
    config: IntersectTypes<ConfigTypes<ActionFactoriesTuple>>,
  ): Action<IntersectTypes<TargetTypes<ActionFactoriesTuple>>> {
    const actions = this.actionTypes.map((m) => m.createAction(config)).filter((a) => a !== NopAction);
    return {
      apply: (obj) => actions.forEach((action) => action.apply(obj)),
    };
  }
}
