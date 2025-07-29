import { DataState, ValidationError } from '@/types/data';

interface AIFixSuggestion {
  errorId: string;
  suggestedFix: string;
  explanation: string;
  confidence: number; // 0-1 scale
  autoApplicable: boolean;
}

interface AIFixRequest {
  type: 'validation-fix';
  errors: ValidationError[];
  dataState: DataState;
}

interface AIFixResponse {
  suggestions: AIFixSuggestion[];
  response: string;
}

/**
 * AI-powered validation error fixing service
 * Uses Azure OpenAI to provide intelligent auto-fix suggestions
 */
export class AIValidationService {
  private baseUrl = '/api/ai';

  /**
   * Check if Azure OpenAI is configured
   */
  public isReady(): boolean {
    return process.env.NEXT_PUBLIC_AZURE_OPENAI_CONFIGURED === 'true';
  }

  /**
   * Get AI-powered fix suggestions for validation errors
   */
  public async getFixSuggestions(
    errors: ValidationError[],
    dataState: DataState
  ): Promise<AIFixResponse> {
    if (!this.isReady()) {
      return this.getFallbackSuggestions(errors, dataState);
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'validation-fix',
          errors,
          dataState
        } as AIFixRequest),
      });

      if (!response.ok) {
        console.warn('AI fix suggestions API failed, using fallback');
        return this.getFallbackSuggestions(errors, dataState);
      }

      const data = await response.json();
      
      // Check if the response has the success structure
      if (data.success && data.data) {
        return {
          suggestions: data.data.suggestions || [],
          response: data.data.response || 'Generated fix suggestions using AI'
        };
      }
      
      // Fallback if structure is different
      if (data && typeof data === 'object' && 'suggestions' in data) {
        return {
          suggestions: data.suggestions || [],
          response: data.response || 'Generated fix suggestions using AI'
        };
      }

      // If the data structure is unexpected, return fallback
      return this.getFallbackSuggestions(errors, dataState);
    } catch (error) {
      console.error('AI fix suggestions failed:', error);
      return this.getFallbackSuggestions(errors, dataState);
    }
  }

  /**
   * Fallback fix suggestions using rule-based logic
   */
  private getFallbackSuggestions(
    errors: ValidationError[],
    dataState: DataState // eslint-disable-line @typescript-eslint/no-unused-vars
  ): AIFixResponse {
    const suggestions: AIFixSuggestion[] = [];

    errors.forEach(error => {
      let suggestedFix = '';
      let explanation = '';
      let confidence = 0.8;
      let autoApplicable = false;

      switch (error.field) {
        case 'PriorityLevel':
          if (error.entity === 'client') {
            suggestedFix = 'Set priority level to valid range (1-5)';
            explanation = 'Priority levels must be between 1 (lowest) and 5 (highest)';
            autoApplicable = true;
          }
          break;

        case 'Duration':
          if (error.entity === 'task') {
            suggestedFix = 'Set minimum duration to 1 phase';
            explanation = 'Task duration must be at least 1 phase to be executable';
            autoApplicable = true;
          }
          break;

        case 'MaxLoadPerPhase':
          if (error.entity === 'worker') {
            suggestedFix = 'Set minimum load capacity to 1';
            explanation = 'Workers must be able to handle at least 1 task per phase';
            autoApplicable = true;
          }
          break;

        case 'Skills':
          if (error.entity === 'worker') {
            suggestedFix = 'Add relevant skills based on task requirements';
            explanation = 'Analyze task requirements to suggest appropriate skills';
            confidence = 0.6;
            autoApplicable = false;
          }
          break;

        case 'RequiredSkills':
          if (error.entity === 'task') {
            suggestedFix = 'Review and validate required skills';
            explanation = 'Ensure required skills match available worker capabilities';
            confidence = 0.5;
            autoApplicable = false;
          }
          break;

        default:
          suggestedFix = 'Manual review required';
          explanation = 'This error requires manual inspection and correction';
          confidence = 0.3;
          autoApplicable = false;
      }

      if (suggestedFix) {
        suggestions.push({
          errorId: error.id,
          suggestedFix,
          explanation,
          confidence,
          autoApplicable
        });
      }
    });

    return {
      suggestions,
      response: `Generated ${suggestions.length} fix suggestions using rule-based analysis`
    };
  }

  /**
   * Apply a suggested fix to the data
   */
  public applyFix(
    suggestion: AIFixSuggestion,
    error: ValidationError,
    dataState: DataState
  ): Partial<DataState> {
    const updates: Partial<DataState> = {};

    switch (error.field) {
      case 'PriorityLevel':
        if (error.entity === 'client') {
          const updatedClients = dataState.clients.map(client => 
            client.ClientID === error.entityId 
              ? { ...client, PriorityLevel: this.getValidPriorityLevel(client.PriorityLevel) }
              : client
          );
          updates.clients = updatedClients;
        }
        break;

      case 'Duration':
        if (error.entity === 'task') {
          const updatedTasks = dataState.tasks.map(task => 
            task.TaskID === error.entityId 
              ? { ...task, Duration: Math.max(1, task.Duration || 1) }
              : task
          );
          updates.tasks = updatedTasks;
        }
        break;

      case 'MaxLoadPerPhase':
        if (error.entity === 'worker') {
          const updatedWorkers = dataState.workers.map(worker => 
            worker.WorkerID === error.entityId 
              ? { ...worker, MaxLoadPerPhase: Math.max(1, worker.MaxLoadPerPhase || 1) }
              : worker
          );
          updates.workers = updatedWorkers;
        }
        break;

      case 'Skills':
        if (error.entity === 'worker') {
          const updatedWorkers = dataState.workers.map(worker => 
            worker.WorkerID === error.entityId 
              ? { ...worker, Skills: this.getDefaultSkills(worker.Skills) }
              : worker
          );
          updates.workers = updatedWorkers;
        }
        break;

      case 'RequiredSkills':
        if (error.entity === 'task') {
          const updatedTasks = dataState.tasks.map(task => 
            task.TaskID === error.entityId 
              ? { ...task, RequiredSkills: this.getDefaultRequiredSkills(task.RequiredSkills, dataState) }
              : task
          );
          updates.tasks = updatedTasks;
        }
        break;
    }

    // Remove the fixed error from the list
    if (Object.keys(updates).length > 0) {
      updates.errors = dataState.errors.filter(e => e.id !== error.id);
    }

    return updates;
  }

  /**
   * Get a valid priority level (1-5)
   */
  private getValidPriorityLevel(current: number): number {
    if (current < 1) return 3; // Default to medium priority
    if (current > 5) return 5; // Cap at maximum
    return Math.round(current); // Ensure integer
  }

  /**
   * Get default skills for a worker
   */
  private getDefaultSkills(currentSkills: string[]): string[] {
    if (!currentSkills || currentSkills.length === 0) {
      return ['General']; // Default skill
    }
    return currentSkills.filter(skill => skill && skill.trim() !== '');
  }

  /**
   * Get default required skills for a task based on available workers
   */
  private getDefaultRequiredSkills(currentSkills: string[], dataState: DataState): string[] {
    if (!currentSkills || currentSkills.length === 0) {
      // Find the most common skills from workers
      const allSkills = dataState.workers.flatMap(worker => worker.Skills || []);
      const skillCounts: Record<string, number> = {};
      
      allSkills.forEach(skill => {
        if (skill && skill.trim() !== '') {
          skillCounts[skill] = (skillCounts[skill] || 0) + 1;
        }
      });

      const mostCommonSkill = Object.keys(skillCounts).reduce((a, b) => 
        skillCounts[a] > skillCounts[b] ? a : b, 'General'
      );

      return [mostCommonSkill];
    }
    return currentSkills.filter(skill => skill && skill.trim() !== '');
  }
}

// Export singleton instance
export const aiValidationService = new AIValidationService();
