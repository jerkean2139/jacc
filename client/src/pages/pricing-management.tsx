import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Plus, Edit2, Trash2, DollarSign, Settings, Cpu } from 'lucide-react';

interface ProcessorPricing {
  id: string;
  processorName: string;
  pricingType: string;
  qualifiedRate: string;
  midQualifiedRate?: string;
  nonQualifiedRate?: string;
  interchangePlus?: string;
  authFee: string;
  monthlyFee: string;
  statementFee: string;
  batchFee: string;
  gatewayFee?: string;
  pciFee?: string;
  setupFee?: string;
  earlyTerminationFee?: string;
  contractLength: number;
  features: string[];
  compatibleHardware: string[];
  isActive: boolean;
  lastUpdated: string;
  updatedBy: string;
}

interface HardwareOption {
  id: string;
  name: string;
  category: string;
  manufacturer: string;
  model: string;
  purchasePrice: string;
  monthlyLease?: string;
  setupFee?: string;
  features: string[];
  compatibleProcessors: string[];
  specifications: Record<string, any>;
  isActive: boolean;
  lastUpdated: string;
  updatedBy: string;
}

export default function PricingManagement() {
  const [processorDialogOpen, setProcessorDialogOpen] = useState(false);
  const [hardwareDialogOpen, setHardwareDialogOpen] = useState(false);
  const [editingProcessor, setEditingProcessor] = useState<ProcessorPricing | null>(null);
  const [editingHardware, setEditingHardware] = useState<HardwareOption | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch processor pricing
  const { data: processorsData, isLoading: processorsLoading } = useQuery({
    queryKey: ['/api/pricing/processors'],
  });

  // Fetch hardware options
  const { data: hardwareData, isLoading: hardwareLoading } = useQuery({
    queryKey: ['/api/pricing/hardware'],
  });

  // Processor mutation
  const processorMutation = useMutation({
    mutationFn: (data: Partial<ProcessorPricing>) => 
      apiRequest('POST', '/api/pricing/processors', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pricing/processors'] });
      setProcessorDialogOpen(false);
      setEditingProcessor(null);
      toast({
        title: 'Success',
        description: 'Processor pricing saved successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to save processor pricing',
        variant: 'destructive',
      });
    }
  });

  // Hardware mutation
  const hardwareMutation = useMutation({
    mutationFn: (data: Partial<HardwareOption>) => 
      apiRequest('POST', '/api/pricing/hardware', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pricing/hardware'] });
      setHardwareDialogOpen(false);
      setEditingHardware(null);
      toast({
        title: 'Success',
        description: 'Hardware option saved successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to save hardware option',
        variant: 'destructive',
      });
    }
  });

  const handleProcessorSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const processorData = {
      id: editingProcessor?.id,
      processorName: formData.get('processorName') as string,
      pricingType: formData.get('pricingType') as string,
      qualifiedRate: formData.get('qualifiedRate') as string,
      midQualifiedRate: formData.get('midQualifiedRate') as string || undefined,
      nonQualifiedRate: formData.get('nonQualifiedRate') as string || undefined,
      interchangePlus: formData.get('interchangePlus') as string || undefined,
      authFee: formData.get('authFee') as string,
      monthlyFee: formData.get('monthlyFee') as string,
      statementFee: formData.get('statementFee') as string,
      batchFee: formData.get('batchFee') as string,
      gatewayFee: formData.get('gatewayFee') as string || undefined,
      pciFee: formData.get('pciFee') as string || undefined,
      setupFee: formData.get('setupFee') as string || undefined,
      earlyTerminationFee: formData.get('earlyTerminationFee') as string || undefined,
      contractLength: parseInt(formData.get('contractLength') as string) || 12,
      features: (formData.get('features') as string)?.split(',').map(f => f.trim()).filter(Boolean) || [],
      compatibleHardware: (formData.get('compatibleHardware') as string)?.split(',').map(h => h.trim()).filter(Boolean) || [],
      isActive: true
    };

    processorMutation.mutate(processorData);
  };

  const handleHardwareSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const hardwareData = {
      id: editingHardware?.id,
      name: formData.get('name') as string,
      category: formData.get('category') as string,
      manufacturer: formData.get('manufacturer') as string,
      model: formData.get('model') as string,
      purchasePrice: formData.get('purchasePrice') as string,
      monthlyLease: formData.get('monthlyLease') as string || undefined,
      setupFee: formData.get('setupFee') as string || undefined,
      features: (formData.get('features') as string)?.split(',').map(f => f.trim()).filter(Boolean) || [],
      compatibleProcessors: (formData.get('compatibleProcessors') as string)?.split(',').map(p => p.trim()).filter(Boolean) || [],
      specifications: {},
      isActive: true
    };

    hardwareMutation.mutate(hardwareData);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Pricing Management</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage processor pricing and hardware options for accurate cost calculations
        </p>
      </div>

      <Tabs defaultValue="processors" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="processors" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Processor Pricing
          </TabsTrigger>
          <TabsTrigger value="hardware" className="flex items-center gap-2">
            <Cpu className="w-4 h-4" />
            Hardware Options
          </TabsTrigger>
        </TabsList>

        <TabsContent value="processors">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Processor Pricing</CardTitle>
                <CardDescription>
                  Manage pricing configurations for all payment processors
                </CardDescription>
              </div>
              <Dialog open={processorDialogOpen} onOpenChange={setProcessorDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingProcessor(null)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Processor
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingProcessor ? 'Edit Processor' : 'Add New Processor'}
                    </DialogTitle>
                    <DialogDescription>
                      Configure pricing details for payment processor
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleProcessorSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="processorName">Processor Name</Label>
                        <Input
                          id="processorName"
                          name="processorName"
                          defaultValue={editingProcessor?.processorName}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="pricingType">Pricing Type</Label>
                        <Select name="pricingType" defaultValue={editingProcessor?.pricingType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select pricing type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="interchange_plus">Interchange Plus</SelectItem>
                            <SelectItem value="tiered">Tiered</SelectItem>
                            <SelectItem value="flat_rate">Flat Rate</SelectItem>
                            <SelectItem value="subscription">Subscription</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="qualifiedRate">Qualified Rate (%)</Label>
                        <Input
                          id="qualifiedRate"
                          name="qualifiedRate"
                          type="number"
                          step="0.0001"
                          defaultValue={editingProcessor?.qualifiedRate}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="midQualifiedRate">Mid-Qualified Rate (%)</Label>
                        <Input
                          id="midQualifiedRate"
                          name="midQualifiedRate"
                          type="number"
                          step="0.0001"
                          defaultValue={editingProcessor?.midQualifiedRate}
                        />
                      </div>
                      <div>
                        <Label htmlFor="nonQualifiedRate">Non-Qualified Rate (%)</Label>
                        <Input
                          id="nonQualifiedRate"
                          name="nonQualifiedRate"
                          type="number"
                          step="0.0001"
                          defaultValue={editingProcessor?.nonQualifiedRate}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="authFee">Auth Fee ($)</Label>
                        <Input
                          id="authFee"
                          name="authFee"
                          type="number"
                          step="0.01"
                          defaultValue={editingProcessor?.authFee}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="monthlyFee">Monthly Fee ($)</Label>
                        <Input
                          id="monthlyFee"
                          name="monthlyFee"
                          type="number"
                          step="0.01"
                          defaultValue={editingProcessor?.monthlyFee}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="statementFee">Statement Fee ($)</Label>
                        <Input
                          id="statementFee"
                          name="statementFee"
                          type="number"
                          step="0.01"
                          defaultValue={editingProcessor?.statementFee}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="contractLength">Contract Length (months)</Label>
                        <Input
                          id="contractLength"
                          name="contractLength"
                          type="number"
                          defaultValue={editingProcessor?.contractLength || 12}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="earlyTerminationFee">Early Termination Fee ($)</Label>
                        <Input
                          id="earlyTerminationFee"
                          name="earlyTerminationFee"
                          type="number"
                          step="0.01"
                          defaultValue={editingProcessor?.earlyTerminationFee}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="features">Features (comma-separated)</Label>
                      <Input
                        id="features"
                        name="features"
                        defaultValue={editingProcessor?.features?.join(', ')}
                        placeholder="EMV, NFC, Online Gateway, Mobile App"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setProcessorDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={processorMutation.isPending}>
                        {processorMutation.isPending ? 'Saving...' : 'Save Processor'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {processorsLoading ? (
                <div className="text-center py-8">Loading processors...</div>
              ) : (
                <div className="space-y-4">
                  {processorsData?.processors?.map((processor: ProcessorPricing) => (
                    <Card key={processor.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{processor.processorName}</h3>
                            <Badge variant="outline" className="capitalize">
                              {processor.pricingType.replace('_', ' ')}
                            </Badge>
                            {processor.isActive && <Badge variant="default">Active</Badge>}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <strong>Qualified Rate:</strong> {processor.qualifiedRate}%
                            </div>
                            <div>
                              <strong>Auth Fee:</strong> ${processor.authFee}
                            </div>
                            <div>
                              <strong>Monthly Fee:</strong> ${processor.monthlyFee}
                            </div>
                            <div>
                              <strong>Contract:</strong> {processor.contractLength} months
                            </div>
                          </div>
                          {processor.features?.length > 0 && (
                            <div className="mt-2">
                              <strong className="text-sm">Features:</strong>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {processor.features.map((feature, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {feature}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingProcessor(processor);
                            setProcessorDialogOpen(true);
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hardware">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Hardware Options</CardTitle>
                <CardDescription>
                  Manage available hardware equipment and pricing
                </CardDescription>
              </div>
              <Dialog open={hardwareDialogOpen} onOpenChange={setHardwareDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingHardware(null)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Hardware
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingHardware ? 'Edit Hardware' : 'Add New Hardware'}
                    </DialogTitle>
                    <DialogDescription>
                      Configure hardware equipment details and pricing
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleHardwareSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Hardware Name</Label>
                        <Input
                          id="name"
                          name="name"
                          defaultValue={editingHardware?.name}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select name="category" defaultValue={editingHardware?.category}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="terminal">Terminal</SelectItem>
                            <SelectItem value="mobile">Mobile</SelectItem>
                            <SelectItem value="virtual">Virtual</SelectItem>
                            <SelectItem value="gateway">Gateway</SelectItem>
                            <SelectItem value="pos_system">POS System</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="manufacturer">Manufacturer</Label>
                        <Input
                          id="manufacturer"
                          name="manufacturer"
                          defaultValue={editingHardware?.manufacturer}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="model">Model</Label>
                        <Input
                          id="model"
                          name="model"
                          defaultValue={editingHardware?.model}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="purchasePrice">Purchase Price ($)</Label>
                        <Input
                          id="purchasePrice"
                          name="purchasePrice"
                          type="number"
                          step="0.01"
                          defaultValue={editingHardware?.purchasePrice}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="monthlyLease">Monthly Lease ($)</Label>
                        <Input
                          id="monthlyLease"
                          name="monthlyLease"
                          type="number"
                          step="0.01"
                          defaultValue={editingHardware?.monthlyLease}
                        />
                      </div>
                      <div>
                        <Label htmlFor="setupFee">Setup Fee ($)</Label>
                        <Input
                          id="setupFee"
                          name="setupFee"
                          type="number"
                          step="0.01"
                          defaultValue={editingHardware?.setupFee}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="features">Features (comma-separated)</Label>
                      <Input
                        id="features"
                        name="features"
                        defaultValue={editingHardware?.features?.join(', ')}
                        placeholder="EMV, NFC, WiFi, Bluetooth, Touchscreen"
                      />
                    </div>

                    <div>
                      <Label htmlFor="compatibleProcessors">Compatible Processors (comma-separated)</Label>
                      <Input
                        id="compatibleProcessors"
                        name="compatibleProcessors"
                        defaultValue={editingHardware?.compatibleProcessors?.join(', ')}
                        placeholder="TracerPay, Accept Blue, First Data"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setHardwareDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={hardwareMutation.isPending}>
                        {hardwareMutation.isPending ? 'Saving...' : 'Save Hardware'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {hardwareLoading ? (
                <div className="text-center py-8">Loading hardware...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hardwareData?.hardware?.map((hardware: HardwareOption) => (
                    <Card key={hardware.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{hardware.name}</h3>
                            <Badge variant="outline" className="capitalize">
                              {hardware.category.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div><strong>Manufacturer:</strong> {hardware.manufacturer}</div>
                            <div><strong>Model:</strong> {hardware.model}</div>
                            <div><strong>Purchase:</strong> ${hardware.purchasePrice}</div>
                            {hardware.monthlyLease && (
                              <div><strong>Monthly Lease:</strong> ${hardware.monthlyLease}</div>
                            )}
                          </div>
                          {hardware.features?.length > 0 && (
                            <div className="mt-2">
                              <div className="flex flex-wrap gap-1">
                                {hardware.features.map((feature, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {feature}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingHardware(hardware);
                            setHardwareDialogOpen(true);
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}