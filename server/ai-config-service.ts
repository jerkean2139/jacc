import { db } from "./db";
import { aiModels, modelPerformance, retrievalConfigs, contentFilters, responseQuality, type AIModel, type InsertAIModel, type ModelPerformance, type RetrievalConfig } from "@shared/schema";
import { eq, desc, and, gte } from "drizzle-orm";
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

// the newest Anthropic model is "claude-sonnet-4-20250514" which was released May 14, 2025
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface AIConfigSettings {
  primaryModel: string;
  fallbackModel: string;
  temperature: number;
  maxTokens: number;
  enableModelSwitching: boolean;
  costTrackingEnabled: boolean;
  similarityThreshold: number;
  maxSearchResults: number;
  chunkSize: number;
  searchStrategy: 'semantic' | 'keyword' | 'hybrid';
  embeddingModel: string;
  enableContentFiltering: boolean;
  enableBiasDetection: boolean;
  responseTimeoutMs: number;
}

export class AIConfigurationService {
  
  async initializeDefaultModels(): Promise<void> {
    const existingModels = await db.select().from(aiModels).limit(1);
    
    if (existingModels.length === 0) {
      const defaultModels: InsertAIModel[] = [
        {
          name: "Claude 4.0 Sonnet",
          provider: "anthropic",
          modelId: "claude-sonnet-4-20250514",
          isActive: true,
          maxTokens: 8192,
          costPerToken: 0.000015,
          isDefault: true,
          capabilities: {
            vision: true,
            functions: false,
            reasoning: true,
            analysis: true,
            longContext: true
          },
          description: "Latest Claude 4.0 model with enhanced reasoning and analysis capabilities"
        },
        {
          name: "GPT-4o",
          provider: "openai",
          modelId: "gpt-4o",
          isActive: true,
          maxTokens: 4096,
          costPerToken: 0.00001,
          isDefault: false,
          capabilities: {
            vision: true,
            functions: true,
            reasoning: true,
            analysis: true,
            longContext: false
          },
          description: "OpenAI's most advanced multimodal model with vision and function calling"
        },
        {
          name: "Claude 3.7 Sonnet",
          provider: "anthropic",
          modelId: "claude-3-7-sonnet-20250219",
          isActive: true,
          maxTokens: 8192,
          costPerToken: 0.000012,
          isDefault: false,
          capabilities: {
            vision: true,
            functions: false,
            reasoning: true,
            analysis: true,
            longContext: true
          },
          description: "Previous generation Claude model for fallback scenarios"
        }
      ];

      await db.insert(aiModels).values(defaultModels);
    }
  }

  async getAvailableModels(): Promise<AIModel[]> {
    return await db.select()
      .from(aiModels)
      .where(eq(aiModels.isActive, true))
      .orderBy(desc(aiModels.isDefault));
  }

  async getDefaultModel(): Promise<AIModel> {
    const [defaultModel] = await db.select()
      .from(aiModels)
      .where(and(eq(aiModels.isDefault, true), eq(aiModels.isActive, true)))
      .limit(1);
      
    if (!defaultModel) {
      throw new Error("No default AI model configured");
    }
    
    return defaultModel;
  }

  async setDefaultModel(modelId: string): Promise<void> {
    // Remove default flag from all models
    await db.update(aiModels)
      .set({ isDefault: false })
      .where(eq(aiModels.isDefault, true));
      
    // Set new default
    await db.update(aiModels)
      .set({ isDefault: true })
      .where(eq(aiModels.id, modelId));
  }

