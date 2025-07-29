import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Client, Worker, Task, ParsedClient, ParsedWorker, ParsedTask, ValidationError } from '@/types/data';

// File parsing utilities
export const parseCSVFile = (file: File): Promise<unknown[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(results.errors);
        } else {
          resolve(results.data);
        }
      },
      error: (error) => reject(error),
    });
  });
};

export const parseXLSXFile = (file: File): Promise<unknown[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

export const parseFile = async (file: File): Promise<unknown[]> => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'csv':
      return parseCSVFile(file);
    case 'xlsx':
    case 'xls':
      return parseXLSXFile(file);
    default:
      throw new Error(`Unsupported file type: ${extension}`);
  }
};

// Data transformation utilities
export const parseClientData = (rawData: Client[]): ParsedClient[] => {
  return rawData.map(client => ({
    ...client,
    RequestedTaskIDs: client.RequestedTaskIDs ? client.RequestedTaskIDs.split(',').map(id => id.trim()) : [],
    AttributesJSON: (() => {
      try {
        return typeof client.AttributesJSON === 'string' 
          ? JSON.parse(client.AttributesJSON) 
          : client.AttributesJSON || {};
      } catch {
        return {};
      }
    })(),
  }));
};

export const parseWorkerData = (rawData: Worker[]): ParsedWorker[] => {
  return rawData.map(worker => ({
    ...worker,
    Skills: worker.Skills ? worker.Skills.split(',').map(skill => skill.trim()) : [],
    AvailableSlots: (() => {
      try {
        return typeof worker.AvailableSlots === 'string' 
          ? JSON.parse(worker.AvailableSlots) 
          : Array.isArray(worker.AvailableSlots) 
          ? worker.AvailableSlots 
          : [];
      } catch {
        return [];
      }
    })(),
  }));
};

export const parseTaskData = (rawData: Task[]): ParsedTask[] => {
  return rawData.map(task => ({
    ...task,
    RequiredSkills: task.RequiredSkills ? task.RequiredSkills.split(',').map(skill => skill.trim()) : [],
    PreferredPhases: (() => {
      try {
        if (typeof task.PreferredPhases === 'string') {
          // Handle range syntax like "1-3"
          if (task.PreferredPhases.includes('-')) {
            const [start, end] = task.PreferredPhases.split('-').map(n => parseInt(n.trim()));
            return Array.from({ length: end - start + 1 }, (_, i) => start + i);
          }
          // Handle JSON array syntax
          if (task.PreferredPhases.startsWith('[')) {
            return JSON.parse(task.PreferredPhases);
          }
          // Handle comma-separated values
          return task.PreferredPhases.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p));
        }
        return Array.isArray(task.PreferredPhases) ? task.PreferredPhases : [];
      } catch {
        return [];
      }
    })(),
  }));
};

// Validation utilities
export const validateClientData = (clients: ParsedClient[], tasks: ParsedTask[]): ValidationError[] => {
  const errors: ValidationError[] = [];
  const taskIds = new Set(tasks.map(t => t.TaskID));
  const clientIds = new Set<string>();

  clients.forEach((client, index) => {
    const safeClientId = client.ClientID || `client-${index}`;
    const uniqueKey = `${safeClientId}-${index}`;
    
    // Check for duplicate IDs
    if (clientIds.has(client.ClientID)) {
      errors.push({
        id: `client-duplicate-${uniqueKey}`,
        type: 'error',
        entity: 'client',
        entityId: client.ClientID || `client-${index}`,
        field: 'ClientID',
        message: `Duplicate Client ID: ${client.ClientID}`,
        suggestion: 'Ensure each client has a unique ID',
        autoFixAvailable: false,
      });
    }
    clientIds.add(client.ClientID);

    // Validate priority level
    if (client.PriorityLevel < 1 || client.PriorityLevel > 5) {
      errors.push({
        id: `client-priority-${uniqueKey}`,
        type: 'error',
        entity: 'client',
        entityId: client.ClientID || `client-${index}`,
        field: 'PriorityLevel',
        message: `Priority level must be between 1-5, got: ${client.PriorityLevel}`,
        suggestion: 'Set priority level to a value between 1 and 5',
        autoFixAvailable: true,
      });
    }

    // Validate requested task IDs
    client.RequestedTaskIDs.forEach((taskId, taskIndex) => {
      if (!taskIds.has(taskId)) {
        errors.push({
          id: `client-task-ref-${uniqueKey}-${taskIndex}`,
          type: 'error',
          entity: 'client',
          entityId: client.ClientID || `client-${index}`,
          field: 'RequestedTaskIDs',
          message: `Referenced task ID "${taskId}" does not exist`,
          suggestion: 'Remove invalid task ID or add the corresponding task',
          autoFixAvailable: true,
        });
      }
    });
  });

  return errors;
};

