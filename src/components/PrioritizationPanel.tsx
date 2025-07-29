'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PrioritizationWeights, PrioritizationProfile } from '@/types/data';
import { BarChart3, Target, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface PrioritizationPanelProps {
  weights: PrioritizationWeights;
  onWeightsUpdate: (weights: PrioritizationWeights) => void;
}

const prioritizationProfiles: PrioritizationProfile[] = [
  {
    id: 'balanced',
    name: 'Balanced Approach',
    description: 'Equal consideration for all factors',
    weights: {
      priorityLevel: 0.125,
      taskFulfillment: 0.125,
      fairness: 0.125,
      workloadBalance: 0.125,
      skillMatching: 0.125,
      phasePreference: 0.125,
      clientGroup: 0.125,
      workerExperience: 0.125,
    }
  },
  {
    id: 'client_focused',
    name: 'Client-Focused',
    description: 'Prioritize client satisfaction and requests',
    weights: {
      priorityLevel: 0.35,
      taskFulfillment: 0.25,
      fairness: 0.10,
      workloadBalance: 0.10,
      skillMatching: 0.10,
      phasePreference: 0.05,
      clientGroup: 0.03,
      workerExperience: 0.02,
    }
  },
  {
    id: 'efficiency',
    name: 'Maximum Efficiency',
    description: 'Optimize for skill matching and workload balance',
    weights: {
      priorityLevel: 0.15,
      taskFulfillment: 0.20,
      fairness: 0.10,
      workloadBalance: 0.25,
      skillMatching: 0.25,
      phasePreference: 0.03,
      clientGroup: 0.01,
      workerExperience: 0.01,
    }
  },
  {
    id: 'fairness',
    name: 'Fair Distribution',
    description: 'Ensure equitable work distribution',
    weights: {
      priorityLevel: 0.10,
      taskFulfillment: 0.15,
      fairness: 0.40,
      workloadBalance: 0.25,
      skillMatching: 0.05,
      phasePreference: 0.02,
      clientGroup: 0.02,
      workerExperience: 0.01,
    }
  }
];

export function PrioritizationPanel({ weights, onWeightsUpdate }: PrioritizationPanelProps) {
  const [selectedProfile, setSelectedProfile] = useState<string>('');

  const updateWeight = (key: keyof PrioritizationWeights, value: number[]) => {
    const newWeight = value[0] / 100; // Convert from 0-100 to 0-1
    const currentTotal = Object.values(weights).reduce((sum, w) => sum + w, 0);
    const newTotal = currentTotal - weights[key] + newWeight;
    
    if (newTotal > 1.001) { // Allow small floating point errors
      toast.error('Total weights cannot exceed 100%');
      return;
    }

    onWeightsUpdate({
      ...weights,
      [key]: newWeight
    });
  };

  const normalizeWeights = () => {
    const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
    if (total === 0) return;

    const normalizedWeights = Object.keys(weights).reduce((acc, key) => {
      acc[key as keyof PrioritizationWeights] = weights[key as keyof PrioritizationWeights] / total;
      return acc;
    }, {} as PrioritizationWeights);

    onWeightsUpdate(normalizedWeights);
    toast.success('Weights normalized to 100%');
  };

  const applyProfile = (profileId: string) => {
    const profile = prioritizationProfiles.find(p => p.id === profileId);
    if (profile) {
      onWeightsUpdate(profile.weights);
      setSelectedProfile(profileId);
      toast.success(`Applied ${profile.name} profile`);
    }
  };

  const resetToDefault = () => {
    const defaultWeights: PrioritizationWeights = {
      priorityLevel: 0.25,
      taskFulfillment: 0.20,
      fairness: 0.15,
      workloadBalance: 0.15,
      skillMatching: 0.10,
      phasePreference: 0.05,
      clientGroup: 0.05,
      workerExperience: 0.05,
    };
    onWeightsUpdate(defaultWeights);
    setSelectedProfile('');
    toast.success('Reset to default weights');
  };

  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  const isValidTotal = totalWeight >= 0.99 && totalWeight <= 1.01;

  const weightLabels: Record<keyof PrioritizationWeights, string> = {
    priorityLevel: 'Client Priority Level',
    taskFulfillment: 'Task Fulfillment',
    fairness: 'Fair Distribution',
    workloadBalance: 'Workload Balance',
    skillMatching: 'Skill Matching',
    phasePreference: 'Phase Preference',
    clientGroup: 'Client Group Priority',
    workerExperience: 'Worker Experience',
  };

  const weightDescriptions: Record<keyof PrioritizationWeights, string> = {
    priorityLevel: 'How much to consider client priority levels (1-5)',
    taskFulfillment: 'Importance of fulfilling requested tasks',
    fairness: 'Ensuring equitable distribution of work',
    workloadBalance: 'Balancing workload across workers',
    skillMatching: 'Matching required skills with worker capabilities',
    phasePreference: 'Respecting preferred execution phases',
    clientGroup: 'Group-based client prioritization',
    workerExperience: 'Considering worker qualification levels',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Target className="h-5 w-5 mr-2" />
          Prioritization & Weights
        </CardTitle>
        <CardDescription>
          Configure how the allocation system should balance different criteria
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Quick Profiles */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Quick Profiles</h3>
          <Select value={selectedProfile} onValueChange={applyProfile}>
            <SelectTrigger>
              <SelectValue placeholder="Select a prioritization profile" />
            </SelectTrigger>
            <SelectContent>
              {prioritizationProfiles.map(profile => (
                <SelectItem key={profile.id} value={profile.id}>
                  <div>
                    <div className="font-medium">{profile.name}</div>
                    <div className="text-xs text-gray-500">{profile.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Weight Configuration */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Custom Weights</h3>
            <div className="flex items-center space-x-2">
              <Badge variant={isValidTotal ? "default" : "destructive"}>
                Total: {(totalWeight * 100).toFixed(1)}%
              </Badge>
              <Button size="sm" variant="outline" onClick={normalizeWeights}>
                <BarChart3 className="h-3 w-3 mr-1" />
                Normalize
              </Button>
              <Button size="sm" variant="outline" onClick={resetToDefault}>
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {Object.entries(weights).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">
                      {weightLabels[key as keyof PrioritizationWeights]}
                    </label>
                    <p className="text-xs text-gray-500">
                      {weightDescriptions[key as keyof PrioritizationWeights]}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium">{(value * 100).toFixed(1)}%</span>
                  </div>
                </div>
                <Slider
                  value={[value * 100]}
                  onValueChange={(newValue) => updateWeight(key as keyof PrioritizationWeights, newValue)}
                  max={100}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Weight Visualization */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Weight Distribution</h3>
          <div className="space-y-2">
            {Object.entries(weights)
              .sort(([,a], [,b]) => b - a)
              .map(([key, value]) => (
                <div key={key} className="flex items-center space-x-3">
                  <div className="w-32 text-xs truncate">
                    {weightLabels[key as keyof PrioritizationWeights]}
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(value / Math.max(...Object.values(weights))) * 100}%` }}
                    />
                  </div>
                  <div className="w-12 text-xs text-right">
                    {(value * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Validation Warning */}
        {!isValidTotal && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center">
              <Target className="h-4 w-4 text-yellow-600 mr-2" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">
                  Weight Total: {(totalWeight * 100).toFixed(1)}%
                </p>
                <p className="text-yellow-700">
                  Weights should add up to 100% for optimal allocation. 
                  Click &quot;Normalize&quot; to automatically adjust.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
