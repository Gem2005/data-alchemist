// Core data types for the Data Alchemist application

export interface Client {
  ClientID: string;
  ClientName: string;
  PriorityLevel: number; // 1-5
  RequestedTaskIDs: string; // comma-separated
  GroupTag: string;
  AttributesJSON: string;
}

export interface Worker {
  WorkerID: string;
  WorkerName: string;
  Skills: string; // comma-separated
  AvailableSlots: string; // JSON array of phase numbers
  MaxLoadPerPhase: number;
  WorkerGroup: string;
  QualificationLevel: string;
}

export interface Task {
  TaskID: string;
  TaskName: string;
  Category: string;
  Duration: number; // number of phases (≥1)
  RequiredSkills: string; // comma-separated
  PreferredPhases: string; // list or range syntax
  MaxConcurrent: number;
}

// Parsed data types with proper arrays and objects
export interface ParsedClient extends Omit<Client, 'RequestedTaskIDs' | 'AttributesJSON'> {
  RequestedTaskIDs: string[];
  AttributesJSON: Record<string, unknown>;
}

export interface ParsedWorker extends Omit<Worker, 'Skills' | 'AvailableSlots'> {
  Skills: string[];
  AvailableSlots: number[];
}

export interface ParsedTask extends Omit<Task, 'RequiredSkills' | 'PreferredPhases'> {
  RequiredSkills: string[];
  PreferredPhases: number[];
}

// Validation error types
export interface ValidationError {
  id: string;
  type: 'error' | 'warning' | 'info';
  entity: 'client' | 'worker' | 'task';
  entityId: string;
  field: string;
  message: string;
  suggestion?: string;
  autoFixAvailable?: boolean;
}

// Business rules types
export interface CoRunRule {
  type: 'coRun';
  id: string;
  name: string;
  tasks: string[];
}

export interface SlotRestrictionRule {
  type: 'slotRestriction';
  id: string;
  name: string;
  targetGroup: string;
  targetType: 'client' | 'worker';
  minCommonSlots: number;
}

export interface LoadLimitRule {
  type: 'loadLimit';
  id: string;
  name: string;
  workerGroup: string;
  maxSlotsPerPhase: number;
}

export interface PhaseWindowRule {
  type: 'phaseWindow';
  id: string;
  name: string;
  taskId: string;
  allowedPhases: number[];
}

export interface PatternMatchRule {
  type: 'patternMatch';
  id: string;
  name: string;
  regex: string;
  template: string;
  parameters: Record<string, unknown>;
}

export interface PrecedenceOverrideRule {
  type: 'precedenceOverride';
  id: string;
  name: string;
  globalRules: string[];
  specificRules: string[];
  priority: number;
}

export type BusinessRule = 
  | CoRunRule 
  | SlotRestrictionRule 
  | LoadLimitRule 
  | PhaseWindowRule 
  | PatternMatchRule 
  | PrecedenceOverrideRule;

// Prioritization and weights
export interface PrioritizationWeights {
  priorityLevel: number;
  taskFulfillment: number;
  fairness: number;
  workloadBalance: number;
  skillMatching: number;
  phasePreference: number;
  clientGroup: number;
  workerExperience: number;
}

export interface PrioritizationProfile {
  id: string;
  name: string;
  description: string;
  weights: PrioritizationWeights;
}

// Export configuration
export interface ExportConfig {
  clients: ParsedClient[];
  workers: ParsedWorker[];
  tasks: ParsedTask[];
  rules: BusinessRule[];
  prioritization: PrioritizationWeights;
  metadata: {
    exportDate: string;
    version: string;
    validationPassed: boolean;
    totalErrors: number;
    totalWarnings: number;
  };
}

// UI state types
export interface FileUploadState {
  clients: File | null;
  workers: File | null;
  tasks: File | null;
}

export interface DataState {
  clients: ParsedClient[];
  workers: ParsedWorker[];
  tasks: ParsedTask[];
  isLoading: boolean;
  errors: ValidationError[];
}

// AI interaction types
export interface AIQuery {
  id: string;
  query: string;
  type: 'search' | 'modify' | 'validate' | 'rule';
  timestamp: Date;
  results?: unknown[];
  status: 'pending' | 'success' | 'error';
  error?: string;
}

export interface AIResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  suggestions?: string[];
  confidence?: number;
}
