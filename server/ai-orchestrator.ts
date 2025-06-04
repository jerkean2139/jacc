import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { pineconeVectorService } from './pinecone-vector';
import { advancedSearchService } from './advanced-search';
import { aiEnhancedSearchService } from './ai-enhanced-search';
import { documentProcessor } from './document-processor';
import { aiConfigService } from './ai-config-service';

// the newest Anthropic model is "claude-sonnet-4-20250514" which was released May 14, 2025. Use this by default
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user

export interface AgentTask {
  id: string;
  type: 'search' | 'process' | 'analyze' | 'generate' | 'enhance';
  priority: 'high' | 'medium' | 'low';
  payload: any;
  dependencies?: string[];
  timeout?: number;
  retries?: number;
}

export interface AgentResult {
  taskId: string;
  agentId: string;
  status: 'success' | 'error' | 'timeout';
  data: any;
  metadata: {
    executionTime: number;
    tokensUsed?: number;
    confidence: number;
    model?: string;
  };
  error?: string;
}

export interface WorkflowContext {
  userId: string;
  sessionId: string;
  originalQuery: string;
  searchNamespaces: string[];
  preferences: {
    responseFormat: 'detailed' | 'concise' | 'bullet_points';
    includeSourceLinks: boolean;
    maxResults: number;
  };
  sharedMemory: Map<string, any>;
}

export class AIOrchestrator {
  private openai: OpenAI;
  private anthropic: Anthropic;
  private activeTasks: Map<string, AgentTask> = new Map();
  private taskQueue: AgentTask[] = [];
  private maxConcurrentTasks = 5;
  private performanceMetrics: Map<string, number[]> = new Map();

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async orchestrateSearch(query: string, context: WorkflowContext): Promise<any> {
    const workflowId = `search_${Date.now()}`;
    console.log(`🎯 Orchestrating multi-agent search workflow: ${workflowId}`);
    
    try {
      // Phase 1: Parallel search execution
      const searchTasks = this.createSearchTasks(query, context);
      const searchResults = await this.executeTasksInParallel(searchTasks, context);
      
      // Phase 2: Result synthesis and enhancement
      const synthesisTask = this.createSynthesisTask(searchResults, query, context);
      const finalResult = await this.executeSingleTask(synthesisTask, context);
      
      // Phase 3: Performance optimization
      await this.updatePerformanceMetrics(workflowId, searchResults);
      
      return finalResult.data;
    } catch (error) {
      console.error('Orchestration failed:', error);
      throw new Error('Multi-agent search workflow failed');
    }
  }

  private createSearchTasks(query: string, context: WorkflowContext): AgentTask[] {
    return [
      {
        id: 'vector_search',
        type: 'search',
        priority: 'high',
        payload: { query, namespaces: context.searchNamespaces },
        timeout: 15000
      },
      {
        id: 'advanced_search',
        type: 'search',
        priority: 'high',
        payload: { query, userId: context.userId },
        timeout: 10000
      },
      {
        id: 'ai_enhanced_search',
        type: 'enhance',
        priority: 'medium',
        payload: { query },
        timeout: 20000
      },
      {
        id: 'query_expansion',
        type: 'analyze',
        priority: 'low',
        payload: { query, context: 'merchant_services' },
        timeout: 8000
      }
    ];
  }

  private createSynthesisTask(searchResults: AgentResult[], originalQuery: string, context: WorkflowContext): AgentTask {
    return {
      id: 'result_synthesis',
      type: 'generate',
      priority: 'high',
      payload: {
        searchResults,
        originalQuery,
        format: context.preferences.responseFormat,
        maxResults: context.preferences.maxResults
      },
      timeout: 25000
    };
  }

