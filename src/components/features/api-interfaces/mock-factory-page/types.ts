import type { MockRule, MockScene, HttpRuleFeatures, DubboRuleFeatures } from '@/services/mock-factory';

export interface ExpandedJson {
  type: 'req' | 'resp';
  index: number;
}

export interface MockRuleFormData extends Partial<MockRule> {
  sceneCode: string;
  serviceCode: string;
  status: number;
  ruleFeatures: HttpRuleFeatures | DubboRuleFeatures | {};
  respStruct: {
    responseTypes: 'String' | 'Object' | 'List' | 'Int' | 'Boolean';
    content: any;
  };
  features: {
    rule: string;
    ruleType: 'HTTP' | 'DUBBO';
  };
}

export type { MockRule, MockScene, HttpRuleFeatures, DubboRuleFeatures };
