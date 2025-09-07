import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { ArrowLeft, Phone, Mail, Calendar, Clock, Star, Edit3, Save, X } from 'lucide-react';
import { Lead, LeadActivity, LeadStatus } from '@/types/lead';
import { mockActivities } from '@/data/mockData';
import { getSourceColor, getStatusColor, getPriorityColor } from '@/data/mockData';

interface LeadDetailsProps {
  lead: Lead;
  onBack: () => void;
  onUpdateLead: (leadId: string, updates: Partial<Lead>) => void;
}

export function LeadDetails({ lead, onBack, onUpdateLead }: LeadDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedLead, setEditedLead] = useState<Lead>(lead);
  const [newNote, setNewNote] = useState('');
  const [newStatus, setNewStatus] = useState<LeadStatus>(lead.status);

  const activities = mockActivities.filter(activity => activity.leadId === lead.id);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    });
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleSave = () => {
    onUpdateLead(lead.id, editedLead);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedLead(lead);
    setIsEditing(false);
  };

  const handleStatusChange = (status: LeadStatus) => {
    setNewStatus(status);
    onUpdateLead(lead.id, { status, updatedAt: new Date() });
  };

  const addNote = () => {
    if (newNote.trim()) {
      // In a real app, this would create a new activity
      setNewNote('');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const daysUntilFollowUp = lead.nextFollowUp 
    ? Math.ceil((lead.nextFollowUp.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack} className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Leads</span>
          </Button>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              {lead.firstName} {lead.lastName}
            </h2>
            <p className="text-gray-600">Lead Details & Activity</p>
          </div>
        </div>
        <div className="flex space-x-2">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} className="flex items-center space-x-2">
              <Edit3 className="h-4 w-4" />
              <span>Edit Lead</span>
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button onClick={handleSave} className="flex items-center space-x-2">
                <Save className="h-4 w-4" />
                <span>Save</span>
              </Button>
              <Button variant="outline" onClick={handleCancel} className="flex items-center space-x-2">
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">First Name</label>
                  <p className="mt-1 text-sm text-gray-900">{lead.firstName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Last Name</label>
                  <p className="mt-1 text-sm text-gray-900">{lead.lastName}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <p className="text-sm text-gray-900">{lead.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <div>
                    <label className="text-sm font-medium text-gray-700">Phone</label>
                    <p className="text-sm text-gray-900">{lead.phone}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lead Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Source</label>
                  <div className="mt-1">
                    <Badge className={getSourceColor(lead.source)}>
                      {lead.source}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Priority</label>
                  <div className="mt-1">
                    <Badge className={getPriorityColor(lead.priority)}>
                      {lead.priority}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Interested In</label>
                  <p className="mt-1 text-sm text-gray-900">{lead.interestedIn}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Budget</label>
                  <p className="mt-1 text-sm text-gray-900">{formatCurrency(lead.budget)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Assigned To</label>
                  <p className="mt-1 text-sm text-gray-900">{lead.assignedTo}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Lead Score</label>
                  <div className="mt-1 flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-sm font-medium ${getScoreColor(lead.leadScore)}`}>
                      {lead.leadScore}
                    </span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= Math.floor(lead.leadScore / 20) 
                              ? 'text-yellow-400 fill-current' 
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <label className="text-sm font-medium text-gray-700">Notes</label>
                <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                  {lead.notes}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Activity History */}
          <Card>
            <CardHeader>
              <CardTitle>Activity History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex space-x-3">
                  <Textarea
                    placeholder="Add a note or activity..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={addNote}>Add Note</Button>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  {activities.length === 0 ? (
                    <p className="text-gray-500 text-sm">No activities recorded yet.</p>
                  ) : (
                    activities.map((activity) => (
                      <div key={activity.id} className="flex space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              {activity.type}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {formatDateTime(activity.performedAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-900 mt-1">{activity.description}</p>
                          <p className="text-xs text-gray-500 mt-1">by {activity.performedBy}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Status */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>Call Lead</span>
              </Button>
              <Button variant="outline" className="w-full flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>Send Email</span>
              </Button>
              <Button variant="outline" className="w-full flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Schedule Meeting</span>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status & Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Current Status</label>
                <div className="mt-1">
                  <Select value={newStatus} onValueChange={handleStatusChange}>
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
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">Created</span>
                  <span className="text-gray-900">{formatDate(lead.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">Last Updated</span>
                  <span className="text-gray-900">{formatDate(lead.updatedAt)}</span>
                </div>
                {lead.lastContactedAt && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">Last Contacted</span>
                    <span className="text-gray-900">{formatDate(lead.lastContactedAt)}</span>
                  </div>
                )}
                {lead.nextFollowUp && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">Next Follow-up</span>
                    <div className="text-right">
                      <span className="text-gray-900">{formatDate(lead.nextFollowUp)}</span>
                      {daysUntilFollowUp !== null && (
                        <div className={`text-xs ${
                          daysUntilFollowUp <= 0 ? 'text-red-600' : 
                          daysUntilFollowUp <= 1 ? 'text-orange-600' : 
                          'text-gray-500'
                        }`}>
                          {daysUntilFollowUp <= 0 ? 'Overdue' : 
                           daysUntilFollowUp === 1 ? 'Tomorrow' :
                           `in ${daysUntilFollowUp} days`}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}