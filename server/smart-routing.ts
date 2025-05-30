import { db } from "./db";
import { folders } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface FolderRoute {
  namespace: string;
  priority: number;
  folderType: string;
  confidence: number;
}

export interface QueryClassification {
  intent: 'processor_info' | 'gateway_info' | 'hardware_info' | 'sales_material' | 'rate_comparison' | 'general';
  processors: string[];
  gateways: string[];
  hardwareTypes: string[];
  confidence: number;
  suggestedNamespaces: string[];
}

export class SmartRoutingService {
  private processorKeywords = {
    'tsys': ['tsys', 'total system services', 'total systems', 'ts', 'merchant services'],
    'clearent': ['clearent', 'clearant', 'clear', 'ent'],
    'shift4': ['shift4', 'shift 4', 'shift four', 'shift'],
    'first_data': ['first data', 'firstdata', 'fd', 'fiserv'],
    'worldpay': ['worldpay', 'world pay', 'wp'],
    'square': ['square', 'sqr'],
    'stripe': ['stripe', 'payment processing'],
    'chase': ['chase paymentech', 'chase', 'paymentech'],
  };

  private gatewayKeywords = {
    'authorize_net': ['authorize.net', 'authnet', 'authorize net', 'auth net'],
    'stripe': ['stripe gateway', 'stripe api'],
    'paypal': ['paypal', 'pay pal', 'pp'],
    'square': ['square api', 'square gateway'],
    'braintree': ['braintree', 'brain tree'],
  };

  private hardwareKeywords = {
    'terminals': ['terminal', 'pos', 'point of sale', 'credit card reader', 'chip reader'],
    'mobile': ['mobile reader', 'mobile payment', 'smartphone', 'tablet'],
    'online': ['virtual terminal', 'online payment', 'e-commerce', 'web payment'],
    'pinpad': ['pin pad', 'pinpad', 'pin entry'],
  };

  private salesKeywords = {
    'presentations': ['presentation', 'pitch', 'proposal', 'deck', 'slides'],
    'comparisons': ['comparison', 'compare', 'vs', 'versus', 'rates'],
    'pricing': ['pricing', 'cost', 'fee', 'rate', 'price'],
    'contracts': ['contract', 'agreement', 'terms', 'conditions'],
  };

  async classifyQuery(query: string): Promise<QueryClassification> {
    const lowerQuery = query.toLowerCase();
    const classification: QueryClassification = {
      intent: 'general',
      processors: [],
      gateways: [],
      hardwareTypes: [],
      confidence: 0,
      suggestedNamespaces: [],
    };

    // Check for processor mentions
    for (const [processor, keywords] of Object.entries(this.processorKeywords)) {
      if (keywords.some(keyword => lowerQuery.includes(keyword))) {
        classification.processors.push(processor);
        classification.suggestedNamespaces.push(`processors/${processor}`);
      }
    }

    // Check for gateway mentions
    for (const [gateway, keywords] of Object.entries(this.gatewayKeywords)) {
      if (keywords.some(keyword => lowerQuery.includes(keyword))) {
        classification.gateways.push(gateway);
        classification.suggestedNamespaces.push(`gateways/${gateway}`);
      }
    }

    // Check for hardware mentions
    for (const [hardware, keywords] of Object.entries(this.hardwareKeywords)) {
      if (keywords.some(keyword => lowerQuery.includes(keyword))) {
        classification.hardwareTypes.push(hardware);
        classification.suggestedNamespaces.push(`hardware/${hardware}`);
      }
    }

    // Check for sales material mentions
    for (const [material, keywords] of Object.entries(this.salesKeywords)) {
      if (keywords.some(keyword => lowerQuery.includes(keyword))) {
        classification.suggestedNamespaces.push(`sales/${material}`);
      }
    }

    // Determine primary intent
    if (classification.processors.length > 0) {
      classification.intent = 'processor_info';
      classification.confidence = 0.8;
    } else if (classification.gateways.length > 0) {
      classification.intent = 'gateway_info';
      classification.confidence = 0.8;
    } else if (classification.hardwareTypes.length > 0) {
      classification.intent = 'hardware_info';
      classification.confidence = 0.8;
    } else if (lowerQuery.includes('rate') || lowerQuery.includes('pricing') || lowerQuery.includes('cost')) {
      classification.intent = 'rate_comparison';
      classification.confidence = 0.7;
      classification.suggestedNamespaces.push('sales/pricing', 'processors/rates');
    } else if (lowerQuery.includes('presentation') || lowerQuery.includes('proposal')) {
      classification.intent = 'sales_material';
      classification.confidence = 0.7;
      classification.suggestedNamespaces.push('sales/presentations');
    }

    // If no specific matches, add general namespaces
    if (classification.suggestedNamespaces.length === 0) {
      classification.suggestedNamespaces = ['default', 'general'];
    }

    return classification;
  }

