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
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Paper,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  People,
  School,
  Groups,
  Assessment,
  TrendingUp,
  TrendingDown,
  Add,
  Refresh,
  Visibility,
  Group,
  Business,
  Analytics,
  Email,
  Phone,
  Star,
  StarBorder,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';
import { User, Group, AnalyticsData, Department } from '../../types';
import toast from 'react-hot-toast';

interface GroupPerformance {
  group: Group;
  totalStudents: number;
  averageScore: number;
  completionRate: number;
  activeStudents: number;
  recentActivity: string;
}

interface TeacherPerformance {
  teacher: User;
  groupsCount: number;
  totalStudents: number;
  averagePerformance: number;
  modulesCreated: number;
  assessmentsCreated: number;
  lastActive: string;
}

const HODDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [departmentStats, setDepartmentStats] = useState<any>(null);
  const [teachers, setTeachers] = useState<TeacherPerformance[]>([]);
  const [groups, setGroups] = useState<GroupPerformance[]>([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Fetch department-specific data
  const fetchDepartmentData = async () => {
    try {
      setLoading(true);
      if (!user?.department?._id) {
        throw new Error('No department assigned');
      }

      const [statsResponse, teachersResponse, groupsResponse] = await Promise.all([
        apiService.analytics.getDepartmentAnalytics(user.department._id),
        apiService.users.getByRole('teacher', { department: user.department._id }),
        apiService.groups.getAll({ department: user.department._id })
      ]);

      setDepartmentStats(statsResponse.data);

      // Transform teacher data
      const teachersData = teachersResponse.data.map((teacher: User) => ({
        teacher,
        groupsCount: Math.floor(Math.random() * 3) + 1, // Mock data
        totalStudents: Math.floor(Math.random() * 50) + 20, // Mock data
        averagePerformance: Math.floor(Math.random() * 30) + 70, // Mock data
        modulesCreated: Math.floor(Math.random() * 10) + 5, // Mock data
        assessmentsCreated: Math.floor(Math.random() * 5) + 2, // Mock data
        lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      }));
      setTeachers(teachersData);

      // Transform group data
      const groupsData = groupsResponse.data.map((group: Group) => ({
        group,
        totalStudents: group.students?.length || 0,
        averageScore: Math.floor(Math.random() * 30) + 70, // Mock data
        completionRate: Math.floor(Math.random() * 40) + 60, // Mock data
        activeStudents: Math.floor((group.students?.length || 0) * 0.8), // Mock data
        recentActivity: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      }));
      setGroups(groupsData);

      setLastRefresh(new Date());
    } catch (error: any) {
      console.error('Failed to fetch department data:', error);
      toast.error('Failed to load department data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartmentData();
    const interval = setInterval(fetchDepartmentData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user?.department]);

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getPerformanceIcon = (score: number) => {
    return score >= 80 ? <TrendingUp color="success" /> : score >= 60 ? <TrendingUp color="warning" /> : <TrendingDown color="error" />;
  };

  if (loading && !departmentStats) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ textAlign: 'center', mt: 2 }}>
          Loading department dashboard...
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
            {user?.department?.name} Department
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Department overview and management dashboard
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </Typography>
          <Tooltip title="Refresh Dashboard">
            <IconButton onClick={fetchDepartmentData} disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Department Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <School />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {teachers.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Teachers
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {teachers.reduce((sum, t) => sum + t.modulesCreated, 0)} modules created
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                  <Groups />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {groups.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Groups
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {groups.reduce((sum, g) => sum + g.totalStudents, 0)} total students
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <People />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {groups.reduce((sum, g) => sum + g.totalStudents, 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Students
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {groups.reduce((sum, g) => sum + g.activeStudents, 0)} active this week
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
                    {teachers.reduce((sum, t) => sum + t.assessmentsCreated, 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Assessments
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Avg completion: {Math.round(groups.reduce((sum, g) => sum + g.completionRate, 0) / groups.length || 0)}%
              </Typography>
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
                  onClick={() => toast.info('Group creation coming soon')}
                >
                  Create Group
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<School />}
                  fullWidth
                  onClick={() => toast.info('Teacher management coming soon')}
                >
                  Add Teacher
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Analytics />}
                  fullWidth
                  onClick={() => toast.info('Department reports coming soon')}
                >
                  View Reports
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Assessment />}
                  fullWidth
                  onClick={() => toast.info('Department assessments coming soon')}
                >
                  Manage Assessments
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Teacher Performance */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Teacher Performance
              </Typography>
              <TableContainer sx={{ maxHeight: 400 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Teacher</TableCell>
                      <TableCell align="center">Groups</TableCell>
                      <TableCell align="center">Students</TableCell>
                      <TableCell align="center">Performance</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {teachers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            No teachers in this department
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      teachers.map((teacherData) => (
                        <TableRow key={teacherData.teacher._id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar sx={{ width: 32, height: 32, mr: 2 }}>
                                {teacherData.teacher.fullName.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight="medium">
                                  {teacherData.teacher.fullName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {teacherData.teacher.email}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">{teacherData.groupsCount}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">{teacherData.totalStudents}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {getPerformanceIcon(teacherData.averagePerformance)}
                              <Typography
                                variant="body2"
                                color={`${getPerformanceColor(teacherData.averagePerformance)}.main`}
                                sx={{ ml: 1 }}
                              >
                                {teacherData.averagePerformance}%
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              onClick={() => toast.info(`Viewing ${teacherData.teacher.fullName}'s details`)}
                            >
                              <Visibility />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Group Overview */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Group Management Overview
              </Typography>
              <Grid container spacing={2}>
                {groups.length === 0 ? (
                  <Grid item xs={12}>
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No groups in this department
                      </Typography>
                    </Box>
                  </Grid>
                ) : (
                  groups.map((groupData) => (
                    <Grid item xs={12} sm={6} md={4} key={groupData.group._id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                            <Box>
                              <Typography variant="h6" fontWeight="medium">
                                {groupData.group.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {groupData.group.code}
                              </Typography>
                            </Box>
                            <Chip
                              label={`${groupData.completionRate}%`}
                              color={getPerformanceColor(groupData.completionRate)}
                              size="small"
                            />
                          </Box>

                          <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                Progress
                              </Typography>
                              <Typography variant="body2" fontWeight="medium">
                                {groupData.activeStudents}/{groupData.totalStudents} active
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={(groupData.activeStudents / groupData.totalStudents) * 100}
                              sx={{ height: 6, borderRadius: 3 }}
                            />
                          </Box>

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                              Avg Score: {groupData.averageScore}%
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Active: {groupData.recentActivity}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default HODDashboard;