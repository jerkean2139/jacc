import pdf from 'pdf-parse';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ExtractedStatementData {
  monthlyVolume: number;
  averageTicket: number;
  transactionCount: number;
  businessType: string;
  industry: string;
  transactionBreakdown: {
    creditCardVolume: number;
    debitCardVolume: number;
    keyedVolume: number;
    ecommerceVolume: number;
    cardPresentPercentage: number;
    qualifiedPercentage: number;
    midQualifiedPercentage: number;
    nonQualifiedPercentage: number;
  };
  currentProcessor: {
    name: string;
    qualifiedRate: number;
    midQualifiedRate: number;
    nonQualifiedRate: number;
    debitRate: number;
    authFee: number;
    monthlyFee: number;
    statementFee: number;
    batchFee: number;
    keyedUpcharge: number;
    ecommerceUpcharge: number;
    equipmentLease?: number;
    gatewayFee?: number;
    pciFee?: number;
    regulatoryFee?: number;
  };
  additionalCosts: {
    hardwareCosts: number;
    softwareFees: number;
    supportFees: number;
    installationFees: number;
  };
  statementPeriod: {
    startDate: string;
    endDate: string;
  };
  confidence: number;
}

export class PDFStatementAnalyzer {
  async analyzeStatement(fileBuffer: Buffer): Promise<ExtractedStatementData> {
    try {
      // Extract text from PDF
      const pdfData = await pdf(fileBuffer);
      const extractedText = pdfData.text;

      // Use AI to analyze the extracted text
      const analysisResult = await this.analyzeWithAI(extractedText);
      
      return analysisResult;
    } catch (error) {
      console.error('Error analyzing statement:', error);
      throw new Error('Failed to analyze PDF statement');
    }
  }

