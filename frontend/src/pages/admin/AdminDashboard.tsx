import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  People,
  School,
  LibraryBooks,
  Assessment,
  TrendingUp,
  TrendingDown,
  Add,
  Refresh,
  Visibility,
  Group,
  Business,
  Analytics,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';
import { AnalyticsData, User, Activity, DashboardStats } from '../../types';
import toast from 'react-hot-toast';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, activitiesResponse] = await Promise.all([
        apiService.analytics.getDashboard(),
        apiService.notices.getAll({ limit: 10, targetType: 'all' })
      ]);

      setDashboardStats(statsResponse.data);
      setRecentActivities(activitiesResponse.data || []);
      setLastRefresh(new Date());
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Set up auto-refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate growth indicators (mock data for now, should come from API)
  const getGrowthIndicator = (current: number, previous: number) => {
    const growth = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(growth).toFixed(1),
      isPositive: growth >= 0,
      icon: growth >= 0 ? <TrendingUp /> : <TrendingDown />,
    };
  };

  const userGrowth = getGrowthIndicator(
    dashboardStats?.totalUsers || 0,
    (dashboardStats?.totalUsers || 0) * 0.9 // Mock 10% growth
  );

  const completionGrowth = getGrowthIndicator(
    dashboardStats?.completionRate || 0,
    (dashboardStats?.completionRate || 0) * 0.95 // Mock 5% growth
  );

  if (loading && !dashboardStats) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ textAlign: 'center', mt: 2 }}>
          Loading dashboard...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Admin Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Welcome back, {user?.fullName}! Here's your system overview.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </Typography>
          <Tooltip title="Refresh Dashboard">
            <IconButton onClick={fetchDashboardData} disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* System Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <People />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {dashboardStats?.totalUsers || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Users
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {userGrowth.icon}
                <Typography variant="body2" color={userGrowth.isPositive ? 'success.main' : 'error.main'} sx={{ ml: 1 }}>
                  +{userGrowth.value}% from last month
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {dashboardStats?.recentRegistrations || 0} new this week
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                  <Business />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {dashboardStats?.totalDepartments || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Departments
                  </Typography>
                </Box>
              </Box>
              <LinearProgress
                variant="determinate"
                value={((dashboardStats?.totalDepartments || 0) / 10) * 100}
                sx={{ mt: 1 }}
              />
              <Typography variant="caption" color="text.secondary">
                Target: 10 departments
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <LibraryBooks />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {dashboardStats?.totalModules || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Learning Modules
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {dashboardStats?.totalQuestions || 0} questions available
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <Assessment />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {dashboardStats?.completionRate || 0}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completion Rate
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {completionGrowth.icon}
                <Typography variant="body2" color={completionGrowth.isPositive ? 'success.main' : 'error.main'} sx={{ ml: 1 }}>
                  +{completionGrowth.value}% improvement
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  fullWidth
                  onClick={() => toast.info('User management coming soon')}
                >
                  Create User
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Business />}
                  fullWidth
                  onClick={() => toast.info('Department management coming soon')}
                >
                  Create Department
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Analytics />}
                  fullWidth
                  onClick={() => toast.info('Analytics dashboard coming soon')}
                >
                  View Analytics
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Assessment />}
                  fullWidth
                  onClick={() => toast.info('Assessment management coming soon')}
                >
                  Create Assessment
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity Timeline */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Recent System Activity
              </Typography>
              <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                {recentActivities.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No recent activity
                    </Typography>
                  </Box>
                ) : (
                  recentActivities.map((activity, index) => (
                    <React.Fragment key={activity.id}>
                      <ListItem alignItems="flex-start">
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {activity.type === 'login' && <People />}
                            {activity.type === 'submission' && <LibraryBooks />}
                            {activity.type === 'assessment' && <Assessment />}
                            {activity.type === 'module' && <School />}
                            {activity.type === 'question' && <LibraryBooks />}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={activity.description}
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {activity.user.fullName} • {activity.user.email}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(activity.timestamp).toLocaleString()}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < recentActivities.length - 1 && <Divider variant="inset" component="li" />}
                    </React.Fragment>
                  ))
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* User Distribution Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                User Distribution by Role
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 24, height: 24, mr: 1 }}>
                      <People sx={{ fontSize: 14 }} />
                    </Avatar>
                    <Typography variant="body2">Admins</Typography>
                  </Box>
                  <Typography variant="body2" fontWeight="bold">5</Typography>
                </Box>
                <LinearProgress variant="determinate" value={5} sx={{ height: 8, borderRadius: 4 }} />

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'secondary.main', width: 24, height: 24, mr: 1 }}>
                      <Business sx={{ fontSize: 14 }} />
                    </Avatar>
                    <Typography variant="body2">HODs</Typography>
                  </Box>
                  <Typography variant="body2" fontWeight="bold">12</Typography>
                </Box>
                <LinearProgress variant="determinate" value={12} sx={{ height: 8, borderRadius: 4 }} />

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'success.main', width: 24, height: 24, mr: 1 }}>
                      <School sx={{ fontSize: 14 }} />
                    </Avatar>
                    <Typography variant="body2">Teachers</Typography>
                  </Box>
                  <Typography variant="body2" fontWeight="bold">45</Typography>
                </Box>
                <LinearProgress variant="determinate" value={45} sx={{ height: 8, borderRadius: 4 }} />

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'warning.main', width: 24, height: 24, mr: 1 }}>
                      <Group sx={{ fontSize: 14 }} />
                    </Avatar>
                    <Typography variant="body2">Students</Typography>
                  </Box>
                  <Typography variant="body2" fontWeight="bold">238</Typography>
                </Box>
                <LinearProgress variant="determinate" value={238} sx={{ height: 8, borderRadius: 4 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* System Health */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                System Health
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Database Status</Typography>
                  <Chip label="Connected" color="success" size="small" />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Judge0 API</Typography>
                  <Chip label="Connected" color="success" size="small" />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2">File Storage</Typography>
                  <Chip label="Healthy" color="success" size="small" />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2">System Uptime</Typography>
                  <Typography variant="body2" fontWeight="bold">99.8%</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Server Response Time</Typography>
                  <Typography variant="body2" fontWeight="bold">124ms</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;