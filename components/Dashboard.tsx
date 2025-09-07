import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Users, TrendingUp, Target, DollarSign, Phone, Calendar, AlertCircle } from 'lucide-react';
import { mockLeads } from '@/data/mockData';
import { Lead, LeadStatus, LeadSource } from '@/types/lead';

export function Dashboard() {
  // Calculate metrics
  const totalLeads = mockLeads.length;
  const newLeads = mockLeads.filter(lead => lead.status === 'new').length;
  const qualifiedLeads = mockLeads.filter(lead => lead.status === 'qualified').length;
  const convertedLeads = mockLeads.filter(lead => lead.status === 'converted').length;
  const conversionRate = ((convertedLeads / totalLeads) * 100).toFixed(1);
  
  const totalRevenuePotential = mockLeads
    .filter(lead => lead.status !== 'not-interested')
    .reduce((sum, lead) => sum + lead.budget, 0);
  
  const actualRevenue = mockLeads
    .filter(lead => lead.status === 'converted')
    .reduce((sum, lead) => sum + lead.budget, 0);

  // Leads requiring follow-up today
  const followUpToday = mockLeads.filter(lead => {
    if (!lead.nextFollowUp) return false;
    const today = new Date();
    return lead.nextFollowUp.toDateString() === today.toDateString();
  }).length;

  // Source distribution data
  const sourceData = Object.entries(
    mockLeads.reduce((acc, lead) => {
      acc[lead.source] = (acc[lead.source] || 0) + 1;
      return acc;
    }, {} as Record<LeadSource, number>)
  ).map(([source, count]) => ({ source, count }));

  // Status distribution data
  const statusData = Object.entries(
    mockLeads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as Record<LeadStatus, number>)
  ).map(([status, count]) => ({ status, count }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#f97316'];

  // Weekly trend data (mock)
  const weeklyTrend = [
    { week: 'Week 1', leads: 12 },
    { week: 'Week 2', leads: 15 },
    { week: 'Week 3', leads: 8 },
    { week: 'Week 4', leads: 18 },
  ];

  // Top performers
  const salesPerformance = Object.entries(
    mockLeads.reduce((acc, lead) => {
      acc[lead.assignedTo] = (acc[lead.assignedTo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, leads]) => ({ name, leads }))
    .sort((a, b) => b.leads - a.leads);

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Dashboard</h2>
          <p className="text-gray-600">Overview of your lead management performance</p>
        </div>
        <Badge variant="outline" className="text-sm">
          Last updated: {new Date().toLocaleDateString()}
        </Badge>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeads}</div>
            <p className="text-xs text-muted-foreground">
              {newLeads} new this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate}%</div>
            <Progress value={parseFloat(conversionRate)} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Generated</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${actualRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              ${totalRevenuePotential.toLocaleString()} potential
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Follow-ups Today</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{followUpToday}</div>
            <p className="text-xs text-muted-foreground">
              Requires immediate attention
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Sources Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ source, percent }) => `${source} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Lead Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Lead Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Line type="monotone" dataKey="leads" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sales Team Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Team Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {salesPerformance.map((person, index) => (
                <div key={person.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {index + 1}
                      </span>
                    </div>
                    <span className="font-medium">{person.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{person.leads} leads</span>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(person.leads / totalLeads) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity or Quick Actions could go here */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <Phone className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium">Make Calls</p>
                <p className="text-sm text-gray-600">{mockLeads.filter(l => l.status === 'new').length} new leads to contact</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
              <Calendar className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium">Schedule Follow-ups</p>
                <p className="text-sm text-gray-600">{followUpToday} leads need follow-up</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">Close Deals</p>
                <p className="text-sm text-gray-600">{qualifiedLeads} qualified leads</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}