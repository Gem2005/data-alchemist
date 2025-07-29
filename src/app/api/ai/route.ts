/**
 * Azure OpenAI API Route for Data Alchemist
 * 
 * This server-side API provides secure access to Azure OpenAI services.
 * Following Azure best practices and official documentation:
 * - API keys are kept server-side only
 * - Uses official Azure OpenAI SDK
 * - Implements proper error handling and retry logic
 * - Structured for different AI request types
 */

import { NextRequest, NextResponse } from 'next/server';
import { AzureOpenAI } from 'openai';

// Azure OpenAI configuration from environment variables
const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const apiKey = process.env.AZURE_OPENAI_API_KEY;
const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4o';
const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-04-01-preview';

// Initialize Azure OpenAI client following official documentation
let azureOpenAIClient: AzureOpenAI | null = null;

if (endpoint && apiKey) {
  const options = { endpoint, apiKey, deployment: deploymentName, apiVersion };
  azureOpenAIClient = new AzureOpenAI(options);
  console.log('Azure OpenAI client initialized successfully');
} else {
  console.warn('Azure OpenAI not configured - missing endpoint or API key');
}

interface AIRequest {
  type: 'query' | 'rule' | 'recommendations' | 'suggestions' | 'validation-fix';
  query?: string;
  description?: string;
  dataState?: unknown;
  errors?: Array<{
    id: string;
    type: 'error' | 'warning' | 'info';
    entity: string;
    entityId: string;
    field: string;
    message: string;
    suggestion?: string;
  }>;
}

/**
 * Make API call to Azure OpenAI using the official SDK
 */
async function callAzureOpenAI(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  maxTokens: number = 1000
): Promise<string> {
  if (!azureOpenAIClient) {
    throw new Error('Azure OpenAI client not initialized');
  }

  try {
    const response = await azureOpenAIClient.chat.completions.create({
      messages,
      model: deploymentName,
      max_tokens: maxTokens,
      temperature: 0.7,
      top_p: 1,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content received from Azure OpenAI');
    }

    return content;
  } catch (error) {
    console.error('Azure OpenAI API call failed:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: AIRequest = await request.json();
    
    if (!azureOpenAIClient) {
      return NextResponse.json({
        success: false,
        error: 'Azure OpenAI not configured',
        fallback: true
      });
    }

    let result;
    
    switch (body.type) {
      case 'query':
        result = await processQuery(body);
        break;
      case 'rule':
        result = await generateRule(body);
        break;
      case 'recommendations':
        result = await generateRecommendations(body);
        break;
      case 'suggestions':
        result = await generateSuggestions(body);
        break;
      case 'validation-fix':
        result = await processValidationFix(body);
        break;
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid request type',
          fallback: true
        });
    }

    return NextResponse.json({
      success: true,
      data: result,
      fallback: false
    });

  } catch (error) {
    console.error('AI API request failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      fallback: true
    });
  }
}

/**
 * Process natural language queries about data
 */
