import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowRight, 
  CheckCircle, 
  Star, 
  Zap, 
  Shield, 
  TrendingUp,
  Users,
  Clock,
  Target,
  Award
} from 'lucide-react';
import { useAccessibility } from './accessibility-provider';

interface ConversionProps {
  variant?: 'landing' | 'signup' | 'upgrade' | 'demo';
  onConvert?: (data: any) => void;
  leadSource?: string;
}

export function ConversionOptimization({ variant = 'landing', onConvert, leadSource }: ConversionProps) {
  const { announceToScreenReader } = useAccessibility();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    phone: '',
    monthlyVolume: '',
    currentProcessor: '',
    interests: [] as string[]
  });

  const [socialProof] = useState({
    customerCount: '500+',
    averageSavings: '23%',
    processingVolume: '$2.5B+',
    satisfaction: '4.9/5'
  });

  const benefits = [
    {
      icon: Zap,
      title: 'Instant Rate Analysis',
      description: 'Get processing rate comparisons in seconds, not days',
      value: 'Save 5+ hours per prospect'
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Bank-level encryption and compliance standards',
      value: '99.9% uptime guarantee'
    },
    {
      icon: TrendingUp,
      title: 'Revenue Growth',
      description: 'Increase close rates with AI-powered insights',
      value: 'Average 35% more deals'
    },
    {
      icon: Clock,
      title: 'Time Efficiency',
      description: 'Automate research and proposal generation',
      value: '80% faster proposals'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      title: 'Senior Sales Manager',
      company: 'Premier Payments',
      quote: 'JACC transformed our sales process. We\'re closing 40% more deals with half the effort.',
      rating: 5
    },
    {
      name: 'Mike Chen',
      title: 'VP of Sales',
      company: 'Merchant Solutions Pro',
      quote: 'The AI insights are incredible. Our team went from good to exceptional overnight.',
      rating: 5
    },
    {
      name: 'Lisa Rodriguez',
      title: 'Account Executive',
      company: 'Gateway Partners',
      quote: 'Finally, an AI that actually understands merchant services. Game changer.',
      rating: 5
    }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const conversionData = {
      ...formData,
      variant,
      leadSource,
      timestamp: new Date().toISOString(),
      step: currentStep
    };

    announceToScreenReader('Form submitted successfully');
    
    if (onConvert) {
      onConvert(conversionData);
    }
  };

  const ProgressIndicator = () => (
    <div className="flex items-center justify-center mb-6">
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step <= currentStep + 1 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground'
            }`}>
              {step < currentStep + 1 ? <CheckCircle className="h-4 w-4" /> : step}
            </div>
            {step < 3 && (
              <div className={`w-8 h-0.5 ${
                step < currentStep + 1 ? 'bg-primary' : 'bg-muted'
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Hero Section with Value Proposition */}
      <div className="text-center space-y-6">
        <div className="space-y-4">
          <Badge variant="secondary" className="text-sm px-3 py-1">
            <Award className="h-3 w-3 mr-1" />
            #1 AI Platform for Merchant Services
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Close More Deals with
            <span className="text-primary"> AI-Powered</span> Intelligence
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Transform your merchant services sales with instant rate analysis, 
            intelligent document processing, and real-time market insights
          </p>
        </div>

        {/* Social Proof */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{socialProof.customerCount}</div>
            <div className="text-sm text-muted-foreground">Happy Customers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{socialProof.averageSavings}</div>
            <div className="text-sm text-muted-foreground">Average Savings</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{socialProof.processingVolume}</div>
            <div className="text-sm text-muted-foreground">Processing Volume</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{socialProof.satisfaction}</div>
            <div className="text-sm text-muted-foreground">Customer Rating</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Benefits Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Why Top Performers Choose JACC</h2>
          
          <div className="space-y-4">
            {benefits.map((benefit, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <benefit.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{benefit.description}</p>
                    <Badge variant="outline" className="text-xs">{benefit.value}</Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Testimonials */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">What Sales Professionals Say</h3>
            {testimonials.slice(0, 2).map((testimonial, index) => (
              <Card key={index} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <blockquote className="text-sm italic">
                    "{testimonial.quote}"
                  </blockquote>
                  <div className="text-xs">
                    <div className="font-medium">{testimonial.name}</div>
                    <div className="text-muted-foreground">
                      {testimonial.title}, {testimonial.company}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Conversion Form */}
        <div className="lg:sticky lg:top-6">
          <Card className="p-6">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-xl">Get Started Today</CardTitle>
              <CardDescription>
                Join {socialProof.customerCount} professionals already using JACC
              </CardDescription>
            </CardHeader>

            <ProgressIndicator />

            <form onSubmit={handleSubmit} className="space-y-4">
              {currentStep === 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        required
                        aria-describedby="firstName-help"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Business Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                      aria-describedby="email-help"
                    />
                    <p id="email-help" className="text-xs text-muted-foreground mt-1">
                      We'll never share your email address
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="company">Company Name</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="monthlyVolume">Monthly Processing Volume</Label>
                    <Input
                      id="monthlyVolume"
                      placeholder="e.g., $50,000"
                      value={formData.monthlyVolume}
                      onChange={(e) => handleInputChange('monthlyVolume', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="currentProcessor">Current Processor (Optional)</Label>
                    <Input
                      id="currentProcessor"
                      placeholder="e.g., First Data, Chase Paymentech"
                      value={formData.currentProcessor}
                      onChange={(e) => handleInputChange('currentProcessor', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <Label>What interests you most about JACC?</Label>
                    <Textarea
                      placeholder="Tell us about your biggest challenges in merchant services..."
                      className="min-h-[100px]"
                    />
                  </div>
                  
                  <div className="text-center space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <h3 className="font-semibold text-green-800">Almost Ready!</h3>
                      <p className="text-sm text-green-700">
                        Click submit to get instant access to JACC
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                {currentStep > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                )}
                
                {currentStep < 2 ? (
                  <Button
                    type="button"
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className="flex-1 gap-2"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="submit" className="flex-1 gap-2">
                    Get Instant Access
                    <Zap className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </form>

            {/* Trust Indicators */}
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  <span>SOC 2 Compliant</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  <span>GDPR Ready</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>No Setup Fees</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Risk Reversal */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="text-center space-y-4">
          <h3 className="text-xl font-bold">Try JACC Risk-Free</h3>
          <p className="text-muted-foreground">
            30-day money-back guarantee. Cancel anytime. No contracts or hidden fees.
          </p>
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Instant Setup</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>No Training Required</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}