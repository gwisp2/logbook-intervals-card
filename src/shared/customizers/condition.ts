import { object, optional, string, Struct } from 'superstruct';
import wcmatch from 'wildcard-match';
import { Schema } from 'yaml';

import { IntersectTypes } from './type-magic';

/*
 * Condition<Target> is something that maps Target to true/false
 */
export interface Condition<Target> {
  check(context: Target): boolean;
}

/*
 * Condition factory is a tuple of:
 * 1. a configuration schema
 * 2. function that builds a condition using the configuration provided
 */
export interface ConditionFactory<Config, Target> {
  configSchema: Struct<Config, any>;
  createCondition(config: Config): Condition<Target>;
}

/*
 * Condition that always returns true
 */
export const AlwaysTrue = new (class AlwaysTrue implements Condition<unknown> {
  check = () => true;
})();

/*
 * Helper for generation of condition factory classes
 */
export function createConditionFactoryClass<Config, CompiledConfig, Target>(options: {
  name: string;
  configSchema: Struct<Config>;
  compileConfig: (config: Config) => CompiledConfig;
  check: (conf: CompiledConfig, target: Target) => boolean;
}): { new (): ConditionFactory<Config, Target> } {
  const ConditionClass = class implements Condition<Target> {
    constructor(private _name: string, private compiledConfig: CompiledConfig) {}
    check(t: Target) {
      return options.check(this.compiledConfig, t);
    }
  };
  const ConditionFactoryClass = class implements ConditionFactory<Config, Target> {
    name = options.name;
    configSchema = options.configSchema;
    createCondition(config: Config): Condition<Target> {
      const compiledConfig = options.compileConfig(config);
      return new ConditionClass(this.name, compiledConfig);
    }
  };
  return ConditionFactoryClass;
}

/*
 * Config & Target type extractors
 */
export type ConfigType<M extends ConditionFactory<any, any>> = M extends ConditionFactory<infer Config, any>
  ? Config
  : never;
export type ConfigTypes<X extends readonly ConditionFactory<any, any>[]> = { [K in keyof X]: ConfigType<X[K]> };
export type TargetType<M extends ConditionFactory<any, any>> = M extends ConditionFactory<any, infer Context>
  ? Context
  : never;
export type TargetTypes<X extends readonly ConditionFactory<any, any>[]> = { [K in keyof X]: TargetType<X[K]> };
export type PartialRecord<Key extends string, Value> = Partial<Record<Key, Value>>;

/**
 * Condition that extracts value from target & calls delegate condition
 */
export class DelegatingCondition<Target, DelegateTarget> implements Condition<Target> {
  constructor(private extractor: (target: Target) => DelegateTarget, private delegate: Condition<DelegateTarget>) {}

  check(context: Target): boolean {
    return this.delegate.check(this.extractor(context));
  }
}

/*
 * Condition type that builds DelegatingCondition
 */
export class DelegatingConditionFactory<
  Name extends string,
  Target,
  DelegateTarget,
  DelegateConditionFactory extends ConditionFactory<any, DelegateTarget>,
> implements ConditionFactory<PartialRecord<Name, ConfigType<DelegateConditionFactory>>, Target>
{
  configSchema: Struct<{ [k in Name]?: ConfigType<DelegateConditionFactory> }>;

  constructor(
    private name: Name,
    private extractor: (target: Target) => DelegateTarget,
    private delegateConditionFactory: DelegateConditionFactory,
  ) {
    this.configSchema = object({ [name]: optional(delegateConditionFactory.configSchema) });
  }

  createCondition(config: { [k in Name]?: string }): Condition<Target> {
    const propConfig = config[this.name];
    if (propConfig !== undefined) {
      const delegateCondition = this.delegateConditionFactory.createCondition(propConfig);
      return new DelegatingCondition(this.extractor, delegateCondition);
    } else {
      return AlwaysTrue;
    }
  }
}

export const WildcardConditionFactory = createConditionFactoryClass({
  name: 'wildcard',
  configSchema: string(),
  compileConfig: (x) => wcmatch(x),
  check: (matcher, target: string) => matcher(target),
});

/*
 * Combines several conditions.
 * check() is true is all of subconditions return true
 */
class CombinedCondition<Target> implements Condition<Target> {
  constructor(private subconditions: Condition<Target>[]) {}

  check(target: Target): boolean {
    return this.subconditions.every((s) => s.check(target));
  }
}

/*
 * Combines several conditions.
 * check() is true of none of subconditions return false
 */
export class CombinedConditionFactory<ConditionFactoriesTuple extends readonly ConditionFactory<any, any>[]>
  implements
    ConditionFactory<
      IntersectTypes<ConfigTypes<ConditionFactoriesTuple>>,
      IntersectTypes<TargetTypes<ConditionFactoriesTuple>>
    >
{
  configSchema: Struct<IntersectTypes<ConfigTypes<ConditionFactoriesTuple>>, unknown>;

  constructor(private conditionsFactories: ConditionFactoriesTuple) {
    const properties: Record<string, Struct<any>> = {};
    for (const conditionFactory of conditionsFactories) {
      const schema = conditionFactory.configSchema.schema as Record<string, Struct<any>>;
      for (const [key, valueSchema] of Object.entries(schema)) {
        properties[key] = valueSchema;
      }
    }
    this.configSchema = object(properties) as any;
  }

  createCondition(
    config: IntersectTypes<ConfigTypes<ConditionFactoriesTuple>>,
  ): Condition<IntersectTypes<TargetTypes<ConditionFactoriesTuple>>> {
    const conditions = this.conditionsFactories.map((m) => m.createCondition(config)).filter((a) => a !== AlwaysTrue);
    if (conditions.length === 0) {
      return AlwaysTrue;
    } else if (conditions.length === 1) {
      return conditions[0];
    } else {
      return new CombinedCondition(conditions);
    }
  }
}
