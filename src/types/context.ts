// src/types/context.ts

export type UserIntent =
  | 'CAN_I_AFFORD_IT'
  | 'HOW_MUCH_WILL_IT_COST'
  | 'HOW_MUCH_SHOULD_I_SAVE'
  | 'HOW_CAN_I_DO_IT'
  | 'WHAT_ARE_MY_OPTIONS'
  | 'WHERE_SHOULD_I_GO'
  | 'CAN_I_START_THIS_BUSINESS'
  | 'CAN_I_CHANGE_CAREER'
  | 'CAN_I_RELOCATE'
  | 'BUILD_ME_A_PLAN'
  | 'HELP_ME_DECIDE'
  | 'OTHER';

export type ProjectDomain =
  | 'travel'
  | 'relocation'
  | 'business'
  | 'career'
  | 'education'
  | 'real_estate'
  | 'purchase'
  | 'digital_project'
  | 'personal_finance'
  | 'life_change'
  | 'other';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface UserLanguageProficiency {
  language: string;
  level?: 'basic' | 'intermediate' | 'fluent' | 'native';
}

export interface UserPreferences {
  climate?: string[]; // e.g. 'warm', 'temperate', 'cold'
  environment?: string[]; // e.g. 'sea', 'mountain', 'city', 'countryside'
  lifestyle?: string[]; // e.g. 'quiet', 'vibrant', 'outdoor', 'cosmopolitan'
  riskTolerance?: 'low' | 'medium' | 'high';
  pace?: 'fast' | 'balanced' | 'slow';
  priority?: 'cost_of_living' | 'salary' | 'climate' | 'safety' | 'career_growth' | 'work_life_balance';
}

export interface UserContext {
  id?: string;
  goal?: string;
  domain?: ProjectDomain;
  intent?: UserIntent;
  currentCountry?: string;
  currentCity?: string;
  targetCountry?: string;
  targetCity?: string;
  durationDays?: number;
  durationMonths?: number;
  budget?: number; // available capital / liquid savings
  savings?: number; // alias or reserve
  monthlyIncome?: number; // active net earnings
  monthlyExpenses?: number; // fixed personal spending
  monthlySavingsCapacity?: number;
  profession?: string;
  qualifications?: string[];
  skills?: string[];
  languages?: UserLanguageProficiency[];
  householdSize?: number;
  travellingWith?: number;
  isRemoteFriendly?: boolean;
  hasOwnVehicle?: boolean;
  hasPremises?: boolean;
  businessType?: string;
  preferences?: UserPreferences;
  constraints?: string[];
  knownFacts?: Record<string, any>;
  unknownFields?: string[];
  lastUpdated?: string;
}