async function processQuery(request: AIRequest): Promise<{ response: string; results: unknown[] }> {
  const { query, dataState } = request;
  
  if (!query) {
    return {
      response: 'No query provided.',
      results: []
    };
  }

  // Perform the actual data filtering based on the query
  let results: unknown[] = [];
  const queryLower = query.toLowerCase();
  const data = dataState as { clients?: unknown[]; workers?: unknown[]; tasks?: unknown[] };

  // Implement the filtering logic based on common query patterns
  if (queryLower.includes('duration') && queryLower.includes('more than')) {
    const durationMatch = query.match(/more than (\d+)/);
    if (durationMatch && data?.tasks) {
      const threshold = parseInt(durationMatch[1]);
      results = data.tasks.filter((task: unknown) => {
        const t = task as { Duration?: number };
        return t.Duration && t.Duration > threshold;
      });
    }
  } else if (queryLower.includes('skill') || queryLower.includes('javascript') || queryLower.includes('react') || queryLower.includes('python')) {
    if (data?.workers) {
      const skillKeywords = ['javascript', 'react', 'python', 'java', 'ml', 'data', 'ui/ux', 'devops', 'testing', 'coding', 'analysis', 'design'];
      const relevantSkills = skillKeywords.filter(skill => queryLower.includes(skill));
      
      if (relevantSkills.length > 0) {
        results = data.workers.filter((worker: unknown) => {
          const w = worker as { Skills?: string[] };
          return w.Skills?.some((skill: string) => 
            relevantSkills.some(keyword => skill.toLowerCase().includes(keyword))
          );
        });
      } else {
        // General skill-related query
        results = data.workers.filter((worker: unknown) => {
          const w = worker as { Skills?: string[] };
          return w.Skills && w.Skills.length > 0;
        });
      }
    }
  } else if (queryLower.includes('priority') && (queryLower.includes('high') || queryLower.includes('level'))) {
    if (data?.clients) {
      if (queryLower.includes('high')) {
        results = data.clients.filter((client: unknown) => {
          const c = client as { PriorityLevel?: number };
          return c.PriorityLevel && c.PriorityLevel >= 4;
        });
      } else {
        const levelMatch = query.match(/level (\d+)/);
        if (levelMatch) {
          const level = parseInt(levelMatch[1]);
          results = data.clients.filter((client: unknown) => {
            const c = client as { PriorityLevel?: number };
            return c.PriorityLevel === level;
          });
        }
      }
    }
  } else if (queryLower.includes('phase') && queryLower.includes('prefer')) {
    const phaseMatch = query.match(/phase (\d+)/);
    if (phaseMatch && data?.tasks) {
      const phase = parseInt(phaseMatch[1]);
      results = data.tasks.filter((task: unknown) => {
        const t = task as { PreferredPhases?: number[] };
        return t.PreferredPhases && t.PreferredPhases.includes(phase);
      });
    }
  } else if (queryLower.includes('available') && queryLower.includes('phase')) {
    const phaseMatches = query.match(/phases? (\d+)(?: and (\d+))?/);
    if (phaseMatches && data?.workers) {
      const phases = [parseInt(phaseMatches[1])];
      if (phaseMatches[2]) phases.push(parseInt(phaseMatches[2]));
      
      results = data.workers.filter((worker: unknown) => {
        const w = worker as { AvailableSlots?: Record<string, number> };
        if (!w.AvailableSlots) return false;
        return phases.every(phase => 
          w.AvailableSlots![`phase${phase}`] && w.AvailableSlots![`phase${phase}`] > 0
        );
      });
    }
  } else {
    // Default: return mixed results for general queries
    results = [
      ...(data?.clients?.slice(0, 3) || []),
      ...(data?.workers?.slice(0, 3) || []),
      ...(data?.tasks?.slice(0, 3) || [])
    ];
  }

  // Generate appropriate response message based on results
  let response = '';
  if (results.length === 0) {
    response = 'No items found matching your query.';
  } else {
    const firstResult = results[0] as Record<string, unknown>;
    if (firstResult?.ClientID) {
      if (queryLower.includes('priority') && queryLower.includes('high')) {
        response = `Found ${results.length} high-priority clients (priority level 4-5).`;
      } else {
        response = `Found ${results.length} client${results.length > 1 ? 's' : ''} matching your query.`;
      }
    } else if (firstResult?.WorkerID) {
      if (queryLower.includes('skill')) {
        const skillKeywords = ['javascript', 'react', 'python', 'java', 'ml', 'data', 'ui/ux', 'devops', 'testing', 'coding', 'analysis', 'design'];
        const foundSkill = skillKeywords.find(skill => queryLower.includes(skill));
        if (foundSkill) {
          response = `Found ${results.length} workers with ${foundSkill} skills.`;
        } else {
          response = `Found ${results.length} workers matching your skill requirements.`;
        }
      } else if (queryLower.includes('available') && queryLower.includes('phase')) {
        response = `Found ${results.length} workers available in the specified phases.`;
      } else {
        response = `Found ${results.length} worker${results.length > 1 ? 's' : ''} matching your query.`;
      }
    } else if (firstResult?.TaskID) {
      if (queryLower.includes('duration') && queryLower.includes('more than')) {
        const durationMatch = query.match(/more than (\d+)/);
        const threshold = durationMatch ? durationMatch[1] : 'specified';
        response = `Found ${results.length} tasks with duration more than ${threshold} phases.`;
      } else if (queryLower.includes('phase') && queryLower.includes('prefer')) {
        const phaseMatch = query.match(/phase (\d+)/);
        const phase = phaseMatch ? phaseMatch[1] : 'specified';
        response = `Found ${results.length} tasks that prefer phase ${phase} execution.`;
      } else {
        response = `Found ${results.length} task${results.length > 1 ? 's' : ''} matching your query.`;
      }
    } else {
      response = `Found ${results.length} items matching your query.`;
    }
  }

  return {
    response,
    results
  };
}