  async executeTasksInParallel(tasks: AgentTask[], context: WorkflowContext): Promise<AgentResult[]> {
    const results: AgentResult[] = [];
    const executionPromises = tasks.map(task => this.executeSingleTask(task, context));
    
    // Execute with timeout and graceful failure handling
    const settledResults = await Promise.allSettled(executionPromises);
    
    settledResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        console.warn(`Task ${tasks[index].id} failed:`, result.reason);
        // Create error result for failed task
        results.push({
          taskId: tasks[index].id,
          agentId: 'orchestrator',
          status: 'error',
          data: null,
          metadata: {
            executionTime: 0,
            confidence: 0
          },
          error: result.reason?.message || 'Task execution failed'
        });
      }
    });
    
    return results;
  }

  async executeSingleTask(task: AgentTask, context: WorkflowContext): Promise<AgentResult> {
    const startTime = Date.now();
    
    try {
      let result: any;
      
      switch (task.id) {
        case 'vector_search':
          result = await this.executeVectorSearch(task.payload, context);
          break;
        case 'advanced_search':
          result = await this.executeAdvancedSearch(task.payload, context);
          break;
        case 'ai_enhanced_search':
          result = await this.executeAIEnhancedSearch(task.payload, context);
          break;
        case 'query_expansion':
          result = await this.executeQueryExpansion(task.payload, context);
          break;
        case 'result_synthesis':
          result = await this.executeSynthesis(task.payload, context);
          break;
        default:
          throw new Error(`Unknown task type: ${task.id}`);
      }
      
      const executionTime = Date.now() - startTime;
      
      return {
        taskId: task.id,
        agentId: this.getAgentId(task.type),
        status: 'success',
        data: result,
        metadata: {
          executionTime,
          confidence: this.calculateTaskConfidence(result, task.type),
          model: this.getModelUsed(task.type)
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      return {
        taskId: task.id,
        agentId: this.getAgentId(task.type),
        status: 'error',
        data: null,
        metadata: {
          executionTime,
          confidence: 0
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async executeVectorSearch(payload: any, context: WorkflowContext): Promise<any> {
    return await pineconeVectorService.searchDocuments(
      payload.query,
      context.preferences.maxResults,
      payload.namespaces
    );
  }

  private async executeAdvancedSearch(payload: any, context: WorkflowContext): Promise<any> {
    return await advancedSearchService.performAdvancedSearch(
      payload.query,
      payload.userId
    );
  }

  private async executeAIEnhancedSearch(payload: any, context: WorkflowContext): Promise<any> {
    return await aiEnhancedSearchService.intelligentDocumentSearch(payload.query);
  }

  private async executeQueryExpansion(payload: any, context: WorkflowContext): Promise<any> {
    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: `You are a query expansion specialist for merchant services. Expand the user's query with relevant synonyms, related terms, and domain-specific terminology that would improve search results.`,
      messages: [{
        role: 'user',
        content: `Expand this merchant services query: "${payload.query}"\n\nReturn 5-8 related search terms that would improve results.`
      }]
    });

    const expandedTerms = response.content[0].text.split('\n')
      .filter(term => term.trim())
      .slice(0, 8);

    return {
      originalQuery: payload.query,
      expandedTerms,
      confidence: 0.85
    };
  }

  private async executeSynthesis(payload: any, context: WorkflowContext): Promise<any> {
    const { searchResults, originalQuery, format, maxResults } = payload;
    
    // Combine all successful search results
    const allResults = searchResults
      .filter((result: AgentResult) => result.status === 'success' && result.data)
      .flatMap((result: AgentResult) => result.data)
      .slice(0, maxResults);

    if (allResults.length === 0) {
      return {
        response: "I couldn't find any relevant documents for your query. Try rephrasing your question or checking if the documents are properly uploaded.",
        sources: [],
        confidence: 0
      };
    }

    // Use Claude for synthesis with improved context assembly
    const contextContent = allResults
      .map((result: any, index: number) => {
        const docName = result.metadata?.documentName || `Document ${index + 1}`;
        return `[${index + 1}] ${docName}:\n${result.content?.substring(0, 800) || 'No content available'}`;
      })
      .join('\n\n');

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: `You are JACC, an expert AI assistant for merchant services and payment processing. Provide comprehensive, accurate responses based strictly on the provided document content. Always cite your sources and be specific about processing rates, fees, and requirements.`,
      messages: [{
        role: 'user',
        content: `Based on these merchant services documents, answer: "${originalQuery}"\n\nDocument excerpts:\n${contextContent}\n\nProvide a ${format} response with specific details and source citations.`
      }]
    });

    return {
      response: response.content[0].text,
      sources: allResults.map((result: any) => ({
        documentName: result.metadata?.documentName,
        relevanceScore: result.score || 0,
        webViewLink: result.metadata?.webViewLink
      })),
      confidence: this.calculateSynthesisConfidence(allResults),
      searchResultsCount: allResults.length
    };
  }

  private getAgentId(taskType: string): string {
    const agentMap = {
      'search': 'vector_agent',
      'process': 'document_agent',
      'analyze': 'analysis_agent',
      'generate': 'synthesis_agent',
      'enhance': 'enhancement_agent'
    };
    return agentMap[taskType] || 'unknown_agent';
  }

  private getModelUsed(taskType: string): string {
    const modelMap = {
      'search': 'text-embedding-3-small',
      'analyze': 'claude-sonnet-4-20250514',
      'generate': 'claude-sonnet-4-20250514',
      'enhance': 'gpt-4o'
    };
    return modelMap[taskType] || 'unknown';
  }

  private calculateTaskConfidence(result: any, taskType: string): number {
    if (!result) return 0;
    
    if (Array.isArray(result)) {
      if (result.length === 0) return 0.2;
      const avgScore = result.reduce((sum, item) => sum + (item.score || 0.5), 0) / result.length;
      return Math.min(avgScore + 0.1, 1.0);
    }
    
    return result.confidence || 0.7;
  }

  private calculateSynthesisConfidence(results: any[]): number {
    if (results.length === 0) return 0;
    
    const qualityScore = results.length >= 3 ? 0.9 : results.length * 0.3;
    const avgRelevance = results.reduce((sum, r) => sum + (r.score || 0.5), 0) / results.length;
    
    return Math.min((qualityScore + avgRelevance) / 2, 1.0);
  }

  private async updatePerformanceMetrics(workflowId: string, results: AgentResult[]): Promise<void> {
    results.forEach(result => {
      const agentMetrics = this.performanceMetrics.get(result.agentId) || [];
      agentMetrics.push(result.metadata.executionTime);
      
      // Keep only last 100 measurements
      if (agentMetrics.length > 100) {
        agentMetrics.shift();
      }
      
      this.performanceMetrics.set(result.agentId, agentMetrics);
    });
  }

  getPerformanceStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    this.performanceMetrics.forEach((times, agentId) => {
      if (times.length > 0) {
        const avg = times.reduce((sum, time) => sum + time, 0) / times.length;
        const min = Math.min(...times);
        const max = Math.max(...times);
        
        stats[agentId] = {
          averageExecutionTime: Math.round(avg),
          minExecutionTime: min,
          maxExecutionTime: max,
          totalExecutions: times.length
        };
      }
    });
    
    return stats;
  }
}

export const aiOrchestrator = new AIOrchestrator();