export const validateWorkerData = (workers: ParsedWorker[]): ValidationError[] => {
  const errors: ValidationError[] = [];
  const workerIds = new Set<string>();

  workers.forEach((worker, index) => {
    const safeWorkerId = worker.WorkerID || `worker-${index}`;
    const uniqueKey = `${safeWorkerId}-${index}`;
    
    // Check for duplicate IDs
    if (workerIds.has(worker.WorkerID)) {
      errors.push({
        id: `worker-duplicate-${uniqueKey}`,
        type: 'error',
        entity: 'worker',
        entityId: worker.WorkerID || `worker-${index}`,
        field: 'WorkerID',
        message: `Duplicate Worker ID: ${worker.WorkerID}`,
        suggestion: 'Ensure each worker has a unique ID',
        autoFixAvailable: false,
      });
    }
    workerIds.add(worker.WorkerID);

    // Validate available slots
    if (!Array.isArray(worker.AvailableSlots) || worker.AvailableSlots.length === 0) {
      errors.push({
        id: `worker-slots-${uniqueKey}`,
        type: 'error',
        entity: 'worker',
        entityId: worker.WorkerID || `worker-${index}`,
        field: 'AvailableSlots',
        message: 'AvailableSlots must be a non-empty array of phase numbers',
        suggestion: 'Add at least one available phase slot',
        autoFixAvailable: true,
      });
    }

    // Validate max load per phase
    if (worker.MaxLoadPerPhase < 1) {
      errors.push({
        id: `worker-load-${uniqueKey}`,
        type: 'error',
        entity: 'worker',
        entityId: worker.WorkerID || `worker-${index}`,
        field: 'MaxLoadPerPhase',
        message: 'MaxLoadPerPhase must be at least 1',
        suggestion: 'Set MaxLoadPerPhase to a positive integer',
        autoFixAvailable: true,
      });
    }

    // Check if available slots exceed max load
    if (worker.AvailableSlots.length < worker.MaxLoadPerPhase) {
      errors.push({
        id: `worker-overload-${uniqueKey}`,
        type: 'warning',
        entity: 'worker',
        entityId: worker.WorkerID || `worker-${index}`,
        field: 'MaxLoadPerPhase',
        message: 'MaxLoadPerPhase exceeds number of available slots',
        suggestion: 'Reduce MaxLoadPerPhase or add more available slots',
        autoFixAvailable: true,
      });
    }
  });

  return errors;
};

export const validateTaskData = (tasks: ParsedTask[], workers: ParsedWorker[]): ValidationError[] => {
  const errors: ValidationError[] = [];
  const taskIds = new Set<string>();
  const allWorkerSkills = new Set<string>();
  
  workers.forEach(worker => {
    worker.Skills.forEach(skill => allWorkerSkills.add(skill));
  });

  tasks.forEach((task, index) => {
    const safeTaskId = task.TaskID || `task-${index}`;
    const uniqueKey = `${safeTaskId}-${index}`;
    
    // Check for duplicate IDs
    if (taskIds.has(task.TaskID)) {
      errors.push({
        id: `task-duplicate-${uniqueKey}`,
        type: 'error',
        entity: 'task',
        entityId: task.TaskID || `task-${index}`,
        field: 'TaskID',
        message: `Duplicate Task ID: ${task.TaskID}`,
        suggestion: 'Ensure each task has a unique ID',
        autoFixAvailable: false,
      });
    }
    taskIds.add(task.TaskID);

    // Validate duration
    if (task.Duration < 1) {
      errors.push({
        id: `task-duration-${uniqueKey}`,
        type: 'error',
        entity: 'task',
        entityId: task.TaskID || `task-${index}`,
        field: 'Duration',
        message: 'Duration must be at least 1 phase',
        suggestion: 'Set duration to a positive integer',
        autoFixAvailable: true,
      });
    }

    // Validate max concurrent
    if (task.MaxConcurrent < 1) {
      errors.push({
        id: `task-concurrent-${uniqueKey}`,
        type: 'error',
        entity: 'task',
        entityId: task.TaskID || `task-${index}`,
        field: 'MaxConcurrent',
        message: 'MaxConcurrent must be at least 1',
        suggestion: 'Set MaxConcurrent to a positive integer',
        autoFixAvailable: true,
      });
    }

    // Validate skill coverage
    task.RequiredSkills.forEach((skill, skillIndex) => {
      if (!allWorkerSkills.has(skill)) {
        errors.push({
          id: `task-skill-${uniqueKey}-${skillIndex}`,
          type: 'error',
          entity: 'task',
          entityId: task.TaskID || `task-${index}`,
          field: 'RequiredSkills',
          message: `Required skill "${skill}" is not available in any worker`,
          suggestion: 'Add a worker with this skill or remove the skill requirement',
          autoFixAvailable: false,
        });
      }
    });
  });

  return errors;
};

// Cross-validation utilities
export const validateCrossReferences = (
  clients: ParsedClient[], 
  workers: ParsedWorker[], 
  tasks: ParsedTask[]
): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  // Phase-slot saturation check
  const phaseSlotMap = new Map<number, number>();
  workers.forEach(worker => {
    worker.AvailableSlots.forEach(phase => {
      phaseSlotMap.set(phase, (phaseSlotMap.get(phase) || 0) + worker.MaxLoadPerPhase);
    });
  });

  const phaseDemandMap = new Map<number, number>();
  tasks.forEach(task => {
    task.PreferredPhases.forEach(phase => {
      phaseDemandMap.set(phase, (phaseDemandMap.get(phase) || 0) + task.Duration);
    });
  });

  // Check for phase saturation
  for (const [phase, demand] of phaseDemandMap) {
    const supply = phaseSlotMap.get(phase) || 0;
    if (demand > supply) {
      errors.push({
        id: `phase-saturation-${phase}`,
        type: 'warning',
        entity: 'task',
        entityId: `phase-${phase}`,
        field: 'PreferredPhases',
        message: `Phase ${phase} is oversaturated: demand ${demand} > supply ${supply}`,
        suggestion: 'Add more workers to this phase or adjust task preferences',
        autoFixAvailable: false,
      });
    }
  }

  return errors;
};

// Export utility
export const exportToCSV = (data: unknown[], filename: string) => {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToJSON = (data: unknown, filename: string) => {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