  async generateResponse(
    model: AIModel,
    messages: any[],
    options: {
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
    } = {}
  ): Promise<{
    content: string;
    usage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    responseTime: number;
    cost: number;
  }> {
    const startTime = Date.now();
    let response: any;
    let usage: any;

    try {
      if (model.provider === 'anthropic') {
        const anthropicMessages = messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));

        response = await anthropic.messages.create({
          model: model.modelId,
          messages: anthropicMessages,
          max_tokens: options.maxTokens || model.maxTokens || 4000,
          temperature: options.temperature || 0.7,
          system: options.systemPrompt
        });

        usage = {
          promptTokens: response.usage?.input_tokens || 0,
          completionTokens: response.usage?.output_tokens || 0,
          totalTokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0)
        };

      } else if (model.provider === 'openai') {
        const openaiMessages = [...messages];
        if (options.systemPrompt) {
          openaiMessages.unshift({ role: 'system', content: options.systemPrompt });
        }

        response = await openai.chat.completions.create({
          model: model.modelId,
          messages: openaiMessages,
          max_tokens: options.maxTokens || model.maxTokens || 4000,
          temperature: options.temperature || 0.7
        });

        usage = {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0
        };
      } else {
        throw new Error(`Unsupported model provider: ${model.provider}`);
      }

      const responseTime = Date.now() - startTime;
      const cost = usage.totalTokens * (model.costPerToken || 0);

      // Track performance metrics
      await this.trackModelPerformance(model.id, {
        responseTime,
        tokensUsed: usage.totalTokens,
        cost,
        success: true
      });

      return {
        content: model.provider === 'anthropic' ? response.content[0].text : response.choices[0].message.content,
        usage,
        responseTime,
        cost
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Track failed performance
      await this.trackModelPerformance(model.id, {
        responseTime,
        tokensUsed: 0,
        cost: 0,
        success: false
      });

      throw error;
    }
  }

  async trackModelPerformance(
    modelId: string,
    metrics: {
      responseTime: number;
      tokensUsed: number;
      cost: number;
      success: boolean;
    }
  ): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    
    const [existingRecord] = await db.select()
      .from(modelPerformance)
      .where(and(
        eq(modelPerformance.modelId, modelId),
        eq(modelPerformance.date, today)
      ))
      .limit(1);

    if (existingRecord) {
      // Update existing record
      const newTotalRequests = existingRecord.totalRequests + 1;
      const newSuccessfulRequests = existingRecord.successfulRequests + (metrics.success ? 1 : 0);
      const newAverageResponseTime = (existingRecord.averageResponseTime * existingRecord.totalRequests + metrics.responseTime) / newTotalRequests;
      const newAverageTokensUsed = (existingRecord.averageTokensUsed * existingRecord.totalRequests + metrics.tokensUsed) / newTotalRequests;
      const newTotalCost = existingRecord.totalCost + metrics.cost;

      await db.update(modelPerformance)
        .set({
          totalRequests: newTotalRequests,
          successfulRequests: newSuccessfulRequests,
          averageResponseTime: newAverageResponseTime,
          averageTokensUsed: newAverageTokensUsed,
          totalCost: newTotalCost
        })
        .where(eq(modelPerformance.id, existingRecord.id));
    } else {
      // Create new record
      await db.insert(modelPerformance).values({
        modelId,
        date: today,
        totalRequests: 1,
        successfulRequests: metrics.success ? 1 : 0,
        averageResponseTime: metrics.responseTime,
        averageTokensUsed: metrics.tokensUsed,
        totalCost: metrics.cost,
        userSatisfactionScore: 0
      });
    }
  }

  async getModelPerformanceStats(modelId: string, days: number = 7): Promise<ModelPerformance[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return await db.select()
      .from(modelPerformance)
      .where(and(
        eq(modelPerformance.modelId, modelId),
        gte(modelPerformance.date, startDate.toISOString().split('T')[0])
      ))
      .orderBy(desc(modelPerformance.date));
  }

  async getRetrievalConfig(name: string = 'default'): Promise<RetrievalConfig | null> {
    const [config] = await db.select()
      .from(retrievalConfigs)
      .where(eq(retrievalConfigs.name, name))
      .limit(1);
      
    return config || null;
  }

  async updateRetrievalConfig(name: string, updates: Partial<RetrievalConfig>): Promise<void> {
    await db.update(retrievalConfigs)
      .set(updates)
      .where(eq(retrievalConfigs.name, name));
  }

  async getContentFilters(): Promise<any[]> {
    return await db.select()
      .from(contentFilters)
      .where(eq(contentFilters.isActive, true));
  }

  async applyContentFiltering(content: string): Promise<{
    filtered: boolean;
    reason?: string;
    severity?: string;
    modifiedContent?: string;
  }> {
    const filters = await this.getContentFilters();
    
    for (const filter of filters) {
      const regex = new RegExp(filter.pattern, 'i');
      if (regex.test(content)) {
        if (filter.action === 'block') {
          return {
            filtered: true,
            reason: filter.name,
            severity: filter.severity
          };
        } else if (filter.action === 'modify') {
          return {
            filtered: true,
            reason: filter.name,
            severity: filter.severity,
            modifiedContent: content.replace(regex, '[FILTERED]')
          };
        }
      }
    }
    
    return { filtered: false };
  }

  async trackResponseQuality(
    chatId: string,
    messageId: string,
    modelUsed: string,
    metrics: {
      relevanceScore?: number;
      accuracyScore?: number;
      helpfulnessScore?: number;
      responseTime: number;
      tokenCount: number;
      userFeedback?: string;
    }
  ): Promise<void> {
    await db.insert(responseQuality).values({
      chatId,
      messageId,
      modelUsed,
      relevanceScore: metrics.relevanceScore,
      accuracyScore: metrics.accuracyScore,
      helpfulnessScore: metrics.helpfulnessScore,
      responseTime: metrics.responseTime,
      tokenCount: metrics.tokenCount,
      userFeedback: metrics.userFeedback
    });
  }
}

export const aiConfigService = new AIConfigurationService();