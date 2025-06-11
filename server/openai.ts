import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  message: string;
  suggestions?: string[];
  actions?: Array<{
    type: 'save_to_folder' | 'download' | 'create_proposal' | 'find_documents';
    label: string;
    data?: any;
  }>;
}

export async function generateChatResponse(
  messages: ChatMessage[],
  context?: {
    userRole?: string;
    documents?: Array<{ name: string; content?: string }>;
    spreadsheetData?: any;
  }
): Promise<AIResponse> {
  try {
    const systemPrompt = `You are JACC, an expert AI assistant for merchant services sales agents with advanced document analysis capabilities. You excel at:

CORE CAPABILITIES:
- Analyzing merchant statements, contracts, and business documents
- Processing payment data, transaction reports, and rate comparisons
- Extracting key information from uploaded files and documents
- Calculating processing costs, savings opportunities, and rate optimizations
- Generating merchant proposals and competitive analysis reports
- Providing instant insights from complex financial documents

MERCHANT SERVICES EXPERTISE:
- Credit card processing solutions and payment gateway comparisons
- Point-of-sale systems (SkyTab, Clover, terminals) and equipment recommendations
- Cash discounting programs and surcharge implementations
- Merchant account applications and underwriting requirements
- Industry-specific processing solutions and rate structures

DOCUMENT ANALYSIS POWERS:
- Instantly analyze merchant statements to identify cost-saving opportunities
- Extract transaction data and calculate effective processing rates
- Compare current processing costs with competitive alternatives
- Generate detailed savings projections and ROI calculations
- Create professional merchant proposals from analyzed data

RESPONSE STYLE:
- Direct, actionable insights with specific recommendations
- Professional tone with merchant services expertise
- Focus on helping businesses reduce processing costs
- Provide concrete next steps and implementation guidance

User context: ${context?.userRole || 'Merchant Services Sales Agent'}
Available documents: ${context?.documents?.map(d => d.name).join(', ') || 'Extensive merchant services documentation'}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      temperature: 0.3,
      max_tokens: 300,
    });

    const content = response.choices[0].message.content || "";
    
    // Parse response for potential actions
    const actions = [];
    if (content.toLowerCase().includes('save') || content.toLowerCase().includes('folder')) {
      actions.push({
        type: 'save_to_folder' as const,
        label: 'Save to Folder',
        data: { content }
      });
    }
    if (content.toLowerCase().includes('download') || content.toLowerCase().includes('comparison')) {
      actions.push({
        type: 'download' as const,
        label: 'Download Comparison',
        data: { content }
      });
    }
    if (content.toLowerCase().includes('proposal') || content.toLowerCase().includes('client')) {
      actions.push({
        type: 'create_proposal' as const,
        label: 'Create Client Proposal',
        data: { content }
      });
    }

    return {
      message: content,
      actions: actions.length > 0 ? actions : undefined,
      suggestions: [
        "Show me rate comparisons",
        "Find Medicare documents",
        "Create a client proposal",
        "Calculate savings projections"
      ]
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to generate AI response. Please check your OpenAI API key and try again.");
  }
}

export async function analyzeDocument(
  base64Content: string,
  mimeType: string,
  fileName: string
): Promise<string> {
  try {
    if (mimeType.startsWith('image/')) {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this insurance-related document or image. Extract key information like rates, terms, coverage details, or client information that would be useful for a sales agent."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Content}`
                }
              }
            ],
          },
        ],
        max_tokens: 500,
      });

      return response.choices[0].message.content || "Unable to analyze image content.";
    } else {
      // For non-image files, we'd need to extract text content first
      // This would require additional libraries for PDF parsing, etc.
      return `Document "${fileName}" uploaded successfully. Content analysis requires additional text extraction capabilities.`;
    }
  } catch (error) {
    console.error("Document analysis error:", error);
    return `Unable to analyze document "${fileName}". Please try again.`;
  }
}

export async function generateTitle(content: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Generate a short, descriptive title (max 6 words) for this conversation based on the content. Focus on the main topic or request."
        },
        {
          role: "user",
          content: `Generate a title for this conversation content: ${content.substring(0, 200)}...`
        }
      ],
      max_tokens: 20,
      temperature: 0.5,
    });

    return response.choices[0].message.content?.trim() || "New Chat";
  } catch (error) {
    console.error("Title generation error:", error);
    return "New Chat";
  }
}
