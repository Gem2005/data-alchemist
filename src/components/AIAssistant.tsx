'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataState, BusinessRule } from '@/types/data';
import { Brain, MessageCircle, Search, Wand2, Lightbulb, Send } from 'lucide-react';
import { toast } from 'sonner';
import { azureOpenAIService } from '@/lib/azureOpenAI';

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

  // Check if Azure OpenAI is configured
  const isAzureConfigured = azureOpenAIService.isReady();

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
      // Use real Azure OpenAI service instead of mock responses
      const { results, response } = await azureOpenAIService.processNaturalLanguageQuery(
        naturalLanguageQuery, 
        dataState
      );

      setQueryResults(results);
      setChatHistory(prev => [...prev, {
        type: 'ai',
        message: response,
        timestamp: new Date()
      }]);

      toast.success('Query processed successfully');
    } catch (error) {
      console.error('Query processing failed:', error);
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
  const generateRuleRecommendations = async () => {
    try {
      // Use real Azure OpenAI service instead of mock responses
      const recommendations = await azureOpenAIService.generateRuleRecommendations(dataState);

      setChatHistory(prev => [...prev, {
        type: 'ai',
        message: recommendations.length > 0 
          ? `Here are some rule recommendations based on your data:\n\n${recommendations.join('\n\n')}`
          : 'Your current data looks well-balanced! No specific rule recommendations at this time.',
        timestamp: new Date()
      }]);

      toast.success('Generated rule recommendations');
    } catch (error) {
      console.error('Rule recommendations failed:', error);
      toast.error('Failed to generate recommendations');
      setChatHistory(prev => [...prev, {
        type: 'ai',
        message: 'Sorry, I encountered an error generating recommendations. Please try again.',
        timestamp: new Date()
      }]);
    }
  };

  // AI data corrections
  const suggestDataCorrections = async () => {
    try {
      // Use real Azure OpenAI service instead of mock responses
      const suggestions = await azureOpenAIService.generateDataSuggestions(dataState);

      setChatHistory(prev => [...prev, {
        type: 'ai',
        message: suggestions.length > 0 
          ? `Here are some data improvement suggestions:\n\n${suggestions.join('\n\n')}`
          : 'Your data looks comprehensive! All entities have the necessary information for optimal allocation.',
        timestamp: new Date()
      }]);

      toast.success('Generated data improvement suggestions');
    } catch (error) {
      console.error('Data suggestions failed:', error);
      toast.error('Failed to generate suggestions');
      setChatHistory(prev => [...prev, {
        type: 'ai',
        message: 'Sorry, I encountered an error generating suggestions. Please try again.',
        timestamp: new Date()
      }]);
    }
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
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Brain className="h-5 w-5 mr-2" />
              AI Assistant
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isAzureConfigured ? 'bg-green-500' : 'bg-orange-500'}`} />
              <span className="text-xs text-gray-500">
                {isAzureConfigured ? 'Azure OpenAI' : 'Fallback Mode'}
              </span>
            </div>
          </CardTitle>
          <CardDescription>
            Get intelligent insights, recommendations, and perform natural language queries on your data
            {!isAzureConfigured && (
              <div className="mt-2 text-sm text-orange-600">
                Configure Azure OpenAI in environment variables for enhanced AI features
              </div>
            )}
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
