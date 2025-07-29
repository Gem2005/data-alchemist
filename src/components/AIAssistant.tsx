'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataState, BusinessRule } from '@/types/data';
import { Brain, MessageCircle, Search, Wand2, Lightbulb, Send } from 'lucide-react';
import { toast } from 'sonner';

interface AIAssistantProps {
  dataState: DataState;
  businessRules: BusinessRule[];
  onDataUpdate: (dataState: Partial<DataState>) => void;
  onRuleUpdate: (rules: BusinessRule[]) => void;
}

export function AIAssistant({ 
  dataState, 
  businessRules, // eslint-disable-line @typescript-eslint/no-unused-vars
  onDataUpdate, // eslint-disable-line @typescript-eslint/no-unused-vars
  onRuleUpdate // eslint-disable-line @typescript-eslint/no-unused-vars
}: AIAssistantProps) {
  const [naturalLanguageQuery, setNaturalLanguageQuery] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [queryResults, setQueryResults] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{
    type: 'user' | 'ai';
    message: string;
    timestamp: Date;
  }>>([]);

  // AI-powered natural language data search
  const processNaturalLanguageQuery = async () => {
    if (!naturalLanguageQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setIsProcessing(true);
    setChatHistory(prev => [...prev, {
      type: 'user',
      message: naturalLanguageQuery,
      timestamp: new Date()
    }]);

    try {
      // Simulate AI processing - in real implementation, this would call Azure OpenAI
      await new Promise(resolve => setTimeout(resolve, 1000));

      const query = naturalLanguageQuery.toLowerCase();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let results: any[] = [];
      let aiResponse = '';

      // Simple pattern matching for demonstration
      if (query.includes('duration') && query.includes('more than')) {
        const durationMatch = query.match(/more than (\d+)/);
        if (durationMatch) {
          const threshold = parseInt(durationMatch[1]);
          results = dataState.tasks.filter(task => task.Duration > threshold);
          aiResponse = `Found ${results.length} tasks with duration more than ${threshold} phases.`;
        }
      } else if (query.includes('phase 2') || query.includes('phase two')) {
        results = dataState.tasks.filter(task => 
          task.PreferredPhases.includes(2)
        );
        aiResponse = `Found ${results.length} tasks that prefer phase 2.`;
      } else if (query.includes('skill') && query.includes('javascript')) {
        results = dataState.workers.filter(worker => 
          worker.Skills.some(skill => skill.toLowerCase().includes('javascript'))
        );
        aiResponse = `Found ${results.length} workers with JavaScript skills.`;
      } else if (query.includes('priority') && query.includes('high')) {
        results = dataState.clients.filter(client => client.PriorityLevel >= 4);
        aiResponse = `Found ${results.length} high-priority clients (priority level 4-5).`;
      } else if (query.includes('available') && query.includes('slots')) {
        results = dataState.workers.filter(worker => worker.AvailableSlots.length >= 3);
        aiResponse = `Found ${results.length} workers with 3 or more available slots.`;
      } else {
        // Fallback: show all data types
        results = [
          ...dataState.clients.slice(0, 3),
          ...dataState.workers.slice(0, 3),
          ...dataState.tasks.slice(0, 3)
        ];
        aiResponse = `Here are some relevant data entries. Try more specific queries like "tasks with duration more than 2" or "workers with JavaScript skills".`;
      }

      setQueryResults(results);
      setChatHistory(prev => [...prev, {
        type: 'ai',
        message: aiResponse,
        timestamp: new Date()
      }]);

      toast.success('Query processed successfully');
    } catch {
      toast.error('Failed to process query');
      setChatHistory(prev => [...prev, {
        type: 'ai',
        message: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsProcessing(false);
      setNaturalLanguageQuery('');
    }
  };

  // AI rule recommendations
  const generateRuleRecommendations = () => {
    const recommendations: string[] = [];

    // Check for co-run opportunities
    const tasksBySkills = new Map<string, string[]>();
    dataState.tasks.forEach(task => {
      task.RequiredSkills.forEach(skill => {
        if (!tasksBySkills.has(skill)) tasksBySkills.set(skill, []);
        tasksBySkills.get(skill)!.push(task.TaskID);
      });
    });

    tasksBySkills.forEach((tasks, skill) => {
      if (tasks.length >= 2) {
        recommendations.push(`Tasks ${tasks.join(', ')} all require "${skill}" skill. Consider creating a co-run rule for efficiency.`);
      }
    });

    // Check for overloaded workers
    const workerGroupLoads = new Map<string, number>();
    dataState.workers.forEach(worker => {
      const currentLoad = workerGroupLoads.get(worker.WorkerGroup) || 0;
      workerGroupLoads.set(worker.WorkerGroup, currentLoad + worker.MaxLoadPerPhase);
    });

    workerGroupLoads.forEach((totalLoad, group) => {
      if (totalLoad > 10) {
        recommendations.push(`Worker group "${group}" has high total capacity (${totalLoad}). Consider adding load limit rules to prevent burnout.`);
      }
    });

    // Check for phase preferences
    const phasePopularity = new Map<number, number>();
    dataState.tasks.forEach(task => {
      task.PreferredPhases.forEach(phase => {
        phasePopularity.set(phase, (phasePopularity.get(phase) || 0) + 1);
      });
    });

    const maxPhase = Math.max(...Array.from(phasePopularity.values()));
    phasePopularity.forEach((count, phase) => {
      if (count === maxPhase && count > 1) {
        recommendations.push(`Phase ${phase} is very popular (${count} tasks). Consider creating phase window restrictions to spread the load.`);
      }
    });

    setChatHistory(prev => [...prev, {
      type: 'ai',
      message: recommendations.length > 0 
        ? `Here are some rule recommendations based on your data:\n\n${recommendations.join('\n\n')}`
        : 'Your current data looks well-balanced! No specific rule recommendations at this time.',
      timestamp: new Date()
    }]);

    toast.success('Generated rule recommendations');
  };

  // AI data corrections
  const suggestDataCorrections = () => {
    const suggestions: string[] = [];

    // Check for common data issues
    dataState.clients.forEach(client => {
      if (client.RequestedTaskIDs.length === 0) {
        suggestions.push(`Client ${client.ClientID} has no requested tasks. Consider adding some task assignments.`);
      }
    });

    dataState.workers.forEach(worker => {
      if (worker.Skills.length === 0) {
        suggestions.push(`Worker ${worker.WorkerID} has no skills listed. This may limit their task assignments.`);
      }
      if (worker.AvailableSlots.length === 0) {
        suggestions.push(`Worker ${worker.WorkerID} has no available slots. They won't be able to work on any tasks.`);
      }
    });

    dataState.tasks.forEach(task => {
      if (task.RequiredSkills.length === 0) {
        suggestions.push(`Task ${task.TaskID} has no required skills. Consider specifying skills for better matching.`);
      }
      if (task.PreferredPhases.length === 0) {
        suggestions.push(`Task ${task.TaskID} has no preferred phases. This may affect scheduling efficiency.`);
      }
    });

    setChatHistory(prev => [...prev, {
      type: 'ai',
      message: suggestions.length > 0 
        ? `Here are some data improvement suggestions:\n\n${suggestions.join('\n\n')}`
        : 'Your data looks comprehensive! All entities have the necessary information for optimal allocation.',
      timestamp: new Date()
    }]);

    toast.success('Generated data improvement suggestions');
  };

  const exampleQueries = [
    "Show me all tasks with duration more than 2 phases",
    "Find workers with JavaScript and React skills",
    "Which clients have high priority levels?",
    "Tasks that prefer phase 3 execution",
    "Workers available in phases 1 and 2"
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="h-5 w-5 mr-2" />
            AI Assistant
          </CardTitle>
          <CardDescription>
            Get intelligent insights, recommendations, and perform natural language queries on your data
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="query" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="query">
                <Search className="h-4 w-4 mr-2" />
                Natural Language Search
              </TabsTrigger>
              <TabsTrigger value="recommendations">
                <Lightbulb className="h-4 w-4 mr-2" />
                AI Recommendations
              </TabsTrigger>
              <TabsTrigger value="chat">
                <MessageCircle className="h-4 w-4 mr-2" />
                AI Chat
              </TabsTrigger>
            </TabsList>

            <TabsContent value="query" className="space-y-4">
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    value={naturalLanguageQuery}
                    onChange={(e) => setNaturalLanguageQuery(e.target.value)}
                    placeholder="Ask me anything about your data... e.g., 'Show tasks with duration more than 2 phases'"
                    onKeyDown={(e) => e.key === 'Enter' && processNaturalLanguageQuery()}
                    className="flex-1"
                  />
                  <Button 
                    onClick={processNaturalLanguageQuery}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Example Queries:</h4>
                  <div className="space-y-1">
                    {exampleQueries.map((example, index) => (
                      <button
                        key={index}
                        onClick={() => setNaturalLanguageQuery(example)}
                        className="block text-sm text-blue-700 hover:text-blue-900 hover:underline text-left"
                      >
                        &quot;{example}&quot;
                      </button>
                    ))}
                  </div>
                </div>

                {queryResults.length > 0 && (
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">Query Results ({queryResults.length} items)</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {queryResults.map((item, index) => (
                        <div key={index} className="text-sm bg-gray-50 p-2 rounded">
                          <div className="font-medium">
                            {item.ClientID && `Client: ${item.ClientID} - ${item.ClientName}`}
                            {item.WorkerID && `Worker: ${item.WorkerID} - ${item.WorkerName}`}
                            {item.TaskID && `Task: ${item.TaskID} - ${item.TaskName}`}
                          </div>
                          <div className="text-gray-600 mt-1">
                            {item.ClientID && `Priority: ${item.PriorityLevel}, Group: ${item.GroupTag}`}
                            {item.WorkerID && `Skills: ${item.Skills.join(', ')}, Available: ${JSON.stringify(item.AvailableSlots)}`}
                            {item.TaskID && `Duration: ${item.Duration}, Required Skills: ${item.RequiredSkills.join(', ')}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    onClick={generateRuleRecommendations}
                    className="h-auto p-4 flex flex-col items-center space-y-2"
                  >
                    <Wand2 className="h-6 w-6" />
                    <span className="text-sm">Rule Recommendations</span>
                  </Button>
                  
                  <Button 
                    onClick={suggestDataCorrections}
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center space-y-2"
                  >
                    <Lightbulb className="h-6 w-6" />
                    <span className="text-sm">Data Improvements</span>
                  </Button>
                  
                  <Button 
                    onClick={() => toast.info('Feature coming soon!')}
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center space-y-2"
                  >
                    <Brain className="h-6 w-6" />
                    <span className="text-sm">Smart Insights</span>
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="chat" className="space-y-4">
              <div className="border rounded-lg h-96 flex flex-col">
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {chatHistory.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <Brain className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Start a conversation with the AI assistant</p>
                      <p className="text-sm">Ask questions about your data or request analysis</p>
                    </div>
                  ) : (
                    chatHistory.map((chat, index) => (
                      <div
                        key={index}
                        className={`flex ${chat.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            chat.type === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <div className="text-sm whitespace-pre-wrap">{chat.message}</div>
                          <div className="text-xs opacity-70 mt-1">
                            {chat.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                <div className="border-t p-4">
                  <div className="flex space-x-2">
                    <Input
                      value={naturalLanguageQuery}
                      onChange={(e) => setNaturalLanguageQuery(e.target.value)}
                      placeholder="Type your message..."
                      onKeyDown={(e) => e.key === 'Enter' && processNaturalLanguageQuery()}
                      className="flex-1"
                    />
                    <Button 
                      onClick={processNaturalLanguageQuery}
                      disabled={isProcessing}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
