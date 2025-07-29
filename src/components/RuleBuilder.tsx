'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DataState, BusinessRule, CoRunRule, SlotRestrictionRule, LoadLimitRule, PhaseWindowRule } from '@/types/data';
import { Plus, Trash2, Settings, Brain } from 'lucide-react';
import { toast } from 'sonner';

interface RuleBuilderProps {
  dataState: DataState;
  businessRules: BusinessRule[];
  onRuleUpdate: (rules: BusinessRule[]) => void;
}

export function RuleBuilder({ dataState, businessRules, onRuleUpdate }: RuleBuilderProps) {
  const [selectedRuleType, setSelectedRuleType] = useState<string>('');
  const [isCreatingRule, setIsCreatingRule] = useState(false);
  const [naturalLanguageRule, setNaturalLanguageRule] = useState('');

  // Form state for different rule types
  const [coRunTasks, setCoRunTasks] = useState<string[]>([]);
  const [slotRestriction, setSlotRestriction] = useState({
    targetGroup: '',
    targetType: 'client' as 'client' | 'worker',
    minCommonSlots: 1
  });
  const [loadLimit, setLoadLimit] = useState({
    workerGroup: '',
    maxSlotsPerPhase: 1
  });
  const [phaseWindow, setPhaseWindow] = useState({
    taskId: '',
    allowedPhases: [] as number[]
  });

  const createRule = () => {
    if (!selectedRuleType) {
      toast.error('Please select a rule type');
      return;
    }

    const ruleId = `rule_${Date.now()}`;
    let newRule: BusinessRule | null = null;

    switch (selectedRuleType) {
      case 'coRun':
        if (coRunTasks.length < 2) {
          toast.error('Co-run rules require at least 2 tasks');
          return;
        }
        newRule = {
          type: 'coRun',
          id: ruleId,
          name: `Co-run: ${coRunTasks.join(', ')}`,
          tasks: coRunTasks
        } as CoRunRule;
        break;

      case 'slotRestriction':
        if (!slotRestriction.targetGroup) {
          toast.error('Please specify a target group');
          return;
        }
        newRule = {
          type: 'slotRestriction',
          id: ruleId,
          name: `Slot restriction: ${slotRestriction.targetGroup}`,
          targetGroup: slotRestriction.targetGroup,
          targetType: slotRestriction.targetType,
          minCommonSlots: slotRestriction.minCommonSlots
        } as SlotRestrictionRule;
        break;

      case 'loadLimit':
        if (!loadLimit.workerGroup) {
          toast.error('Please specify a worker group');
          return;
        }
        newRule = {
          type: 'loadLimit',
          id: ruleId,
          name: `Load limit: ${loadLimit.workerGroup}`,
          workerGroup: loadLimit.workerGroup,
          maxSlotsPerPhase: loadLimit.maxSlotsPerPhase
        } as LoadLimitRule;
        break;

      case 'phaseWindow':
        if (!phaseWindow.taskId || phaseWindow.allowedPhases.length === 0) {
          toast.error('Please specify task ID and allowed phases');
          return;
        }
        newRule = {
          type: 'phaseWindow',
          id: ruleId,
          name: `Phase window: ${phaseWindow.taskId}`,
          taskId: phaseWindow.taskId,
          allowedPhases: phaseWindow.allowedPhases
        } as PhaseWindowRule;
        break;
    }

    if (newRule) {
      onRuleUpdate([...businessRules, newRule]);
      resetForm();
      toast.success('Rule created successfully');
    }
  };

  const deleteRule = (ruleId: string) => {
    onRuleUpdate(businessRules.filter(rule => rule.id !== ruleId));
    toast.success('Rule deleted');
  };

  const resetForm = () => {
    setSelectedRuleType('');
    setCoRunTasks([]);
    setSlotRestriction({ targetGroup: '', targetType: 'client', minCommonSlots: 1 });
    setLoadLimit({ workerGroup: '', maxSlotsPerPhase: 1 });
    setPhaseWindow({ taskId: '', allowedPhases: [] });
    setIsCreatingRule(false);
  };

  const processNaturalLanguageRule = async () => {
    if (!naturalLanguageRule.trim()) {
      toast.error('Please enter a rule description');
      return;
    }

    // Simulate AI processing (in a real app, this would call an AI service)
    toast.info('Processing natural language rule...');
    
    // Simple pattern matching for demonstration
    const lowerRule = naturalLanguageRule.toLowerCase();
    
    if (lowerRule.includes('run together') || lowerRule.includes('co-run')) {
      // Extract task IDs from the rule
      const taskMatches = naturalLanguageRule.match(/T\d+/g);
      if (taskMatches && taskMatches.length >= 2) {
        setSelectedRuleType('coRun');
        setCoRunTasks(taskMatches);
        setIsCreatingRule(true);
        toast.success('Detected co-run rule');
      }
    } else if (lowerRule.includes('load limit') || lowerRule.includes('max load')) {
      setSelectedRuleType('loadLimit');
      setIsCreatingRule(true);
      toast.success('Detected load limit rule');
    } else if (lowerRule.includes('phase') && (lowerRule.includes('only') || lowerRule.includes('restrict'))) {
      setSelectedRuleType('phaseWindow');
      setIsCreatingRule(true);
      toast.success('Detected phase window rule');
    } else {
      toast.warning('Could not automatically detect rule type. Please create manually.');
    }
    
    setNaturalLanguageRule('');
  };

  const renderRuleForm = () => {
    switch (selectedRuleType) {
      case 'coRun':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Select Tasks to Run Together</label>
              <Select onValueChange={(taskId) => {
                if (taskId && !coRunTasks.includes(taskId)) {
                  setCoRunTasks([...coRunTasks, taskId]);
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Add task to co-run group" />
                </SelectTrigger>
                <SelectContent>
                  {dataState.tasks.map(task => (
                    <SelectItem key={task.TaskID} value={task.TaskID} disabled={coRunTasks.includes(task.TaskID)}>
                      {task.TaskID} - {task.TaskName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-2">
              {coRunTasks.map(taskId => (
                <Badge key={taskId} variant="secondary" className="cursor-pointer" onClick={() => {
                  setCoRunTasks(coRunTasks.filter(id => id !== taskId));
                }}>
                  {taskId} ×
                </Badge>
              ))}
            </div>
          </div>
        );

      case 'slotRestriction':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Target Type</label>
              <Select value={slotRestriction.targetType} onValueChange={(value: 'client' | 'worker') => 
                setSlotRestriction({...slotRestriction, targetType: value})
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Client Group</SelectItem>
                  <SelectItem value="worker">Worker Group</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Target Group</label>
              <Input
                value={slotRestriction.targetGroup}
                onChange={(e) => setSlotRestriction({...slotRestriction, targetGroup: e.target.value})}
                placeholder="Enter group name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Minimum Common Slots</label>
              <Input
                type="number"
                min="1"
                value={slotRestriction.minCommonSlots}
                onChange={(e) => setSlotRestriction({...slotRestriction, minCommonSlots: parseInt(e.target.value)})}
              />
            </div>
          </div>
        );

      case 'loadLimit':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Worker Group</label>
              <Select onValueChange={(value) => setLoadLimit({...loadLimit, workerGroup: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select worker group" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(new Set(dataState.workers.map(w => w.WorkerGroup))).map(group => (
                    <SelectItem key={group} value={group}>{group}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Max Slots Per Phase</label>
              <Input
                type="number"
                min="1"
                value={loadLimit.maxSlotsPerPhase}
                onChange={(e) => setLoadLimit({...loadLimit, maxSlotsPerPhase: parseInt(e.target.value)})}
              />
            </div>
          </div>
        );

      case 'phaseWindow':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Task</label>
              <Select onValueChange={(value) => setPhaseWindow({...phaseWindow, taskId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select task" />
                </SelectTrigger>
                <SelectContent>
                  {dataState.tasks.map(task => (
                    <SelectItem key={task.TaskID} value={task.TaskID}>
                      {task.TaskID} - {task.TaskName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Allowed Phases (comma-separated)</label>
              <Input
                placeholder="e.g., 1,2,3"
                onChange={(e) => {
                  const phases = e.target.value.split(',')
                    .map(p => parseInt(p.trim()))
                    .filter(p => !isNaN(p));
                  setPhaseWindow({...phaseWindow, allowedPhases: phases});
                }}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Settings className="h-5 w-5 mr-2" />
          Business Rules Builder
        </CardTitle>
        <CardDescription>
          Create and manage business rules for resource allocation. Use natural language or form-based input.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Natural Language Rule Input */}
        <div className="border rounded-lg p-4 bg-blue-50">
          <div className="flex items-center mb-3">
            <Brain className="h-4 w-4 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-blue-900">AI Rule Generator</span>
          </div>
          <div className="space-y-3">
            <Textarea
              value={naturalLanguageRule}
              onChange={(e) => setNaturalLanguageRule(e.target.value)}
              placeholder="Describe your rule in plain English. e.g., 'Tasks T001 and T003 should run together' or 'Backend workers should have a maximum load of 2 per phase'"
              className="bg-white"
            />
            <Button 
              onClick={processNaturalLanguageRule}
              size="sm"
              className="w-full"
            >
              <Brain className="h-4 w-4 mr-2" />
              Generate Rule from Description
            </Button>
          </div>
        </div>

        {/* Manual Rule Creation */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Manual Rule Creation</h3>
            {!isCreatingRule && (
              <Button onClick={() => setIsCreatingRule(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Rule
              </Button>
            )}
          </div>

          {isCreatingRule && (
            <div className="border rounded-lg p-4 space-y-4">
              <div>
                <label className="text-sm font-medium">Rule Type</label>
                <Select value={selectedRuleType} onValueChange={setSelectedRuleType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select rule type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="coRun">Co-run Tasks</SelectItem>
                    <SelectItem value="slotRestriction">Slot Restriction</SelectItem>
                    <SelectItem value="loadLimit">Load Limit</SelectItem>
                    <SelectItem value="phaseWindow">Phase Window</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {renderRuleForm()}

              <div className="flex space-x-2">
                <Button onClick={createRule}>
                  Create Rule
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Existing Rules */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Active Rules ({businessRules.length})</h3>
          
          {businessRules.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No rules created yet</p>
              <p className="text-sm">Create your first rule using the form above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {businessRules.map(rule => (
                <div key={rule.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{rule.type.toUpperCase()}</Badge>
                        <span className="font-medium">{rule.name}</span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {rule.type === 'coRun' && `Tasks: ${(rule as CoRunRule).tasks.join(', ')}`}
                        {rule.type === 'slotRestriction' && `Group: ${(rule as SlotRestrictionRule).targetGroup} (${(rule as SlotRestrictionRule).minCommonSlots} slots)`}
                        {rule.type === 'loadLimit' && `Group: ${(rule as LoadLimitRule).workerGroup} (max ${(rule as LoadLimitRule).maxSlotsPerPhase})`}
                        {rule.type === 'phaseWindow' && `Task: ${(rule as PhaseWindowRule).taskId} (phases: ${(rule as PhaseWindowRule).allowedPhases.join(', ')})`}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteRule(rule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
