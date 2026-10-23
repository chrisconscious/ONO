import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Building2, 
  Users, 
  FileText, 
  TrendingUp, 
  LogOut,
  Shield,
  Activity,
  Settings
} from 'lucide-react';

export function SuperAdminDashboard() {
  const { user, logout } = useAuth();

  const stats = [
    {
      title: 'Total Organizations',
      value: '0',
      description: 'Active tenant organizations',
      icon: Building2,
      trend: '+0%',
    },
    {
      title: 'Total Users',
      value: '0',
      description: 'Platform-wide users',
      icon: Users,
      trend: '+0%',
    },
    {
      title: 'Documents',
      value: '158',
      description: 'Project documentation',
      icon: FileText,
      trend: '+100%',
    },
    {
      title: 'Project Progress',
      value: '65%',
      description: '17 of 26 stages complete',
      icon: TrendingUp,
      trend: '+65%',
    },
  ];

  const recentActivities = [
    {
      action: 'Stage 17 completed',
      description: 'Documentation audit and consistency review',
      timestamp: 'Just now',
      icon: FileText,
    },
    {
      action: 'Stage 16 completed',
      description: 'Data governance framework established',
      timestamp: '1 hour ago',
      icon: Shield,
    },
    {
      action: 'Stage 15 completed',
      description: 'Design-to-development handoff specifications',
      timestamp: '2 hours ago',
      icon: Settings,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">ClickIT Super Admin</h1>
                <p className="text-xs text-gray-500">Platform Administration</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                <p className="text-xs text-gray-500">Super Administrator</p>
              </div>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, Administrator
          </h2>
          <p className="text-gray-600">
            Here's an overview of your platform status and recent activity.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-5 w-5 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-xs text-green-600 font-medium">{stat.trend}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-gray-400" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest platform updates and changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => {
                  const Icon = activity.icon;
                  return (
                    <div key={index} className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                        <Icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.action}
                        </p>
                        <p className="text-sm text-gray-500">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {activity.timestamp}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-gray-400" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Common administrative tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start" disabled>
                  <Building2 className="mr-2 h-4 w-4" />
                  Manage Organizations
                  <span className="ml-auto text-xs text-gray-400">Coming soon</span>
                </Button>
                <Button variant="outline" className="w-full justify-start" disabled>
                  <Users className="mr-2 h-4 w-4" />
                  Manage Users
                  <span className="ml-auto text-xs text-gray-400">Coming soon</span>
                </Button>
                <Button variant="outline" className="w-full justify-start" disabled>
                  <Shield className="mr-2 h-4 w-4" />
                  Security Settings
                  <span className="ml-auto text-xs text-gray-400">Coming soon</span>
                </Button>
                <Button variant="outline" className="w-full justify-start" disabled>
                  <Activity className="mr-2 h-4 w-4" />
                  View Audit Logs
                  <span className="ml-auto text-xs text-gray-400">Coming soon</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Information Banner */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-blue-900 mb-1">
                  Platform Status
                </h3>
                <p className="text-sm text-blue-700">
                  The ClickIT platform is currently in the documentation and planning phase. 
                  All 158 project documents across 17 stages have been completed. 
                  Implementation will begin after critical decisions are resolved and legal compliance is verified.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
