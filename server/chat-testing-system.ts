import { Express, Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';

export interface TestScenario {
  id: string;
  title: string;
  description: string;
  userQuery: string;
  expectedResponseType: 'internal_knowledge' | 'web_search' | 'hybrid';
  expectedKeywords: string[];
  category: 'pricing' | 'pos_systems' | 'processors' | 'industry_info' | 'support';
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'passed' | 'failed' | 'needs_review';
  lastTested?: Date;
  aiResponse?: string;
  responseQuality?: number; // 1-10 scale
  adminNotes?: string;
  searchSources?: string[];
  responseTime?: number;
}

export interface TestResult {
  scenarioId: string;
  timestamp: Date;
  userQuery: string;
  aiResponse: string;
  responseTime: number;
  sourceTypes: string[];
  qualityScore: number;
  passedChecks: string[];
  failedChecks: string[];
  recommendations: string[];
}

export class ChatTestingSystem {
  private testScenarios: Map<string, TestScenario> = new Map();
  private testResults: TestResult[] = [];
  private testScenariosFile = './test-scenarios.json';
  private testResultsFile = './test-results.json';

  constructor() {
    this.initializeDefaultScenarios();
    this.loadTestData();
  }

  async initializeDefaultScenarios() {
    const defaultScenarios: TestScenario[] = [
      {
        id: 'square_rates_test',
        title: 'Square Processing Rates Query',
        description: 'Test external web search for competitor pricing information',
        userQuery: 'What are Square processing rates for restaurants?',
        expectedResponseType: 'web_search',
        expectedKeywords: ['2.6%', '2.9%', 'card present', 'online payments'],
        category: 'pricing',
        priority: 'high',
        status: 'pending'
      },
      {
        id: 'tracerpay_pos_test',
        title: 'TracerPay Restaurant POS Systems',
        description: 'Test internal knowledge base for TracerPay POS recommendations',
        userQuery: 'What POS systems does TracerPay recommend for restaurants?',
        expectedResponseType: 'internal_knowledge',
        expectedKeywords: ['Skytab', 'Clover', 'Tabit', 'HubWallet'],
        category: 'pos_systems',
        priority: 'high',
        status: 'pending'
      },
      {
        id: 'clearent_support_test',
        title: 'Clearent Support Contact',
        description: 'Test internal knowledge for specific processor support information',
        userQuery: 'How do I contact Clearent support?',
        expectedResponseType: 'internal_knowledge',
        expectedKeywords: ['866.435.0666', 'customersupport@clearent.com', 'Option 1'],
        category: 'support',
        priority: 'medium',
        status: 'pending'
      },
      {
        id: 'paypal_rates_test',
        title: 'PayPal Processing Rates',
        description: 'Test web search for non-Tracer processor information',
        userQuery: 'What are current PayPal processing rates?',
        expectedResponseType: 'web_search',
        expectedKeywords: ['2.9%', '3.5%', 'transaction fee'],
        category: 'pricing',
        priority: 'medium',
        status: 'pending'
      },
      {
        id: 'retail_pos_test',
        title: 'Retail POS Recommendations',
        description: 'Test internal knowledge for retail-specific POS systems',
        userQuery: 'What POS systems are best for retail stores?',
        expectedResponseType: 'internal_knowledge',
        expectedKeywords: ['Quantic', 'Clover', 'HubWallet'],
        category: 'pos_systems',
        priority: 'medium',
        status: 'pending'
      },
      {
        id: 'industry_trends_test',
        title: 'Payment Industry Trends',
        description: 'Test hybrid response combining internal knowledge with current industry data',
        userQuery: 'What are the latest trends in payment processing for 2025?',
        expectedResponseType: 'hybrid',
        expectedKeywords: ['contactless', 'mobile', 'security', 'trends'],
        category: 'industry_info',
        priority: 'low',
        status: 'pending'
      },
      {
        id: 'trx_services_test',
        title: 'TRX Specialized Services',
        description: 'Test internal knowledge for specific processor capabilities',
        userQuery: 'What specialized services does TRX offer?',
        expectedResponseType: 'internal_knowledge',
        expectedKeywords: ['high risk', 'high tickets', 'ACH', 'QuickBooks', 'mobile'],
        category: 'processors',
        priority: 'medium',
        status: 'pending'
      },
      {
        id: 'gift_card_options_test',
        title: 'Gift Card Processing Options',
        description: 'Test internal knowledge for gift card solutions',
        userQuery: 'What gift card options are available through Tracer Co Card?',
        expectedResponseType: 'internal_knowledge',
        expectedKeywords: ['Valutec', 'Factor4', 'Shift4', 'Quantic'],
        category: 'processors',
        priority: 'medium',
        status: 'pending'
      }
    ];

    defaultScenarios.forEach(scenario => {
      this.testScenarios.set(scenario.id, scenario);
    });
  }

  async loadTestData() {
    try {
      const scenariosData = await fs.readFile(this.testScenariosFile, 'utf8');
      const scenarios: TestScenario[] = JSON.parse(scenariosData);
      scenarios.forEach(scenario => {
        this.testScenarios.set(scenario.id, scenario);
      });
    } catch (error) {
      console.log('No existing test scenarios file found, using defaults');
    }

    try {
      const resultsData = await fs.readFile(this.testResultsFile, 'utf8');
      this.testResults = JSON.parse(resultsData);
    } catch (error) {
      console.log('No existing test results file found, starting fresh');
    }
  }

  async saveTestData() {
    try {
      await fs.writeFile(
        this.testScenariosFile,
        JSON.stringify(Array.from(this.testScenarios.values()), null, 2)
      );
      await fs.writeFile(
        this.testResultsFile,
        JSON.stringify(this.testResults, null, 2)
      );
    } catch (error) {
      console.error('Failed to save test data:', error);
    }
  }

  async runTestScenario(scenarioId: string): Promise<TestResult> {
    const scenario = this.testScenarios.get(scenarioId);
    if (!scenario) {
      throw new Error(`Test scenario ${scenarioId} not found`);
    }

    console.log(`🧪 Running test scenario: ${scenario.title}`);
    const startTime = Date.now();

    try {
      // Simulate chat API call
      const response = await fetch('http://localhost:5000/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: `Test: ${scenario.title}` })
      });
      
      const chat = await response.json();
      const chatId = chat.id;

      // Send test message
      const messageResponse = await fetch(`http://localhost:5000/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: scenario.userQuery, 
          role: 'user' 
        })
      });

      // Wait for AI response
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get messages
      const messagesResponse = await fetch(`http://localhost:5000/api/chats/${chatId}/messages`);
      const messages = await messagesResponse.json();
      
      const aiMessage = messages.find((m: any) => m.role === 'assistant');
      const responseTime = Date.now() - startTime;

      if (!aiMessage) {
        throw new Error('No AI response generated');
      }

      // Analyze response quality
      const qualityAnalysis = this.analyzeResponseQuality(scenario, aiMessage.content);

      const testResult: TestResult = {
        scenarioId,
        timestamp: new Date(),
        userQuery: scenario.userQuery,
        aiResponse: aiMessage.content,
        responseTime,
        sourceTypes: this.detectSourceTypes(aiMessage.content),
        qualityScore: qualityAnalysis.score,
        passedChecks: qualityAnalysis.passedChecks,
        failedChecks: qualityAnalysis.failedChecks,
        recommendations: qualityAnalysis.recommendations
      };

      // Update scenario status
      scenario.lastTested = new Date();
      scenario.aiResponse = aiMessage.content;
      scenario.responseQuality = qualityAnalysis.score;
      scenario.responseTime = responseTime;
      scenario.status = qualityAnalysis.score >= 7 ? 'passed' : 'needs_review';

      this.testResults.push(testResult);
      await this.saveTestData();

      console.log(`✅ Test completed: ${scenario.title} - Score: ${qualityAnalysis.score}/10`);
      return testResult;

    } catch (error) {
      scenario.status = 'failed';
      scenario.adminNotes = `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      const testResult: TestResult = {
        scenarioId,
        timestamp: new Date(),
        userQuery: scenario.userQuery,
        aiResponse: 'Test failed - no response generated',
        responseTime: Date.now() - startTime,
        sourceTypes: [],
        qualityScore: 0,
        passedChecks: [],
        failedChecks: ['Response generation failed'],
        recommendations: ['Check AI service configuration', 'Verify API connectivity']
      };

      this.testResults.push(testResult);
      await this.saveTestData();
      
      console.error(`❌ Test failed: ${scenario.title} - ${error}`);
      return testResult;
    }
  }

  analyzeResponseQuality(scenario: TestScenario, response: string): {
    score: number;
    passedChecks: string[];
    failedChecks: string[];
    recommendations: string[];
  } {
    const passedChecks: string[] = [];
    const failedChecks: string[] = [];
    const recommendations: string[] = [];
    let score = 0;

    // Check for expected keywords
    const keywordMatches = scenario.expectedKeywords.filter(keyword => 
      response.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (keywordMatches.length >= scenario.expectedKeywords.length * 0.7) {
      passedChecks.push('Contains expected keywords');
      score += 3;
    } else {
      failedChecks.push('Missing key information');
      recommendations.push('Improve knowledge base coverage for this topic');
    }

    // Check response length (should be substantial)
    if (response.length > 200) {
      passedChecks.push('Adequate response length');
      score += 2;
    } else {
      failedChecks.push('Response too brief');
      recommendations.push('Enhance response detail and context');
    }

    // Check for professional tone
    if (!response.includes('I don\'t know') && !response.includes('I\'m not sure')) {
      passedChecks.push('Confident response tone');
      score += 1;
    } else {
      failedChecks.push('Uncertain response tone');
      recommendations.push('Improve confidence through better data sources');
    }

    // Check for Tracer Co Card branding consistency
    if (scenario.category === 'pos_systems' || scenario.category === 'processors') {
      if (response.includes('Tracer') || response.includes('TracerPay')) {
        passedChecks.push('Proper branding');
        score += 1;
      } else {
        failedChecks.push('Missing company branding');
        recommendations.push('Ensure responses reference Tracer Co Card services');
      }
    }

    // Check for actionable information
    if (response.includes('contact') || response.includes('call') || /\d{3}[-.]?\d{3}[-.]?\d{4}/.test(response)) {
      passedChecks.push('Includes actionable information');
      score += 2;
    }

    // Check for competitive positioning (when relevant)
    if (scenario.category === 'pricing' && (response.includes('competitive') || response.includes('savings'))) {
      passedChecks.push('Good competitive positioning');
      score += 1;
    }

    return { score, passedChecks, failedChecks, recommendations };
  }

  detectSourceTypes(response: string): string[] {
    const sources: string[] = [];
    
    if (response.includes('KNOWLEDGE BASE') || response.includes('Tracer Co Card')) {
      sources.push('internal_knowledge');
    }
    
    if (response.includes('WEB INFORMATION') || response.includes('Sources:')) {
      sources.push('web_search');
    }
    
    if (sources.includes('internal_knowledge') && sources.includes('web_search')) {
      sources.push('hybrid');
    }
    
    return sources;
  }

  async runAllTests(): Promise<TestResult[]> {
    console.log('🚀 Running all test scenarios...');
    const results: TestResult[] = [];
    
    const scenarios = Array.from(this.testScenarios.values());
    for (const scenario of scenarios) {
      if (scenario.status !== 'passed' || !scenario.lastTested || 
          (Date.now() - scenario.lastTested.getTime()) > 24 * 60 * 60 * 1000) {
        
        const result = await this.runTestScenario(scenario.id);
        results.push(result);
        
        // Wait between tests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`✅ Testing complete. Ran ${results.length} scenarios.`);
    return results;
  }

  getTestingSummary() {
    const scenarios = Array.from(this.testScenarios.values());
    const recentResults = this.testResults.filter(r => {
      const timestamp = r.timestamp instanceof Date ? r.timestamp : new Date(r.timestamp);
      return Date.now() - timestamp.getTime() < 24 * 60 * 60 * 1000;
    });

    return {
      totalScenarios: scenarios.length,
      passedScenarios: scenarios.filter(s => s.status === 'passed').length,
      failedScenarios: scenarios.filter(s => s.status === 'failed').length,
      needsReview: scenarios.filter(s => s.status === 'needs_review').length,
      averageQuality: recentResults.length > 0 
        ? recentResults.reduce((sum, r) => sum + r.qualityScore, 0) / recentResults.length 
        : 0,
      averageResponseTime: recentResults.length > 0
        ? recentResults.reduce((sum, r) => sum + r.responseTime, 0) / recentResults.length
        : 0,
      lastTestRun: recentResults.length > 0 
        ? Math.max(...recentResults.map(r => {
            const timestamp = r.timestamp instanceof Date ? r.timestamp : new Date(r.timestamp);
            return timestamp.getTime();
          }))
        : null
    };
  }

  getScenarioById(id: string): TestScenario | undefined {
    return this.testScenarios.get(id);
  }

  getAllScenarios(): TestScenario[] {
    return Array.from(this.testScenarios.values());
  }

  getRecentResults(limit = 50): TestResult[] {
    return this.testResults
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
}

export const chatTestingSystem = new ChatTestingSystem();

export function registerChatTestingRoutes(app: Express) {
  // Get testing dashboard overview
  app.get('/api/testing/dashboard', (req: Request, res: Response) => {
    try {
      const summary = chatTestingSystem.getTestingSummary();
      const scenarios = chatTestingSystem.getAllScenarios();
      const recentResults = chatTestingSystem.getRecentResults(10);
      
      res.json({
        summary,
        scenarios,
        recentResults
      });
    } catch (error) {
      console.error('Testing dashboard error:', error);
      res.status(500).json({ error: 'Failed to load testing dashboard' });
    }
  });

  // Run a specific test scenario
  app.post('/api/testing/scenarios/:scenarioId/run', async (req: Request, res: Response) => {
    try {
      const { scenarioId } = req.params;
      const result = await chatTestingSystem.runTestScenario(scenarioId);
      res.json(result);
    } catch (error) {
      console.error('Test scenario run error:', error);
      res.status(500).json({ error: 'Failed to run test scenario' });
    }
  });

  // Run all test scenarios
  app.post('/api/testing/run-all', async (req: Request, res: Response) => {
    try {
      const results = await chatTestingSystem.runAllTests();
      res.json({
        message: `Completed ${results.length} test scenarios`,
        results,
        summary: chatTestingSystem.getTestingSummary()
      });
    } catch (error) {
      console.error('Run all tests error:', error);
      res.status(500).json({ error: 'Failed to run all tests' });
    }
  });

  // Get all test scenarios
  app.get('/api/testing/scenarios', (req: Request, res: Response) => {
    try {
      const scenarios = chatTestingSystem.getAllScenarios();
      res.json(scenarios);
    } catch (error) {
      console.error('Get scenarios error:', error);
      res.status(500).json({ error: 'Failed to get test scenarios' });
    }
  });

  // Get recent test results
  app.get('/api/testing/results', (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const results = chatTestingSystem.getRecentResults(limit);
      res.json(results);
    } catch (error) {
      console.error('Get results error:', error);
      res.status(500).json({ error: 'Failed to get test results' });
    }
  });
}