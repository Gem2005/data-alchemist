'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataState, BusinessRule, PrioritizationWeights, ExportConfig } from '@/types/data';
import { Download, FileText, Settings, CheckCircle, AlertCircle } from 'lucide-react';
import { exportToCSV, exportToJSON } from '@/lib/dataUtils';
import { toast } from 'sonner';

interface ExportSectionProps {
  dataState: DataState;
  businessRules: BusinessRule[];
  prioritizationWeights: PrioritizationWeights;
}

export function ExportSection({ 
  dataState, 
  businessRules, 
  prioritizationWeights 
}: ExportSectionProps) {
  const [isExporting, setIsExporting] = useState(false);

  const errorCount = dataState.errors.filter(e => e.type === 'error').length;
  const warningCount = dataState.errors.filter(e => e.type === 'warning').length;
  const validationPassed = errorCount === 0;

  const generateExportConfig = (): ExportConfig => {
    return {
      clients: dataState.clients,
      workers: dataState.workers,
      tasks: dataState.tasks,
      rules: businessRules,
      prioritization: prioritizationWeights,
      metadata: {
        exportDate: new Date().toISOString(),
        version: '1.0.0',
        validationPassed,
        totalErrors: errorCount,
        totalWarnings: warningCount,
      }
    };
  };

  const exportData = async (format: 'csv' | 'json' = 'csv') => {
    if (!validationPassed) {
      toast.error('Cannot export data with validation errors. Please fix all errors first.');
      return;
    }

    setIsExporting(true);

    try {
      const timestamp = new Date().toISOString().split('T')[0];

      if (format === 'csv') {
        // Export separate CSV files for each entity
        if (dataState.clients.length > 0) {
          exportToCSV(dataState.clients, `clients_${timestamp}.csv`);
        }
        if (dataState.workers.length > 0) {
          exportToCSV(dataState.workers, `workers_${timestamp}.csv`);
        }
        if (dataState.tasks.length > 0) {
          exportToCSV(dataState.tasks, `tasks_${timestamp}.csv`);
        }
        
        toast.success('CSV files exported successfully');
      }

      // Always export the rules configuration as JSON
      const exportConfig = generateExportConfig();
      exportToJSON(exportConfig, `data_alchemist_config_${timestamp}.json`);
      
      toast.success('Export completed successfully!');
    } catch (error) {
      toast.error('Export failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsExporting(false);
    }
  };

  const exportRulesOnly = () => {
    const rulesConfig = {
      rules: businessRules,
      prioritization: prioritizationWeights,
      metadata: {
        exportDate: new Date().toISOString(),
        version: '1.0.0',
        rulesCount: businessRules.length,
      }
    };

    const timestamp = new Date().toISOString().split('T')[0];
    exportToJSON(rulesConfig, `rules_config_${timestamp}.json`);
    toast.success('Rules configuration exported');
  };

  const totalDataEntries = dataState.clients.length + dataState.workers.length + dataState.tasks.length;

  return (
    <div className="space-y-6">
      {/* Export Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <FileText className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <div className="text-2xl font-bold">{totalDataEntries}</div>
              <p className="text-xs text-muted-foreground">Total Records</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <Settings className="h-8 w-8 text-purple-500 mr-3" />
            <div>
              <div className="text-2xl font-bold">{businessRules.length}</div>
              <p className="text-xs text-muted-foreground">Business Rules</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            {validationPassed ? (
              <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
            ) : (
              <AlertCircle className="h-8 w-8 text-red-500 mr-3" />
            )}
            <div>
              <div className="text-2xl font-bold">{errorCount}</div>
              <p className="text-xs text-muted-foreground">Validation Errors</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <Download className="h-8 w-8 text-gray-500 mr-3" />
            <div>
              <div className="text-2xl font-bold">
                {validationPassed ? 'Ready' : 'Blocked'}
              </div>
              <p className="text-xs text-muted-foreground">Export Status</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Export Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Download className="h-5 w-5 mr-2" />
            Export Configuration
          </CardTitle>
          <CardDescription>
            Download your cleaned data and configuration files for the next stage of processing
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Validation Status */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Validation Status</h3>
              <Badge variant={validationPassed ? "default" : "destructive"}>
                {validationPassed ? 'Passed' : 'Failed'}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Clients</div>
                <div className="font-semibold">{dataState.clients.length}</div>
              </div>
              <div>
                <div className="text-gray-600">Workers</div>
                <div className="font-semibold">{dataState.workers.length}</div>
              </div>
              <div>
                <div className="text-gray-600">Tasks</div>
                <div className="font-semibold">{dataState.tasks.length}</div>
              </div>
              <div>
                <div className="text-gray-600">Rules</div>
                <div className="font-semibold">{businessRules.length}</div>
              </div>
            </div>
            
            {!validationPassed && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                <div className="flex items-center text-red-800">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <span className="font-medium">
                    {errorCount} validation error{errorCount !== 1 ? 's' : ''} must be fixed before export
                  </span>
                </div>
                <p className="text-red-700 text-sm mt-1">
                  Go to the Validation tab to review and fix the issues.
                </p>
              </div>
            )}
            
            {warningCount > 0 && validationPassed && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <div className="flex items-center text-yellow-800">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <span className="font-medium">
                    {warningCount} warning{warningCount !== 1 ? 's' : ''} detected
                  </span>
                </div>
                <p className="text-yellow-700 text-sm mt-1">
                  These won&apos;t prevent export but may affect allocation quality.
                </p>
              </div>
            )}
          </div>

          {/* Export Options */}
          <div className="space-y-4">
            <h3 className="font-semibold">Export Options</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium">Complete Package</h4>
                      <p className="text-sm text-gray-600">
                        Clean CSV files + rules configuration
                      </p>
                    </div>
                    <FileText className="h-6 w-6 text-blue-500" />
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-4">
                    Includes:
                    <ul className="list-disc list-inside ml-2 mt-1">
                      <li>clients.csv ({dataState.clients.length} records)</li>
                      <li>workers.csv ({dataState.workers.length} records)</li>
                      <li>tasks.csv ({dataState.tasks.length} records)</li>
                      <li>configuration.json (rules + priorities)</li>
                    </ul>
                  </div>
                  
                  <Button 
                    onClick={() => exportData('csv')}
                    disabled={!validationPassed || isExporting}
                    className="w-full"
                  >
                    {isExporting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Export Complete Package
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium">Rules Configuration Only</h4>
                      <p className="text-sm text-gray-600">
                        Just the business rules and priorities
                      </p>
                    </div>
                    <Settings className="h-6 w-6 text-purple-500" />
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-4">
                    Includes:
                    <ul className="list-disc list-inside ml-2 mt-1">
                      <li>{businessRules.length} business rules</li>
                      <li>Prioritization weights</li>
                      <li>Export metadata</li>
                    </ul>
                  </div>
                  
                  <Button 
                    onClick={exportRulesOnly}
                    variant="outline"
                    disabled={businessRules.length === 0}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Rules Only
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Next Steps */}
          {validationPassed && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="font-medium text-green-900 mb-1">Ready for Next Stage!</p>
                  <p className="text-green-800 text-sm">
                    Your data has been validated and is ready for export. The generated files can be used 
                    with downstream resource allocation systems or further analysis tools.
                  </p>
                  <p className="text-green-700 text-sm mt-2">
                    <strong>Tip:</strong> Keep the configuration JSON file - it contains all your business 
                    rules and prioritization settings for future reference.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
