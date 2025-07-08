# Document Link Formatting Instructions

## HTML Card Style for Document Links
Replace markdown document links with professional HTML card styling:

```html
<div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 8px 0; background: #f8fafc;">
  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
    <div style="flex: 1;">
      <h4 style="margin: 0 0 4px 0; color: #1e293b; font-size: 14px; font-weight: 600;">Document Title</h4>
      <p style="margin: 0; color: #64748b; font-size: 12px; line-height: 1.4;">Content preview or description</p>
    </div>
    <span style="background: #e2e8f0; color: #64748b; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 500; margin-left: 12px;">PDF/DOC/etc</span>
  </div>
  <div style="display: flex; gap: 8px; margin-top: 12px;">
    <a href="/api/documents/[id]/view" style="background: #3b82f6; color: white; padding: 6px 12px; border-radius: 4px; text-decoration: none; font-size: 12px; font-weight: 500;">View Document</a>
    <a href="/api/documents/[id]/download" style="background: #6b7280; color: white; padding: 6px 12px; border-radius: 4px; text-decoration: none; font-size: 12px; font-weight: 500;">Download</a>
  </div>
</div>
```

## Replacement Rules
- Replace all markdown links: `[Document Name](url)` 
- Use actual document ID in href attributes
- Include document type indicator (PDF, DOC, etc.)
- Add content preview when available
- Use consistent blue/gray button styling

## Document ID Format
- Regular documents: `/api/documents/{uuid}/view`
- FAQ documents: `/api/documents/faq-{id}/view`

## Error Handling
- If document ID is invalid, show document name without link
- If document type unknown, use "DOC" as default
- Always include View and Download buttons for consistency