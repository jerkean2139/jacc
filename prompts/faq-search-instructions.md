# FAQ Knowledge Base Search Instructions

## Search Priority
FAQ Knowledge Base should be searched FIRST before document center or web search.

## FAQ Processors
When asked about processors, always reference Tracer Co Card's actual processor partners:
- TracerPay/Accept Blue (primary partner)
- Clearent
- MiCamp  
- TRX
- Quantic
- Shift4

## Search Function
```typescript
async searchFAQKnowledgeBase(query: string, limit: number = 5): Promise<FAQResult[]>
```

## Key Terms for FAQ Search
- "processor" → Tracer Co Card processor partners
- "rates" → Processing rates and fee structures
- "equipment" → POS terminals and hardware
- "setup" → Merchant account setup process
- "cash discount" → Cash discounting programs
- "compliance" → Regulatory requirements

## Relevance Scoring
- Exact keyword matches: 10+ points
- Partial matches: 5-9 points
- Related terms: 1-4 points
- Return results with score ≥ 3

## Error Handling
If FAQ search returns no results:
1. Try broader search terms
2. Fall back to document center search
3. Use web search as last resort with disclaimer

## Response Format
When using FAQ results:
```
"Based on our knowledge base: [FAQ answer]

Source: FAQ Knowledge Base"
```