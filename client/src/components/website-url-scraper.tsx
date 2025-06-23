import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  Globe, 
  Download, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Clock,
  Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WebsiteURLScraperProps {
  onScrapeComplete: (files: File[]) => void;
}

interface ScrapeResult {
  title: string;
  content: string;
  markdownContent: string;
  summary: string;
  bulletPoints: string[];
  sourceUrl: string;
  scrapedAt: string;
  wordCount: number;
}

export default function WebsiteURLScraper({ onScrapeComplete }: WebsiteURLScraperProps) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [scrapeResult, setScrapeResult] = useState<ScrapeResult | null>(null);
  const [customFileName, setCustomFileName] = useState("");
  const { toast } = useToast();

  const handleScrapeWebsite = async () => {
    if (!url.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a valid website URL to scrape",
        variant: "destructive",
      });
      return;
    }

    // Fix URL format if needed
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    // Basic URL validation
    try {
      new URL(formattedUrl);
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL starting with http:// or https://",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/scrape-website', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ url: formattedUrl }),
      });

      if (!response.ok) {
        throw new Error(`Scraping failed: ${response.status}`);
      }

      const result = await response.json();
      setScrapeResult(result);
      
      // Auto-generate filename from title
      const sanitizedTitle = result.title
        .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .toLowerCase()
        .substring(0, 50); // Limit length
      
      setCustomFileName(sanitizedTitle || 'scraped-website');

      toast({
        title: "Website Scraped Successfully",
        description: `Extracted ${result.wordCount} words from ${result.title}`,
      });
    } catch (error: any) {
      toast({
        title: "Scraping Failed",
        description: error.message || "Failed to scrape website. Please check the URL and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDocument = () => {
    if (!scrapeResult) return;

    const fileName = (customFileName || 'scraped-website').trim() + '.md';
    
    // Create markdown content with metadata
    const markdownContent = `# ${scrapeResult.title}

**Source URL:** ${scrapeResult.sourceUrl}  
**Scraped:** ${new Date(scrapeResult.scrapedAt).toLocaleString()}  
**Word Count:** ${scrapeResult.wordCount}

## Summary

${scrapeResult.summary}

## Key Points

${scrapeResult.bulletPoints.map(point => `- ${point}`).join('\n')}

## Full Content

${scrapeResult.markdownContent}

---
*This document was automatically generated from web content. Source: [${scrapeResult.sourceUrl}](${scrapeResult.sourceUrl})*
`;

    // Create a File object from the markdown content
    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const file = new File([blob], fileName, { type: 'text/markdown' });

    // Pass the file to the parent component
    onScrapeComplete([file]);

    toast({
      title: "Document Created",
      description: `Created ${fileName} ready for folder assignment`,
    });
  };

  const handleReset = () => {
    setUrl("");
    setScrapeResult(null);
    setCustomFileName("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Website URL Scraper
        </CardTitle>
        <CardDescription>
          Extract content from websites and convert to searchable markdown documents
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!scrapeResult ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="website-url">Website URL</Label>
              <div className="flex flex-col md:flex-row gap-2">
                <Input
                  id="website-url"
                  type="url"
                  placeholder="https://shift4.zendesk.com/hc/en-us"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full md:flex-1"
                />
                <Button 
                  onClick={handleScrapeWebsite}
                  disabled={isLoading}
                  className="w-full md:min-w-[120px] md:w-auto"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Scraping...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Scrape Website
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="text-sm text-gray-600 space-y-1">
              <p className="font-medium">What this tool does:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Extracts all text content from the webpage</li>
                <li>Converts HTML to clean markdown format</li>
                <li>Generates summary and key bullet points</li>
                <li>Creates searchable document with source links</li>
                <li>Stores as .md file for easy AI retrieval</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Scrape Results */}
            <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h3 className="font-medium text-green-800 dark:text-green-200">
                  Content Successfully Scraped
                </h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">Title</p>
                  <p className="text-sm text-green-600 dark:text-green-400">{scrapeResult.title}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">Word Count</p>
                  <p className="text-sm text-green-600 dark:text-green-400">{scrapeResult.wordCount} words</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">Summary</p>
                  <p className="text-sm text-green-600 dark:text-green-400 bg-white dark:bg-gray-800 p-2 rounded">
                    {scrapeResult.summary}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">Key Points</p>
                  <ul className="text-sm text-green-600 dark:text-green-400 space-y-1">
                    {scrapeResult.bulletPoints.slice(0, 3).map((point, index) => (
                      <li key={index} className="flex items-start gap-1">
                        <span className="text-green-500 mt-0.5">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                    {scrapeResult.bulletPoints.length > 3 && (
                      <li className="text-xs text-green-500">
                        ...and {scrapeResult.bulletPoints.length - 3} more points
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* File Naming */}
            <div className="space-y-2">
              <Label htmlFor="custom-filename">Document Name</Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="custom-filename"
                  value={customFileName}
                  onChange={(e) => setCustomFileName(e.target.value)}
                  placeholder="Enter document name"
                  className="flex-1"
                />
                <Badge variant="outline">.md</Badge>
              </div>
              <p className="text-xs text-gray-500">
                This will be saved as a markdown file with source link and metadata
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button 
                onClick={handleCreateDocument}
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-2" />
                Create Document
              </Button>
              <Button 
                variant="outline"
                onClick={handleReset}
              >
                Reset
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}