/**
 * Generate business rules from natural language
 */
async function generateRule(request: AIRequest): Promise<unknown> {
  const { description } = request;
  
  const systemPrompt = `You are a business rule generator for a resource allocation system.
  Generate a business rule object from natural language descriptions.
  
  Return a JSON object with this structure:
  {
    "type": "coRun" | "sequence" | "priority" | "constraint",
    "id": "rule-{timestamp}",
    "name": "Brief rule name",
    "tasks": ["task1", "task2"] // relevant task IDs
  }`;

  const userPrompt = `Generate a business rule for: "${description}"
  
  Return a valid JSON object representing this rule.`;

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: userPrompt }
  ];

  const aiResponse = await callAzureOpenAI(messages, 800);
  
  try {
    return JSON.parse(aiResponse);
  } catch {
    // Fallback rule if JSON parsing fails
    const fallbackName = description ? 
      (description.length > 50 ? description.substring(0, 50) + '...' : description) :
      'Generated Rule';
    
    return {
      type: 'coRun',
      id: `rule-${Date.now()}`,
      name: fallbackName,
      tasks: []
    };
  }
}

/**
 * Generate rule recommendations based on data patterns
 */
async function generateRecommendations(request: AIRequest): Promise<string[]> {
  const { dataState } = request;
  
  const systemPrompt = `You are a data analysis expert for resource allocation systems.
  Analyze the provided data and suggest business rules that would optimize allocation.
  
  Look for patterns like:
  - Tasks requiring similar skills that could be co-run
  - Worker groups with unbalanced loads
  - High-priority clients with unassigned tasks
  - Skills mismatches between workers and tasks
  
  Return a JSON array of recommendation strings.`;

  const userPrompt = `Analyze this data and provide rule recommendations:
  
  ${JSON.stringify(dataState, null, 2)}
  
  Return a JSON array of specific, actionable recommendations.`;

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: userPrompt }
  ];

  const aiResponse = await callAzureOpenAI(messages, 1200);
  
  try {
    const recommendations = JSON.parse(aiResponse);
    return Array.isArray(recommendations) ? recommendations : [aiResponse];
  } catch {
    return [aiResponse];
  }
}

/**
 * Generate data improvement suggestions
 */
async function generateSuggestions(request: AIRequest): Promise<string[]> {
  const { dataState } = request;
  
  const systemPrompt = `You are a data quality expert for resource allocation systems.
  Review the provided data and identify issues or improvements needed.
  
  Look for problems like:
  - Missing required information (skills, availability, task requirements)
  - Data inconsistencies or invalid values
  - Optimization opportunities
  - Incomplete relationships between entities
  
  Return a JSON array of specific improvement suggestions.`;

  const userPrompt = `Review this data for quality issues and improvement opportunities:
  
  ${JSON.stringify(dataState, null, 2)}
  
  Return a JSON array of specific, actionable suggestions.`;

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: userPrompt }
  ];

  const aiResponse = await callAzureOpenAI(messages, 1200);
  
  try {
    const suggestions = JSON.parse(aiResponse);
    return Array.isArray(suggestions) ? suggestions : [aiResponse];
  } catch {
    return [aiResponse];
  }
}

/**
 * Extract and parse JSON from AI response with multiple strategies
 */