  private async analyzeWithAI(statementText: string): Promise<ExtractedStatementData> {
    const prompt = `
You are an expert at analyzing merchant account processing statements from payment processors. Extract the following information from this merchant processing statement and return it as JSON:

REQUIRED FIELDS:
1. monthlyVolume: Total processing volume in dollars
2. averageTicket: Average transaction amount
3. transactionCount: Total number of transactions
4. businessType: Type of business (retail, restaurant, ecommerce, etc.)
5. industry: Industry category
6. transactionBreakdown:
   - creditCardVolume: Credit card processing volume
   - debitCardVolume: Debit card processing volume  
   - keyedVolume: Manually keyed transaction volume
   - ecommerceVolume: Online/ecommerce volume
   - cardPresentPercentage: Percentage of card-present transactions
   - qualifiedPercentage: Percentage of qualified transactions
   - midQualifiedPercentage: Percentage of mid-qualified transactions
   - nonQualifiedPercentage: Percentage of non-qualified transactions
7. currentProcessor:
   - name: Current processor name
   - qualifiedRate: Qualified transaction rate (as decimal, e.g., 0.0189 for 1.89%)
   - midQualifiedRate: Mid-qualified rate
   - nonQualifiedRate: Non-qualified rate
   - debitRate: Debit card rate
   - authFee: Authorization fee per transaction
   - monthlyFee: Monthly service fee
   - statementFee: Statement fee
   - batchFee: Batch fee
   - keyedUpcharge: Additional fee for keyed transactions
   - ecommerceUpcharge: Additional fee for ecommerce
   - equipmentLease: Equipment lease cost (optional)
   - gatewayFee: Gateway fee (optional)
   - pciFee: PCI compliance fee (optional)
   - regulatoryFee: Regulatory fee (optional)
8. additionalCosts:
   - hardwareCosts: One-time hardware costs
   - softwareFees: Software fees
   - supportFees: Support fees
   - installationFees: Installation fees
9. statementPeriod:
   - startDate: Statement start date (YYYY-MM-DD)
   - endDate: Statement end date (YYYY-MM-DD)
10. confidence: Your confidence level in the extraction (0-1)

Look for these common processor names and fee patterns:
- Processors: Square, Stripe, PayPal, First Data, Worldpay, Chase Paymentech, Bank of America, Wells Fargo Merchant Services, Elavon, Heartland, Global Payments, TSYS, Fiserv, Clover, Toast, Aloha
- Rate structures: Interchange Plus, Tiered Pricing (Qualified/Mid-Qualified/Non-Qualified), Flat Rate, Subscription
- Common fees: Discount rate, Transaction fee, Monthly fee, Statement fee, Batch fee, Gateway fee, PCI compliance fee, Early termination fee, Chargeback fee
- Equipment: Terminal lease, POS system lease, Gateway fees
- Card types: Visa/MC Credit, Visa/MC Debit, AMEX, Discover, PIN Debit

If specific data cannot be found, make reasonable estimates based on industry standards but lower the confidence score accordingly.

Statement Text:
${statementText}

Return only valid JSON with all required fields:`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert merchant services analyst. Extract data from processing statements and return valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      });

      const jsonResponse = response.choices[0].message.content;
      if (!jsonResponse) {
        throw new Error('No response from AI analysis');
      }

      const parsedData = JSON.parse(jsonResponse);
      
      // Validate and sanitize the response
      return this.validateAndSanitizeData(parsedData);
    } catch (error) {
      console.error('AI analysis error:', error);
      throw new Error('Failed to analyze statement with AI');
    }
  }

  private validateAndSanitizeData(data: any): ExtractedStatementData {
    // Provide defaults for missing or invalid data
    const sanitized: ExtractedStatementData = {
      monthlyVolume: this.sanitizeNumber(data.monthlyVolume, 0),
      averageTicket: this.sanitizeNumber(data.averageTicket, 0),
      transactionCount: this.sanitizeNumber(data.transactionCount, 0),
      businessType: data.businessType || 'retail',
      industry: data.industry || 'general_retail',
      transactionBreakdown: {
        creditCardVolume: this.sanitizeNumber(data.transactionBreakdown?.creditCardVolume, 0),
        debitCardVolume: this.sanitizeNumber(data.transactionBreakdown?.debitCardVolume, 0),
        keyedVolume: this.sanitizeNumber(data.transactionBreakdown?.keyedVolume, 0),
        ecommerceVolume: this.sanitizeNumber(data.transactionBreakdown?.ecommerceVolume, 0),
        cardPresentPercentage: this.sanitizeNumber(data.transactionBreakdown?.cardPresentPercentage, 90),
        qualifiedPercentage: this.sanitizeNumber(data.transactionBreakdown?.qualifiedPercentage, 70),
        midQualifiedPercentage: this.sanitizeNumber(data.transactionBreakdown?.midQualifiedPercentage, 20),
        nonQualifiedPercentage: this.sanitizeNumber(data.transactionBreakdown?.nonQualifiedPercentage, 10)
      },
      currentProcessor: {
        name: data.currentProcessor?.name || 'Unknown Processor',
        qualifiedRate: this.sanitizeRate(data.currentProcessor?.qualifiedRate, 0.0289),
        midQualifiedRate: this.sanitizeRate(data.currentProcessor?.midQualifiedRate, 0.0325),
        nonQualifiedRate: this.sanitizeRate(data.currentProcessor?.nonQualifiedRate, 0.0389),
        debitRate: this.sanitizeRate(data.currentProcessor?.debitRate, 0.0095),
        authFee: this.sanitizeNumber(data.currentProcessor?.authFee, 0.15),
        monthlyFee: this.sanitizeNumber(data.currentProcessor?.monthlyFee, 25),
        statementFee: this.sanitizeNumber(data.currentProcessor?.statementFee, 10),
        batchFee: this.sanitizeNumber(data.currentProcessor?.batchFee, 0.25),
        keyedUpcharge: this.sanitizeNumber(data.currentProcessor?.keyedUpcharge, 0.20),
        ecommerceUpcharge: this.sanitizeNumber(data.currentProcessor?.ecommerceUpcharge, 0.10),
        equipmentLease: this.sanitizeNumber(data.currentProcessor?.equipmentLease, 0),
        gatewayFee: this.sanitizeNumber(data.currentProcessor?.gatewayFee, 0),
        pciFee: this.sanitizeNumber(data.currentProcessor?.pciFee, 0),
        regulatoryFee: this.sanitizeNumber(data.currentProcessor?.regulatoryFee, 0)
      },
      additionalCosts: {
        hardwareCosts: this.sanitizeNumber(data.additionalCosts?.hardwareCosts, 0),
        softwareFees: this.sanitizeNumber(data.additionalCosts?.softwareFees, 0),
        supportFees: this.sanitizeNumber(data.additionalCosts?.supportFees, 0),
        installationFees: this.sanitizeNumber(data.additionalCosts?.installationFees, 0)
      },
      statementPeriod: {
        startDate: data.statementPeriod?.startDate || new Date().toISOString().split('T')[0],
        endDate: data.statementPeriod?.endDate || new Date().toISOString().split('T')[0]
      },
      confidence: Math.max(0, Math.min(1, data.confidence || 0.7))
    };

    return sanitized;
  }

  private sanitizeNumber(value: any, defaultValue: number): number {
    const num = parseFloat(value);
    return isNaN(num) ? defaultValue : Math.max(0, num);
  }

  private sanitizeRate(value: any, defaultValue: number): number {
    const rate = parseFloat(value);
    if (isNaN(rate)) return defaultValue;
    
    // Convert percentage to decimal if needed (e.g., 2.89 -> 0.0289)
    if (rate > 1) {
      return rate / 100;
    }
    
    return Math.max(0, Math.min(1, rate));
  }

  // Method to extract key insights from statement
  async generateStatementInsights(extractedData: ExtractedStatementData): Promise<string[]> {
    const insights: string[] = [];

    // Calculate effective rate
    const totalVolume = extractedData.monthlyVolume;
    const currentRates = extractedData.currentProcessor;
    const breakdown = extractedData.transactionBreakdown;

    if (totalVolume > 0) {
      const weightedRate = (
        (currentRates.qualifiedRate * breakdown.qualifiedPercentage / 100) +
        (currentRates.midQualifiedRate * breakdown.midQualifiedPercentage / 100) +
        (currentRates.nonQualifiedRate * breakdown.nonQualifiedPercentage / 100)
      );

      insights.push(`Effective processing rate: ${(weightedRate * 100).toFixed(2)}%`);
      
      if (weightedRate > 0.035) {
        insights.push('Processing rates appear high - potential for significant savings');
      }
      
      if (currentRates.monthlyFee > 30) {
        insights.push('Monthly fees are above average - consider processors with lower base fees');
      }

      if (breakdown.nonQualifiedPercentage > 15) {
        insights.push('High percentage of non-qualified transactions - optimization opportunity');
      }

      if (currentRates.equipmentLease && currentRates.equipmentLease > 50) {
        insights.push('Equipment lease costs are significant - consider purchasing terminals');
      }
    }

    return insights;
  }
}

export const pdfStatementAnalyzer = new PDFStatementAnalyzer();