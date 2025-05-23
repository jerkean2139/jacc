import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, FileText, Calculator, Users, Settings, User, Crown } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  // Development login functions (REMOVE BEFORE PRODUCTION)
  const handleDevLogin = async (userType: 'admin' | 'client-admin' | 'client-user') => {
    try {
      const response = await fetch(`/api/dev/login/${userType}`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        window.location.reload();
      } else {
        console.error('Dev login failed');
      }
    } catch (error) {
      console.error('Dev login error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">JACC</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">AI Sales Assistant</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* Development Login Buttons (REMOVE BEFORE PRODUCTION) */}
            {process.env.NODE_ENV === 'development' && (
              <>
                <Button 
                  onClick={() => handleDevLogin('admin')} 
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  <Crown className="w-3 h-3 mr-1" />
                  Dev Admin
                </Button>
                <Button 
                  onClick={() => handleDevLogin('client-admin')} 
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  <Settings className="w-3 h-3 mr-1" />
                  Client Admin
                </Button>
                <Button 
                  onClick={() => handleDevLogin('client-user')} 
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  <User className="w-3 h-3 mr-1" />
                  Sales Agent
                </Button>
              </>
            )}
            <Button onClick={handleLogin} className="navy-primary text-white hover:opacity-90">
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6">
            Your AI-Powered
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-500">
              Sales Assistant
            </span>
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto mb-8">
            JACC centralizes documents, answers repetitive questions, compares pricing data, 
            and includes conversational features to empower independent sales agents.
          </p>
          <Button 
            onClick={handleLogin} 
            size="lg" 
            className="navy-primary text-white text-lg px-8 py-3 hover:opacity-90"
          >
            Get Started
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <MessageSquare className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <CardTitle className="text-lg">AI Chat Interface</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 dark:text-slate-400">
                ChatGPT-style interface with voice support for natural conversations about insurance products.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <FileText className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <CardTitle className="text-lg">Document Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 dark:text-slate-400">
                Organize documents in folders, upload PDFs and images, and get instant AI-powered insights.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Calculator className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <CardTitle className="text-lg">Rate Comparisons</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 dark:text-slate-400">
                Execute rate comparisons and savings projections using dynamic Google Sheets data.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="w-12 h-12 text-orange-600 mx-auto mb-4" />
              <CardTitle className="text-lg">Client Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 dark:text-slate-400">
                Create client proposals, access FAQ database, and get personalized recommendations.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Key Benefits */}
        <div className="text-center">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">
            Why Sales Agents Choose JACC
          </h3>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div>
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">3x</span>
              </div>
              <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Faster Response Times</h4>
              <p className="text-slate-600 dark:text-slate-400">
                Get instant answers to client questions without waiting for manager approval.
              </p>
            </div>
            
            <div>
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-500">100%</span>
              </div>
              <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Accurate Calculations</h4>
              <p className="text-slate-600 dark:text-slate-400">
                Spreadsheet-based calculations ensure accuracy and build client trust.
              </p>
            </div>
            
            <div>
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">24/7</span>
              </div>
              <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Always Available</h4>
              <p className="text-slate-600 dark:text-slate-400">
                Access your AI assistant anytime, anywhere, from any device.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-slate-600 dark:text-slate-400">
            Ready to transform your sales process? Get started with JACC today.
          </p>
        </div>
      </footer>
    </div>
  );
}
