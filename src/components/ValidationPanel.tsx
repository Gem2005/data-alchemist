'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataState, ValidationError } from '@/types/data';
import { AlertCircle, CheckCircle, AlertTriangle, Zap, RefreshCw } from 'lucide-react';
import { validateClientData, validateWorkerData, validateTaskData, validateCrossReferences } from '@/lib/dataUtils';
import { toast } from 'sonner';

interface ValidationPanelProps {
  dataState: DataState;
  onDataUpdate: (dataState: Partial<DataState>) => void;
}

export function ValidationPanel({ dataState, onDataUpdate }: ValidationPanelProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'error' | 'warning' | 'info'>('all');

  const runValidation = async () => {
    setIsValidating(true);
    
    try {
      const clientErrors = validateClientData(dataState.clients, dataState.tasks);
      const workerErrors = validateWorkerData(dataState.workers);
      const taskErrors = validateTaskData(dataState.tasks, dataState.workers);
      const crossRefErrors = validateCrossReferences(dataState.clients, dataState.workers, dataState.tasks);

      const allErrors = [...clientErrors, ...workerErrors, ...taskErrors, ...crossRefErrors];

      onDataUpdate({ errors: allErrors });

      const errorCount = allErrors.filter(e => e.type === 'error').length;
      const warningCount = allErrors.filter(e => e.type === 'warning').length;
      const infoCount = allErrors.filter(e => e.type === 'info').length;

      toast.success(`Validation complete: ${errorCount} errors, ${warningCount} warnings, ${infoCount} info`);
    } catch (error) {
      toast.error('Validation failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsValidating(false);
    }
  };

  const autoFixError = (error: ValidationError) => {
    if (!error.autoFixAvailable) return;

    // Auto-fix logic for specific error types
    if (error.field === 'PriorityLevel' && error.entity === 'client') {
      // Fix priority level to be within valid range
      const updatedClients = dataState.clients.map(client => 
        client.ClientID === error.entityId 
          ? { ...client, PriorityLevel: Math.max(1, Math.min(5, client.PriorityLevel)) }
          : client
      );
      onDataUpdate({ clients: updatedClients });
      toast.success('Priority level auto-fixed');
    }
    
    if (error.field === 'Duration' && error.entity === 'task') {
      // Fix duration to be at least 1
      const updatedTasks = dataState.tasks.map(task => 
        task.TaskID === error.entityId 
          ? { ...task, Duration: Math.max(1, task.Duration) }
          : task
      );
      onDataUpdate({ tasks: updatedTasks });
      toast.success('Task duration auto-fixed');
    }

    if (error.field === 'MaxLoadPerPhase' && error.entity === 'worker') {
      // Fix max load to be at least 1
      const updatedWorkers = dataState.workers.map(worker => 
        worker.WorkerID === error.entityId 
          ? { ...worker, MaxLoadPerPhase: Math.max(1, worker.MaxLoadPerPhase) }
          : worker
      );
      onDataUpdate({ workers: updatedWorkers });
      toast.success('Worker max load auto-fixed');
    }

    // Remove the fixed error from the list
    const updatedErrors = dataState.errors.filter(e => e.id !== error.id);
    onDataUpdate({ errors: updatedErrors });
  };

  const filteredErrors = dataState.errors.filter(error => 
    selectedFilter === 'all' || error.type === selectedFilter
  );

  const errorCounts = {
    error: dataState.errors.filter(e => e.type === 'error').length,
    warning: dataState.errors.filter(e => e.type === 'warning').length,
    info: dataState.errors.filter(e => e.type === 'info').length,
    total: dataState.errors.length,
  };

  const getErrorIcon = (type: ValidationError['type']) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getErrorBadgeVariant = (type: ValidationError['type']): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'secondary';
      case 'info':
        return 'outline';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <AlertCircle className="h-8 w-8 text-red-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-red-600">{errorCounts.error}</div>
              <p className="text-xs text-muted-foreground">Errors</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <AlertTriangle className="h-8 w-8 text-yellow-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-yellow-600">{errorCounts.warning}</div>
              <p className="text-xs text-muted-foreground">Warnings</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <CheckCircle className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-blue-600">{errorCounts.info}</div>
              <p className="text-xs text-muted-foreground">Info</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <RefreshCw className="h-8 w-8 text-gray-500 mr-3" />
            <div>
              <div className="text-2xl font-bold">{errorCounts.total}</div>
              <p className="text-xs text-muted-foreground">Total Issues</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Validation Panel */}
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Validation Results</CardTitle>
              <CardDescription>
                Comprehensive data validation with AI-powered error detection and auto-fix suggestions
              </CardDescription>
            </div>
            <Button 
              onClick={runValidation} 
              disabled={isValidating}
              className="shrink-0"
            >
              {isValidating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Validating...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Re-validate
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Filter Buttons */}
          <div className="flex space-x-2 mb-4">
            {(['all', 'error', 'warning', 'info'] as const).map(filter => (
              <Button
                key={filter}
                variant={selectedFilter === filter ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedFilter(filter)}
              >
                {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                {filter !== 'all' && (
                  <Badge variant="secondary" className="ml-2">
                    {errorCounts[filter]}
                  </Badge>
                )}
              </Button>
            ))}
          </div>

          {/* Error List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredErrors.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedFilter === 'all' ? 'No validation issues found!' : `No ${selectedFilter}s found`}
                </h3>
                <p className="text-gray-600 mt-1">
                  {selectedFilter === 'all' 
                    ? 'Your data looks clean and ready for processing.' 
                    : `Try selecting a different filter to see other types of issues.`
                  }
                </p>
              </div>
            ) : (
              filteredErrors.map(error => (
                <div key={error.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getErrorIcon(error.type)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge variant={getErrorBadgeVariant(error.type)}>
                            {error.type.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">
                            {error.entity.toUpperCase()}
                          </Badge>
                          <span className="text-sm font-medium text-gray-600">
                            {error.entityId}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 font-medium">
                          {error.message}
                        </p>
                        {error.suggestion && (
                          <p className="text-xs text-gray-600 mt-1">
                            💡 {error.suggestion}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {error.autoFixAvailable && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => autoFixError(error)}
                        className="ml-4 shrink-0"
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        Auto-fix
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
