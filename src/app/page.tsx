'use client';

import { useState } from 'react';
import { FileUploadSection } from '@/components/FileUploadSection';
import { DataGridSection } from '@/components/DataGridSection';
import { ValidationPanel } from '@/components/ValidationPanel';
import { RuleBuilder } from '@/components/RuleBuilder';
import { PrioritizationPanel } from '@/components/PrioritizationPanel';
import { AIAssistant } from '@/components/AIAssistant';
import { ExportSection } from '@/components/ExportSection';
import { DataState, FileUploadState, BusinessRule, PrioritizationWeights } from '@/types/data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Database, Settings, Download, CheckCircle } from 'lucide-react';

const defaultPrioritizationWeights: PrioritizationWeights = {
  priorityLevel: 0.25,
  taskFulfillment: 0.20,
  fairness: 0.15,
  workloadBalance: 0.15,
  skillMatching: 0.10,
  phasePreference: 0.05,
  clientGroup: 0.05,
  workerExperience: 0.05,
};

export default function Home() {
  const [dataState, setDataState] = useState<DataState>({
    clients: [],
    workers: [],
    tasks: [],
    isLoading: false,
    errors: [],
  });

  const [fileUploadState, setFileUploadState] = useState<FileUploadState>({
    clients: null,
    workers: null,
    tasks: null,
  });

  const [businessRules, setBusinessRules] = useState<BusinessRule[]>([]);
  const [prioritizationWeights, setPrioritizationWeights] = useState<PrioritizationWeights>(defaultPrioritizationWeights);
  const [activeTab, setActiveTab] = useState('upload');

  const handleDataUpdate = (newDataState: Partial<DataState>) => {
    setDataState(prev => ({ ...prev, ...newDataState }));
  };

  const handleRuleUpdate = (rules: BusinessRule[]) => {
    setBusinessRules(rules);
  };

  const hasData = dataState.clients.length > 0 || dataState.workers.length > 0 || dataState.tasks.length > 0;
  const validationPassed = dataState.errors.filter(e => e.type === 'error').length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Data Alchemist</h1>
                <p className="text-sm text-gray-600">AI-Powered Resource Allocation Configurator</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {hasData && (
                <div className="flex items-center space-x-2">
                  <div className={`h-3 w-3 rounded-full ${validationPassed ? 'bg-green-400' : 'bg-yellow-400'}`} />
                  <span className="text-sm text-gray-600">
                    {validationPassed ? 'Ready to Export' : 'Validation Issues'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full max-w-2xl mx-auto">
            <TabsTrigger value="upload" className="flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span>Data</span>
            </TabsTrigger>
            <TabsTrigger value="validate" disabled={!hasData} className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4" />
              <span>Validate</span>
            </TabsTrigger>
            <TabsTrigger value="rules" disabled={!hasData} className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Rules</span>
            </TabsTrigger>
            <TabsTrigger value="ai" disabled={!hasData} className="flex items-center space-x-2">
              <Brain className="h-4 w-4" />
              <span>AI Assistant</span>
            </TabsTrigger>
            <TabsTrigger value="export" disabled={!validationPassed} className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Data Ingestion</CardTitle>
                <CardDescription>
                  Upload your CSV or XLSX files for clients, workers, and tasks. Our AI will intelligently parse and validate your data.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUploadSection
                  fileUploadState={fileUploadState}
                  onFileUploadStateChange={setFileUploadState}
                  onDataUpdate={handleDataUpdate}
                />
              </CardContent>
            </Card>

            {hasData && (
              <DataGridSection
                dataState={dataState}
                onDataUpdate={handleDataUpdate}
              />
            )}
          </TabsContent>

          <TabsContent value="validate" className="space-y-6">
            <ValidationPanel
              dataState={dataState}
              onDataUpdate={handleDataUpdate}
            />
          </TabsContent>

          <TabsContent value="rules" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <RuleBuilder
                  dataState={dataState}
                  businessRules={businessRules}
                  onRuleUpdate={handleRuleUpdate}
                />
              </div>
              <div>
                <PrioritizationPanel
                  weights={prioritizationWeights}
                  onWeightsUpdate={setPrioritizationWeights}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ai" className="space-y-6">
            <AIAssistant
              dataState={dataState}
              businessRules={businessRules}
              onDataUpdate={handleDataUpdate}
              onRuleUpdate={handleRuleUpdate}
            />
          </TabsContent>

          <TabsContent value="export" className="space-y-6">
            <ExportSection
              dataState={dataState}
              businessRules={businessRules}
              prioritizationWeights={prioritizationWeights}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