function extractAndParseJSON(aiResponse: string): unknown {
  // Strategy 1: Look for JSON between code blocks first (most common case)
  const codeBlockMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch && codeBlockMatch[1]) {
    try {
      const jsonContent = codeBlockMatch[1].trim();
      return JSON.parse(jsonContent);
    } catch {
      try {
        return cleanAndParseJSON(codeBlockMatch[1]);
      } catch {
        try {
          return repairAndParseJSON(codeBlockMatch[1]);
        } catch {
          // Continue to next strategy
        }
      }
    }
  }

  // Strategy 2: Try to find JSON in the response without code blocks
  const jsonMatches = aiResponse.match(/\{[\s\S]*\}/);
  if (jsonMatches) {
    try {
      return JSON.parse(jsonMatches[0]);
    } catch {
      // Try cleaning the matched JSON
      try {
        return cleanAndParseJSON(jsonMatches[0]);
      } catch {
        // Try repairing the matched JSON
        try {
          return repairAndParseJSON(jsonMatches[0]);
        } catch {
          // Continue to next strategy
        }
      }
    }
  }

  // Strategy 3: Try to create a minimal valid response from fragments
  if (aiResponse.includes('"suggestions"') || aiResponse.includes('errorId')) {
    const fallbackResponse: {
      suggestions: Array<{
        errorId: string;
        suggestedFix: string;
        explanation: string;
        confidence: number;
        autoApplicable: boolean;
      }>;
      response: string;
    } = {
      suggestions: [],
      response: "Generated fallback fix suggestions due to parsing issues"
    };

    // Try to extract individual suggestions if possible
    const errorIdMatches = aiResponse.match(/"errorId":\s*"([^"]+)"/g);
    const fixMatches = aiResponse.match(/"suggestedFix":\s*"([^"]+)"/g);
    const explanationMatches = aiResponse.match(/"explanation":\s*"([^"]+)"/g);

    if (errorIdMatches && fixMatches && explanationMatches) {
      const suggestions = [];
      const minLength = Math.min(errorIdMatches.length, fixMatches.length, explanationMatches.length);
      
      for (let i = 0; i < minLength; i++) {
        const errorId = errorIdMatches[i].match(/"errorId":\s*"([^"]+)"/)?.[1];
        const suggestedFix = fixMatches[i].match(/"suggestedFix":\s*"([^"]+)"/)?.[1];
        const explanation = explanationMatches[i].match(/"explanation":\s*"([^"]+)"/)?.[1];

        if (errorId && suggestedFix && explanation) {
          suggestions.push({
            errorId,
            suggestedFix,
            explanation,
            confidence: 0.7,
            autoApplicable: true
          });
        }
      }

      if (suggestions.length > 0) {
        fallbackResponse.suggestions = suggestions;
        fallbackResponse.response = `Extracted ${suggestions.length} fix suggestions from partial response`;
        return fallbackResponse;
      }
    }

    return fallbackResponse;
  }

  throw new Error('Could not extract valid JSON from AI response');
}

/**
 * Clean and validate JSON string from AI response
 */
function cleanAndParseJSON(jsonString: string): unknown {
  // Remove common formatting issues
  let cleaned = jsonString.trim();
  
  // Remove markdown code blocks and language indicators
  cleaned = cleaned.replace(/```(?:json)?\s*|\s*```/g, '');
  
  // Remove any leading text before the JSON starts
  const jsonStart = cleaned.indexOf('{');
  if (jsonStart > 0) {
    cleaned = cleaned.substring(jsonStart);
  }
  
  // Find the last complete JSON object (handle cases where there might be trailing text)
  let braceCount = 0;
  let jsonEnd = -1;
  let inString = false;
  let escapeNext = false;
  
  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    
    if (char === '"' && !escapeNext) {
      inString = !inString;
      continue;
    }
    
    if (!inString) {
      if (char === '{') {
        braceCount++;
      } else if (char === '}') {
        braceCount--;
        if (braceCount === 0) {
          jsonEnd = i + 1;
          break;
        }
      }
    }
  }
  
  if (jsonEnd > 0) {
    cleaned = cleaned.substring(0, jsonEnd);
  }
  
  // Fix common JSON issues
  cleaned = cleaned
    // Remove trailing commas before closing brackets/braces
    .replace(/,(\s*)([}\]])/g, '$1$2')
    // Remove multiple consecutive commas
    .replace(/,{2,}/g, ',')
    // Fix unescaped newlines in strings (basic attempt)
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
  
  try {
    return JSON.parse(cleaned);
  } catch (error) {
    throw error;
  }
}

