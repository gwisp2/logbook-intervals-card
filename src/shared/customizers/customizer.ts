import { array, Infer, object, optional, Struct } from 'superstruct';

import { Action, ActionFactory } from './action';
import { Condition, ConditionFactory, AlwaysTrue } from './condition';

interface Customizer<Context extends object> {
  apply(context: Context): void;
}

export class BasicCustomizer<Context extends object> implements Customizer<Context> {
  constructor(private condition: Condition<Context>, private action: Action<Context>) {}

  apply(context: Context) {
    if (this.condition.check(context) ?? true) {
      this.action.apply(context);
    }
  }
}

export class CustomizerChain<Context extends object> implements Customizer<Context> {
  constructor(private customizers: Customizer<Context>[]) {}
  apply(context: Context): void {
    this.customizers.forEach((m) => m.apply(context));
  }
}

export class CustomizerFactory<ConditionConfig, ActionConfig extends object, Context extends object> {
  public customizerSchema: Struct<ActionConfig & { when?: ConditionConfig }>;
  public customizerChainSchema: Struct<Infer<typeof this.customizerSchema>[] | undefined>;

  constructor(
    private conditionType: ConditionFactory<ConditionConfig, Context>,
    private actionFactory: ActionFactory<ActionConfig, Context>,
  ) {
    const actionConfigSchema = actionFactory.configSchema;
    this.customizerSchema = object({
      when: optional(conditionType.configSchema),
      ...(actionConfigSchema.schema as object),
    }) as any;
    this.customizerChainSchema = optional(array(this.customizerSchema));
  }

  createCustomizer(validatedConfig: Infer<typeof this.customizerSchema>): Customizer<Context> {
    const condition =
      validatedConfig.when !== undefined ? this.conditionType.createCondition(validatedConfig.when) : AlwaysTrue;
    const actionConfig = { ...validatedConfig, when: undefined };
    delete actionConfig['when'];
    const action = this.actionFactory.createAction(actionConfig);
    return new BasicCustomizer(condition, action);
  }

  createCustomizerChain(validatedConfig: Infer<typeof this.customizerChainSchema>) {
    if (validatedConfig === undefined) {
      return new CustomizerChain([]);
    }
    return new CustomizerChain(validatedConfig.map((mConfig) => this.createCustomizer(mConfig)));
  }
}
