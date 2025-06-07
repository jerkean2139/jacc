import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MessageCircle, 
  Calculator, 
  BookOpen, 
  Phone,
  DollarSign,
  Users,
  Settings,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

export default function HelpPage() {
  const quickAnswers = [
    {
      question: "What POS is best for restaurants?",
      answer: "Shift4 (SkyTab), MiCamp, HubWallet"
    },
    {
      question: "Who offers mobile processing?",
      answer: "TRX, Clearent, MiCamp"
    },
    {
      question: "What are Quantic fees?",
      answer: "Rep quotes processing rates, Quantic quotes hardware"
    },
    {
      question: "QuickBooks integration options?",
      answer: "TRX and Clearent through Hyfin"
    },
    {
      question: "Who offers gift cards?",
      answer: "Valutec, Factor4, Shift4, Quantic"
    },
    {
      question: "SwipeSimple pricing?",
      answer: "$20 monthly"
    }
  ];

  const supportContacts = [
    { name: "Clearent", number: "866.435.0666 Option 1" },
    { name: "TRX", number: "888-933-8797 Option 2" },
    { name: "TSYS", number: "877-608-6599" },
    { name: "Shift4", number: "800-201-0461 Option 1" },
    { name: "Merchant Lynx", number: "844-200-8996 Option 2" }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Help & Quick Reference</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Instant answers to common merchant services questions
          </p>
        </div>

        {/* Quick Answers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-blue-600" />
              Common Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickAnswers.map((qa, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <h3 className="font-medium text-sm mb-2">{qa.question}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{qa.answer}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Support Contacts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-green-600" />
              Support Numbers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {supportContacts.map((contact, index) => (
                <div key={index} className="flex justify-between items-center p-3 border rounded">
                  <span className="font-medium">{contact.name}</span>
                  <a 
                    href={`tel:${contact.number.replace(/[^0-9]/g, '')}`}
                    className="text-blue-600 hover:text-blue-800 font-mono text-sm"
                  >
                    {contact.number}
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* How to Use JACC */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-purple-600" />
              How to Use JACC
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <h3 className="font-medium mb-2">Ask Questions</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Start conversations to get instant answers about vendors, pricing, and integrations
                </p>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <Calculator className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <h3 className="font-medium mb-2">Use Calculator</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Calculate processing rates and compare different vendor options
                </p>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <BookOpen className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                <h3 className="font-medium mb-2">Browse Guides</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Access comprehensive documentation and training materials
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vendor Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" />
              Vendor Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Badge variant="outline" className="p-2 justify-center">Restaurant POS</Badge>
              <Badge variant="outline" className="p-2 justify-center">Retail POS</Badge>
              <Badge variant="outline" className="p-2 justify-center">Mobile Processing</Badge>
              <Badge variant="outline" className="p-2 justify-center">High Risk</Badge>
              <Badge variant="outline" className="p-2 justify-center">Gift Cards</Badge>
              <Badge variant="outline" className="p-2 justify-center">ACH Services</Badge>
              <Badge variant="outline" className="p-2 justify-center">Integrations</Badge>
              <Badge variant="outline" className="p-2 justify-center">Hardware</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-600" />
              Need More Help?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              For complex questions or escalations, contact your manager or use the chat system to get personalized assistance.
            </p>
            <Button className="w-full md:w-auto">
              <MessageCircle className="h-4 w-4 mr-2" />
              Start New Chat
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}