  async getFolderRoutes(userId: string, classification: QueryClassification): Promise<FolderRoute[]> {
    const userFolders = await db
      .select()
      .from(folders)
      .where(eq(folders.userId, userId));

    const routes: FolderRoute[] = [];

    // Map classification to actual folder namespaces
    for (const namespace of classification.suggestedNamespaces) {
      const matchingFolder = userFolders.find(f => 
        f.vectorNamespace === namespace || 
        f.vectorNamespace.includes(namespace.split('/')[1] || '')
      );

      if (matchingFolder) {
        routes.push({
          namespace: matchingFolder.vectorNamespace,
          priority: matchingFolder.priority || 50,
          folderType: matchingFolder.folderType || 'custom',
          confidence: classification.confidence,
        });
      } else {
        // Add namespace even if folder doesn't exist yet
        routes.push({
          namespace: namespace,
          priority: 50,
          folderType: namespace.split('/')[0] || 'custom',
          confidence: classification.confidence * 0.8, // Lower confidence for non-existing folders
        });
      }
    }

    // Sort by priority and confidence
    return routes.sort((a, b) => {
      const scoreA = (a.priority / 100) * a.confidence;
      const scoreB = (b.priority / 100) * b.confidence;
      return scoreB - scoreA;
    });
  }

  async initializeDefaultFolders(userId: string): Promise<void> {
    // Check if folders already exist for this user
    const existingFolders = await db
      .select()
      .from(folders)
      .where(eq(folders.userId, userId));

    if (existingFolders.length > 0) {
      console.log(`✅ Chat organization folders already exist for user ${userId} (${existingFolders.length} folders)`);
      return;
    }

    const defaultFolders = [
      // Processors
      { name: 'TSYS', namespace: 'processors/tsys', type: 'processor', priority: 90 },
      { name: 'Clearent', namespace: 'processors/clearent', type: 'processor', priority: 85 },
      { name: 'Shift4', namespace: 'processors/shift4', type: 'processor', priority: 80 },
      { name: 'First Data', namespace: 'processors/first_data', type: 'processor', priority: 75 },
      
      // Gateways
      { name: 'Authorize.Net', namespace: 'gateways/authorize_net', type: 'gateway', priority: 70 },
      { name: 'Stripe Gateway', namespace: 'gateways/stripe', type: 'gateway', priority: 65 },
      { name: 'PayPal', namespace: 'gateways/paypal', type: 'gateway', priority: 60 },
      
      // Hardware
      { name: 'Terminals', namespace: 'hardware/terminals', type: 'hardware', priority: 55 },
      { name: 'Mobile Readers', namespace: 'hardware/mobile', type: 'hardware', priority: 50 },
      { name: 'Online/Virtual', namespace: 'hardware/online', type: 'hardware', priority: 45 },
      
      // Sales Materials
      { name: 'Presentations', namespace: 'sales/presentations', type: 'sales', priority: 70 },
      { name: 'Rate Comparisons', namespace: 'sales/comparisons', type: 'sales', priority: 65 },
      { name: 'Pricing Sheets', namespace: 'sales/pricing', type: 'sales', priority: 60 },
      { name: 'Contracts', namespace: 'sales/contracts', type: 'sales', priority: 55 },
    ];

    // Create folders one by one with proper error handling
    let createdCount = 0;
    for (const folder of defaultFolders) {
      try {
        const [newFolder] = await db.insert(folders).values({
          name: folder.name,
          userId: userId,
          vectorNamespace: folder.namespace,
          folderType: folder.type,
          priority: folder.priority,
          color: this.getFolderColor(folder.type),
        }).returning();
        
        if (newFolder) {
          createdCount++;
        }
      } catch (error) {
        console.log(`Skipping existing folder: ${folder.name}`);
      }
    }

    console.log(`✅ Created ${createdCount} chat organization folders for user ${userId}`);
  }

  private getFolderColor(type: string): string {
    const colorMap: Record<string, string> = {
      processor: 'blue',
      gateway: 'green',
      hardware: 'yellow',
      sales: 'purple',
      custom: 'gray',
    };
    return colorMap[type] || 'gray';
  }
}

export const smartRoutingService = new SmartRoutingService();