/**
 * Attempt to repair incomplete JSON and parse it
 */
function repairAndParseJSON(jsonString: string): unknown {
  let repaired = jsonString.trim();
  
  // Remove markdown code blocks
  repaired = repaired.replace(/```(?:json)?\s*|\s*```/g, '');
  
  // Find the JSON start
  const jsonStart = repaired.indexOf('{');
  if (jsonStart > 0) {
    repaired = repaired.substring(jsonStart);
  }
  
  // Check if JSON is incomplete (doesn't end with })
  if (!repaired.trim().endsWith('}')) {
    
    // Find the last complete entry
    const lastCommaIndex = repaired.lastIndexOf(',');
    const lastCompleteQuote = repaired.lastIndexOf('"', lastCommaIndex);
    
    if (lastCompleteQuote > 0) {
      // Try to find the end of the last complete property
      let cutPoint = repaired.length;
      
      // Look for incomplete string values
      const afterLastQuote = repaired.substring(lastCompleteQuote + 1);
      const nextQuoteIndex = afterLastQuote.indexOf('"');
      
      if (nextQuoteIndex === -1) {
        // No closing quote found - truncate at last complete quote
        cutPoint = lastCompleteQuote + 1;
      }
      
      // Truncate and close the JSON structure
      repaired = repaired.substring(0, cutPoint);
      
      // Remove trailing comma if present
      repaired = repaired.replace(/,\s*$/, '');
      
      // Close any open arrays and objects
      let braceCount = 0;
      let bracketCount = 0;
      let inString = false;
      let escapeNext = false;
      
      for (let i = 0; i < repaired.length; i++) {
        const char = repaired[i];
        
        if (escapeNext) {
          escapeNext = false;
          continue;
        }
        
        if (char === '\\') {
          escapeNext = true;
          continue;
        }
        
        if (char === '"' && !escapeNext) {
          inString = !inString;
          continue;
        }
        
        if (!inString) {
          if (char === '{') braceCount++;
          else if (char === '}') braceCount--;
          else if (char === '[') bracketCount++;
          else if (char === ']') bracketCount--;
        }
      }
      
      // Close any unclosed brackets and braces
      for (let i = 0; i < bracketCount; i++) {
        repaired += ']';
      }
      for (let i = 0; i < braceCount; i++) {
        repaired += '}';
      }
    }
  }
  
  // Apply standard cleaning
  repaired = repaired
    .replace(/,(\s*)([}\]])/g, '$1$2')
    .replace(/,{2,}/g, ',')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
  
  try {
    const parsed = JSON.parse(repaired);
    return parsed;
  } catch (error) {
    throw error;
  }
}

/**
 * Process validation errors and provide AI-powered fix suggestions
 */
