'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileUploadState, DataState, Client, Worker, Task } from '@/types/data';
import { parseFile, parseClientData, parseWorkerData, parseTaskData, validateClientData, validateWorkerData, validateTaskData, validateCrossReferences } from '@/lib/dataUtils';
import { Upload, File, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface FileUploadSectionProps {
  fileUploadState: FileUploadState;
  onFileUploadStateChange: (state: FileUploadState) => void;
  onDataUpdate: (dataState: Partial<DataState>) => void;
}

export function FileUploadSection({ 
  fileUploadState, 
  onFileUploadStateChange, 
  onDataUpdate 
}: FileUploadSectionProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (type: keyof FileUploadState, file: File | null) => {
    const newState = { ...fileUploadState, [type]: file };
    onFileUploadStateChange(newState);
  };

  const processFiles = async () => {
    if (!fileUploadState.clients && !fileUploadState.workers && !fileUploadState.tasks) {
      toast.error('Please select at least one file to process');
      return;
    }

    setIsProcessing(true);
    onDataUpdate({ isLoading: true, errors: [] });

    try {
      let clientsData: ReturnType<typeof parseClientData> = [];
      let workersData: ReturnType<typeof parseWorkerData> = [];
      let tasksData: ReturnType<typeof parseTaskData> = [];

      // Process clients file
      if (fileUploadState.clients) {
        const rawClientsData = await parseFile(fileUploadState.clients);
        clientsData = parseClientData(rawClientsData as Client[]);
        toast.success(`Processed ${clientsData.length} clients`);
      }

      // Process workers file
      if (fileUploadState.workers) {
        const rawWorkersData = await parseFile(fileUploadState.workers);
        workersData = parseWorkerData(rawWorkersData as Worker[]);
        toast.success(`Processed ${workersData.length} workers`);
      }

      // Process tasks file
      if (fileUploadState.tasks) {
        const rawTasksData = await parseFile(fileUploadState.tasks);
        tasksData = parseTaskData(rawTasksData as Task[]);
        toast.success(`Processed ${tasksData.length} tasks`);
      }

      // Run validations
      const clientErrors = validateClientData(clientsData, tasksData);
      const workerErrors = validateWorkerData(workersData);
      const taskErrors = validateTaskData(tasksData, workersData);
      const crossRefErrors = validateCrossReferences(clientsData, workersData, tasksData);

      const allErrors = [...clientErrors, ...workerErrors, ...taskErrors, ...crossRefErrors];

      onDataUpdate({
        clients: clientsData,
        workers: workersData,
        tasks: tasksData,
        errors: allErrors,
        isLoading: false,
      });

      const errorCount = allErrors.filter(e => e.type === 'error').length;
      const warningCount = allErrors.filter(e => e.type === 'warning').length;

      if (errorCount > 0) {
        toast.error(`Data processed with ${errorCount} errors and ${warningCount} warnings`);
      } else if (warningCount > 0) {
        toast.warning(`Data processed with ${warningCount} warnings`);
      } else {
        toast.success('All data processed successfully!');
      }

    } catch (error) {
      toast.error(`Failed to process files: ${error instanceof Error ? error.message : 'Unknown error'}`);
      onDataUpdate({ isLoading: false, errors: [] });
    } finally {
      setIsProcessing(false);
    }
  };

  const FileDropZone = ({ 
    type, 
    title, 
    description 
  }: { 
    type: keyof FileUploadState; 
    title: string; 
    description: string; 
  }) => {
    const file = fileUploadState[type];
    
    return (
      <Card className="relative">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center">
            {file ? (
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
            ) : (
              <File className="h-4 w-4 text-gray-400 mr-2" />
            )}
            {title}
          </CardTitle>
          <CardDescription className="text-xs">{description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <Input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => handleFileChange(type, e.target.files?.[0] || null)}
              className="text-sm"
            />
            {file && (
              <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                <strong>Selected:</strong> {file.name}<br />
                <strong>Size:</strong> {(file.size / 1024).toFixed(1)} KB<br />
                <strong>Type:</strong> {file.type || 'Unknown'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FileDropZone
          type="clients"
          title="Clients Data"
          description="Upload CSV/XLSX with client information"
        />
        <FileDropZone
          type="workers"
          title="Workers Data"
          description="Upload CSV/XLSX with worker details"
        />
        <FileDropZone
          type="tasks"
          title="Tasks Data"
          description="Upload CSV/XLSX with task definitions"
        />
      </div>

      <div className="flex justify-center">
        <Button
          onClick={processFiles}
          disabled={isProcessing || (!fileUploadState.clients && !fileUploadState.workers && !fileUploadState.tasks)}
          className="px-8 py-2"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Processing...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Process Files
            </>
          )}
        </Button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-blue-900 mb-1">AI-Powered Data Processing</p>
            <p className="text-blue-700">
              Our intelligent parser automatically maps columns, handles format variations, and provides
              detailed validation feedback. Upload your files and let the AI do the heavy lifting!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
