export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'not-interested' | 'converted' | 'follow-up';
export type LeadSource = 'facebook' | 'twitter' | 'google' | 'website' | 'offline-event' | 'referral';
export type LeadPriority = 'low' | 'medium' | 'high';

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  source: LeadSource;
  status: LeadStatus;
  priority: LeadPriority;
  interestedIn: string;
  budget: number;
  notes: string;
  assignedTo: string;
  createdAt: Date;
  updatedAt: Date;
  lastContactedAt?: Date;
  nextFollowUp?: Date;
  leadScore: number;
}

export interface LeadActivity {
  id: string;
  leadId: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'status-change';
  description: string;
  performedBy: string;
  performedAt: Date;
}