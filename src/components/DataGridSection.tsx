'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DataState } from '@/types/data';
import { Search, Edit3, Save, X } from 'lucide-react';
import { toast } from 'sonner';

interface DataGridSectionProps {
  dataState: DataState;
  onDataUpdate: (dataState: Partial<DataState>) => void;
}

export function DataGridSection({ dataState, onDataUpdate }: DataGridSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCell, setEditingCell] = useState<{ type: string; id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleEdit = (type: string, id: string, field: string, currentValue: unknown) => {
    setEditingCell({ type, id, field });
    setEditValue(typeof currentValue === 'object' ? JSON.stringify(currentValue) : String(currentValue || ''));
  };

  const handleSave = () => {
    if (!editingCell) return;

    const { type, id, field } = editingCell;
    let parsedValue: unknown = editValue;

    // Parse value based on field type
    if (field.includes('JSON') || field.includes('Slots') || field.includes('Phases') || field.includes('IDs')) {
      try {
        parsedValue = JSON.parse(editValue);
      } catch {
        // If JSON parsing fails, try comma-separated values
        if (editValue.includes(',')) {
          parsedValue = editValue.split(',').map(v => v.trim());
        }
      }
    } else if (field === 'PriorityLevel' || field === 'Duration' || field === 'MaxLoadPerPhase' || field === 'MaxConcurrent') {
      parsedValue = parseInt(editValue);
    }

    // Update the data
    const updateData = (items: unknown[]) => 
      (items as Array<Record<string, unknown>>).map(item => 
        item[`${type}ID`] === id 
          ? { ...item, [field]: parsedValue }
          : item
      );

    const updatedData = {
      ...dataState,
      [`${type}s`]: updateData(dataState[`${type}s` as keyof DataState] as unknown[])
    };

    onDataUpdate(updatedData);
    setEditingCell(null);
    toast.success('Cell updated successfully');
  };

  const handleCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderCell = (type: string, item: any, field: string, value: any) => {
    const isEditing = editingCell?.type === type && editingCell?.id === item[`${type}ID`] && editingCell?.field === field;
    
    if (isEditing) {
      return (
        <div className="flex items-center space-x-2">
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="h-8 text-xs"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
          />
          <Button size="sm" variant="outline" onClick={handleSave} className="h-8 w-8 p-0">
            <Save className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="outline" onClick={handleCancel} className="h-8 w-8 p-0">
            <X className="h-3 w-3" />
          </Button>
        </div>
      );
    }

    const displayValue = Array.isArray(value) 
      ? value.join(', ') 
      : typeof value === 'object' && value !== null
        ? JSON.stringify(value) 
        : String(value || '');
    const truncatedValue = displayValue.length > 50 ? displayValue.substring(0, 50) + '...' : displayValue;

    return (
      <div 
        className="cursor-pointer hover:bg-gray-50 p-1 rounded min-h-[20px] flex items-center group"
        onClick={() => handleEdit(type, item[`${type}ID`], field, value)}
      >
        <span className="text-xs">{truncatedValue}</span>
        <Edit3 className="h-3 w-3 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    );
  };

  const ClientsGrid = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search clients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-20">Priority</TableHead>
              <TableHead>Requested Tasks</TableHead>
              <TableHead>Group</TableHead>
              <TableHead>Attributes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dataState.clients
              .filter(client => 
                !searchQuery || 
                client.ClientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                client.ClientID.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((client, index) => (
                <TableRow key={`client-${client.ClientID || 'undefined'}-${index}`}>
                  <TableCell className="font-mono text-xs">{client.ClientID}</TableCell>
                  <TableCell>{renderCell('client', client, 'ClientName', client.ClientName)}</TableCell>
                  <TableCell>{renderCell('client', client, 'PriorityLevel', client.PriorityLevel)}</TableCell>
                  <TableCell>{renderCell('client', client, 'RequestedTaskIDs', client.RequestedTaskIDs)}</TableCell>
                  <TableCell>{renderCell('client', client, 'GroupTag', client.GroupTag)}</TableCell>
                  <TableCell>{renderCell('client', client, 'AttributesJSON', client.AttributesJSON)}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  const WorkersGrid = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search workers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Skills</TableHead>
              <TableHead>Available Slots</TableHead>
              <TableHead className="w-20">Max Load</TableHead>
              <TableHead>Group</TableHead>
              <TableHead>Level</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dataState.workers
              .filter(worker => 
                !searchQuery || 
                worker.WorkerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                worker.WorkerID.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((worker, index) => (
                <TableRow key={`worker-${worker.WorkerID || 'undefined'}-${index}`}>
                  <TableCell className="font-mono text-xs">{worker.WorkerID}</TableCell>
                  <TableCell>{renderCell('worker', worker, 'WorkerName', worker.WorkerName)}</TableCell>
                  <TableCell>{renderCell('worker', worker, 'Skills', worker.Skills)}</TableCell>
                  <TableCell>{renderCell('worker', worker, 'AvailableSlots', worker.AvailableSlots)}</TableCell>
                  <TableCell>{renderCell('worker', worker, 'MaxLoadPerPhase', worker.MaxLoadPerPhase)}</TableCell>
                  <TableCell>{renderCell('worker', worker, 'WorkerGroup', worker.WorkerGroup)}</TableCell>
                  <TableCell>{renderCell('worker', worker, 'QualificationLevel', worker.QualificationLevel)}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  const TasksGrid = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="w-20">Duration</TableHead>
              <TableHead>Required Skills</TableHead>
              <TableHead>Preferred Phases</TableHead>
              <TableHead className="w-20">Max Concurrent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dataState.tasks
              .filter(task => 
                !searchQuery || 
                task.TaskName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.TaskID.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((task, index) => (
                <TableRow key={`task-${task.TaskID || 'undefined'}-${index}`}>
                  <TableCell className="font-mono text-xs">{task.TaskID}</TableCell>
                  <TableCell>{renderCell('task', task, 'TaskName', task.TaskName)}</TableCell>
                  <TableCell>{renderCell('task', task, 'Category', task.Category)}</TableCell>
                  <TableCell>{renderCell('task', task, 'Duration', task.Duration)}</TableCell>
                  <TableCell>{renderCell('task', task, 'RequiredSkills', task.RequiredSkills)}</TableCell>
                  <TableCell>{renderCell('task', task, 'PreferredPhases', task.PreferredPhases)}</TableCell>
                  <TableCell>{renderCell('task', task, 'MaxConcurrent', task.MaxConcurrent)}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Grid - Inline Editing</CardTitle>
        <CardDescription>
          Click on any cell to edit its value. Changes are applied immediately with validation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="clients" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="clients">
              Clients ({dataState.clients.length})
            </TabsTrigger>
            <TabsTrigger value="workers">
              Workers ({dataState.workers.length})
            </TabsTrigger>
            <TabsTrigger value="tasks">
              Tasks ({dataState.tasks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clients">
            <ClientsGrid />
          </TabsContent>

          <TabsContent value="workers">
            <WorkersGrid />
          </TabsContent>

          <TabsContent value="tasks">
            <TasksGrid />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
