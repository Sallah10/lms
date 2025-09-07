import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { ArrowLeft, Save, X, Plus } from 'lucide-react';
import { Lead, LeadSource, LeadStatus, LeadPriority } from '@/types/lead';
import { salesTeam } from '@/data/mockData';

interface LeadManagementProps {
  lead?: Lead | null;
  onSave: (lead: Partial<Lead>) => void;
  onCancel: () => void;
}

export function LeadManagement({ lead, onSave, onCancel }: LeadManagementProps) {
  const isEditing = !!lead;
  
  const [formData, setFormData] = useState<Partial<Lead>>({
    firstName: lead?.firstName || '',
    lastName: lead?.lastName || '',
    email: lead?.email || '',
    phone: lead?.phone || '',
    source: lead?.source || 'website',
    status: lead?.status || 'new',
    priority: lead?.priority || 'medium',
    interestedIn: lead?.interestedIn || '',
    budget: lead?.budget || 0,
    notes: lead?.notes || '',
    assignedTo: lead?.assignedTo || salesTeam[0],
    nextFollowUp: lead?.nextFollowUp || undefined
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleInputChange = (field: keyof Lead, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName?.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName?.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.phone?.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    if (!formData.interestedIn?.trim()) {
      newErrors.interestedIn = 'Interested vehicle is required';
    }
    if (!formData.budget || formData.budget <= 0) {
      newErrors.budget = 'Please enter a valid budget';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const leadData = {
      ...formData,
      updatedAt: new Date(),
      leadScore: calculateLeadScore(formData),
      ...(isEditing ? {} : { 
        id: Date.now().toString(),
        createdAt: new Date()
      })
    };

    onSave(leadData);
  };

  // Simple lead scoring algorithm
  const calculateLeadScore = (data: Partial<Lead>): number => {
    let score = 50; // Base score

    // Source scoring
    const sourceScores = {
      referral: 20,
      website: 15,
      google: 10,
      facebook: 10,
      twitter: 5,
      'offline-event': 15
    };
    score += sourceScores[data.source as LeadSource] || 0;

    // Budget scoring
    if (data.budget) {
      if (data.budget >= 50000) score += 20;
      else if (data.budget >= 30000) score += 15;
      else if (data.budget >= 20000) score += 10;
      else score += 5;
    }

    // Priority scoring
    const priorityScores = {
      high: 15,
      medium: 10,
      low: 5
    };
    score += priorityScores[data.priority as LeadPriority] || 0;

    return Math.min(Math.max(score, 0), 100);
  };

  const formatDateForInput = (date?: Date) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onCancel} className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              {isEditing ? 'Edit Lead' : 'Create New Lead'}
            </h2>
            <p className="text-gray-600">
              {isEditing ? 'Update lead information' : 'Add a new lead to your pipeline'}
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {isEditing ? (
              <span>Lead Information</span>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                <span>New Lead Details</span>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName || ''}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className={errors.firstName ? 'border-red-500' : ''}
                />
                {errors.firstName && (
                  <p className="text-sm text-red-600">{errors.firstName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName || ''}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className={errors.lastName ? 'border-red-500' : ''}
                />
                {errors.lastName && (
                  <p className="text-sm text-red-600">{errors.lastName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && (
                  <p className="text-sm text-red-600">{errors.phone}</p>
                )}
              </div>
            </div>

            {/* Lead Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="source">Lead Source</Label>
                <Select
                  value={formData.source}
                  onValueChange={(value) => handleInputChange('source', value as LeadSource)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="twitter">Twitter</SelectItem>
                    <SelectItem value="google">Google</SelectItem>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="offline-event">Offline Event</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange('status', value as LeadStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="not-interested">Not Interested</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                    <SelectItem value="follow-up">Follow-up</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => handleInputChange('priority', value as LeadPriority)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Vehicle Interest & Budget */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="interestedIn">Interested Vehicle *</Label>
                <Input
                  id="interestedIn"
                  placeholder="e.g., Honda Civic, BMW X5"
                  value={formData.interestedIn || ''}
                  onChange={(e) => handleInputChange('interestedIn', e.target.value)}
                  className={errors.interestedIn ? 'border-red-500' : ''}
                />
                {errors.interestedIn && (
                  <p className="text-sm text-red-600">{errors.interestedIn}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget">Budget ($) *</Label>
                <Input
                  id="budget"
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.budget || ''}
                  onChange={(e) => handleInputChange('budget', parseInt(e.target.value) || 0)}
                  className={errors.budget ? 'border-red-500' : ''}
                />
                {errors.budget && (
                  <p className="text-sm text-red-600">{errors.budget}</p>
                )}
              </div>
            </div>

            {/* Assignment & Follow-up */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="assignedTo">Assigned To</Label>
                <Select
                  value={formData.assignedTo}
                  onValueChange={(value) => handleInputChange('assignedTo', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {salesTeam.map((member) => (
                      <SelectItem key={member} value={member}>
                        {member}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nextFollowUp">Next Follow-up Date</Label>
                <Input
                  id="nextFollowUp"
                  type="date"
                  value={formatDateForInput(formData.nextFollowUp)}
                  onChange={(e) => handleInputChange('nextFollowUp', new Date(e.target.value))}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                rows={4}
                placeholder="Additional notes about the lead..."
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                {isEditing ? 'Update Lead' : 'Create Lead'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}