async function processValidationFix(request: AIRequest): Promise<{ suggestions: Array<{ errorId: string; suggestedFix: string; explanation: string; confidence: number; autoApplicable: boolean; }>; response: string; }> {
  const { errors, dataState } = request;
  
  if (!errors || errors.length === 0) {
    return {
      suggestions: [],
      response: 'No validation errors to fix'
    };
  }
  
  // Limit the number of errors processed at once to prevent response truncation
  const maxErrorsPerRequest = 10;
  const errorsToProcess = errors.slice(0, maxErrorsPerRequest);
  const hasMoreErrors = errors.length > maxErrorsPerRequest;
  
  const systemPrompt = `You are a data validation expert. Analyze errors and provide JSON fix suggestions.

REQUIRED FORMAT (return ONLY this JSON):
{
  "suggestions": [
    {
      "errorId": "error-id-from-input",
      "suggestedFix": "Clear fix description",
      "explanation": "Brief reason (max 80 chars)",
      "confidence": 0.85,
      "autoApplicable": true
    }
  ],
  "response": "Fixed X errors"
}

RULES:
- PriorityLevel: 1-5 range, auto-applicable
- Duration: >=1, auto-applicable  
- MaxLoadPerPhase: >=1, auto-applicable
- Skills/RequiredSkills: manual review needed

Return valid JSON only. No extra text.`;

  const userPrompt = `ERRORS:
${JSON.stringify(errorsToProcess)}

DATA:
${JSON.stringify(dataState)}

Return JSON fix suggestions.`;

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: userPrompt }
  ];

  try {
    const aiResponse = await callAzureOpenAI(messages, 4000); // Significantly increased token limit
    
    // Try to parse JSON response with multiple strategies
    let parsedResponse;
    try {
      // Use our comprehensive extraction function
      parsedResponse = extractAndParseJSON(aiResponse);
    } catch (extractError) {
      throw new Error(`All JSON parsing strategies failed. Last error: ${extractError instanceof Error ? extractError.message : 'Unknown error'}`);
    }
    
    // Validate response structure
    if (parsedResponse && typeof parsedResponse === 'object' && 'suggestions' in parsedResponse) {
      // Ensure suggestions is an array
      const response = parsedResponse as { suggestions: unknown; response?: string };
      const suggestions = Array.isArray(response.suggestions) ? response.suggestions : [];
      
      const responseMessage = hasMoreErrors 
        ? `Generated AI fix suggestions for ${errorsToProcess.length} of ${errors.length} validation errors (processing in batches)`
        : response.response || `Generated AI-powered fix suggestions for ${errorsToProcess.length} validation errors`;
      
      return {
        suggestions,
        response: responseMessage
      };
    }
    
    throw new Error('Invalid response structure from AI - missing suggestions array');
    
  } catch (error) {
    console.error('AI validation fix failed:', error);
    
    // Fallback to rule-based suggestions
    const fallbackSuggestions = errors.map(error => ({
      errorId: error.id,
      suggestedFix: getFallbackFix(error),
      explanation: getFallbackExplanation(error),
      confidence: 0.7,
      autoApplicable: isAutoFixable(error)
    }));
    
    return {
      suggestions: fallbackSuggestions,
      response: `Generated ${fallbackSuggestions.length} rule-based fix suggestions (AI parsing failed: ${error instanceof Error ? error.message : 'Unknown error'})`
    };
  }
}

/**
 * Fallback fix suggestions using rule-based logic
 */
function getFallbackFix(error: { field: string; entity: string; }): string {
  switch (error.field) {
    case 'PriorityLevel':
      return 'Set priority level to valid range (1-5)';
    case 'Duration':
      return 'Set minimum duration to 1 phase';
    case 'MaxLoadPerPhase':
      return 'Set minimum load capacity to 1';
    case 'Skills':
      return 'Add relevant skills based on task requirements';
    case 'RequiredSkills':
      return 'Review and validate required skills';
    default:
      return 'Manual review required';
  }
}

/**
 * Fallback explanations for fixes
 */
function getFallbackExplanation(error: { field: string; entity: string; }): string {
  switch (error.field) {
    case 'PriorityLevel':
      return 'Priority levels must be between 1 (lowest) and 5 (highest)';
    case 'Duration':
      return 'Task duration must be at least 1 phase to be executable';
    case 'MaxLoadPerPhase':
      return 'Workers must be able to handle at least 1 task per phase';
    case 'Skills':
      return 'Workers need relevant skills to be assigned to tasks';
    case 'RequiredSkills':
      return 'Tasks must specify skills that match available workers';
    default:
      return 'This error requires manual inspection and correction';
  }
}

/**
 * Check if an error can be automatically fixed
 */
function isAutoFixable(error: { field: string; entity: string; }): boolean {
  const autoFixableFields = ['PriorityLevel', 'Duration', 'MaxLoadPerPhase'];
  return autoFixableFields.includes(error.field);
}
