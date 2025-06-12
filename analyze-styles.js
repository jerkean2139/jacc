const https = require('https');

https.get('https://content-craft-ai-keanonbiz.replit.app/', (res) => {
  let html = '';
  res.on('data', chunk => html += chunk);
  res.on('end', () => {
    // Extract CSS and styling information
    const styleMatches = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];
    const cssLinks = html.match(/<link[^>]*rel[^>]*stylesheet[^>]*>/gi) || [];
    const inlineStyles = html.match(/style="[^"]*"/gi) || [];
    
    console.log('=== CSS LINKS ===');
    cssLinks.forEach(link => console.log(link));
    
    console.log('\n=== INLINE STYLES ===');
    styleMatches.forEach(style => console.log(style));
    
    // Extract Tailwind/CSS classes for colors and backgrounds
    const classMatches = html.match(/class="[^"]*"/gi) || [];
    const colorClasses = new Set();
    
    classMatches.forEach(classAttr => {
      const classes = classAttr.match(/(?:bg-|text-|border-|from-|to-|via-)[^\s"]+/g) || [];
      classes.forEach(cls => colorClasses.add(cls));
    });
    
    console.log('\n=== COLOR CLASSES ===');
    [...colorClasses].sort().forEach(cls => console.log(cls));
    
    // Extract any custom CSS variables
    const cssVars = html.match(/--[a-zA-Z-]+:\s*[^;]+/g) || [];
    console.log('\n=== CSS VARIABLES ===');
    cssVars.forEach(v => console.log(v));
  });
}).on('error', err => console.error('Error:', err));