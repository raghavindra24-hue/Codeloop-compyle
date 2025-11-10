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
  Badge,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Groups,
  LibraryBooks,
  Assessment,
  PlayArrow,
  Edit,
  Visibility,
  Add,
  Refresh,
  TrendingUp,
  TrendingDown,
  People,
  Schedule,
  Notifications,
  MoreVert,
  Star,
  CheckCircle,
  Warning,
  Error,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';
import { Group, Module, Assessment as AssessmentType, User } from '../../types';
import toast from 'react-hot-toast';

interface GroupData {
  group: Group;
  studentCount: number;
  activeStudents: number;
  averagePerformance: number;
  recentActivity: string;
  pendingSubmissions: number;
  modulesInProgress: number;
  upcomingAssessments: number;
}

interface ModuleData {
  module: Module;
  assignedGroups: number;
  completionRate: number;
  averageScore: number;
  studentProgress: number;
  lastUpdated: string;
}

interface AssessmentData {
  assessment: AssessmentType;
  status: 'draft' | 'published' | 'started' | 'completed';
  participantCount: number;
  averageScore: number;
  startTime: string;
  endTime: string;
  submissionsCount: number;
}

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [assessments, setAssessments] = useState<AssessmentData[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchTeacherData = async () => {
    try {
      setLoading(true);

      // Fetch teacher's groups
      const groupsResponse = await apiService.groups.getAll({ faculty: user?._id });
      const groupsData = groupsResponse.data.map((group: Group) => ({
        group,
        studentCount: group.students?.length || 0,
        activeStudents: Math.floor((group.students?.length || 0) * 0.8), // Mock data
        averagePerformance: Math.floor(Math.random() * 30) + 70, // Mock data
        recentActivity: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        pendingSubmissions: Math.floor(Math.random() * 10), // Mock data
        modulesInProgress: Math.floor(Math.random() * 3) + 1, // Mock data
        upcomingAssessments: Math.floor(Math.random() * 2), // Mock data
      }));
      setGroups(groupsData);

      // Fetch teacher's modules
      const modulesResponse = await apiService.modules.getAll({ createdBy: user?._id });
      const modulesData = modulesResponse.data.map((module: Module) => ({
        module,
        assignedGroups: Math.floor(Math.random() * 3) + 1, // Mock data
        completionRate: Math.floor(Math.random() * 40) + 60, // Mock data
        averageScore: Math.floor(Math.random() * 30) + 70, // Mock data
        studentProgress: Math.floor(Math.random() * 50) + 50, // Mock data
        lastUpdated: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      }));
      setModules(modulesData);

      // Fetch teacher's assessments
      const assessmentsResponse = await apiService.assessments.getAll({ createdBy: user?._id });
      const assessmentsData = assessmentsResponse.data.map((assessment: AssessmentType) => ({
        assessment,
        status: assessment.status,
        participantCount: Math.floor(Math.random() * 30) + 10, // Mock data
        averageScore: Math.floor(Math.random() * 30) + 70, // Mock data
        startTime: assessment.startTime,
        endTime: assessment.endTime,
        submissionsCount: Math.floor(Math.random() * 25) + 5, // Mock data
      }));
      setAssessments(assessmentsData);

      // Mock notifications data
      setNotifications([
        { id: 1, type: 'submission', message: '5 students submitted assignments', time: '2 hours ago', severity: 'info' },
        { id: 2, type: 'assessment', message: 'Assessment "Python Basics" ends tomorrow', time: '3 hours ago', severity: 'warning' },
        { id: 3, type: 'module', message: 'New module "Data Structures" is ready', time: '1 day ago', severity: 'success' },
        { id: 4, type: 'student', message: 'Student John Doe needs attention', time: '2 days ago', severity: 'error' },
      ]);

      setLastRefresh(new Date());
    } catch (error: any) {
      console.error('Failed to fetch teacher data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeacherData();
    const interval = setInterval(fetchTeacherData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user?._id]);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, item: any) => {
    setAnchorEl(event.currentTarget);
    setSelectedItem(item);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedItem(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'default';
      case 'published': return 'info';
      case 'started': return 'warning';
      case 'completed': return 'success';
      default: return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return <Error color="error" />;
      case 'warning': return <Warning color="warning" />;
      case 'success': return <CheckCircle color="success" />;
      default: return <Info color="info" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Edit />;
      case 'published': return <Visibility />;
      case 'started': return <PlayArrow />;
      case 'completed': return <CheckCircle />;
      default: return <Assessment />;
    }
  };

  if (loading && groups.length === 0) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ textAlign: 'center', mt: 2 }}>
          Loading teacher dashboard...
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
            Teacher Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your groups, modules, and assessments
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Badge badgeContent={notifications.length} color="error">
            <Tooltip title="Notifications">
              <IconButton>
                <Notifications />
              </IconButton>
            </Tooltip>
          </Badge>
          <Typography variant="caption" color="text.secondary">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </Typography>
          <Tooltip title="Refresh Dashboard">
            <IconButton onClick={fetchTeacherData} disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Overview Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <Groups />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {groups.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    My Groups
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {groups.reduce((sum, g) => sum + g.studentCount, 0)} total students
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                  <LibraryBooks />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {modules.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Modules Created
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Avg completion: {Math.round(modules.reduce((sum, m) => sum + m.completionRate, 0) / modules.length || 0)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <Assessment />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {assessments.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Assessments
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {assessments.filter(a => a.status === 'started').length} active
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <People />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {groups.reduce((sum, g) => sum + g.pendingSubmissions, 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Reviews
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Across all groups
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
                  onClick={() => toast.info('Module creation coming soon')}
                >
                  Create Module
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Assessment />}
                  fullWidth
                  onClick={() => toast.info('Assessment builder coming soon')}
                >
                  Create Assessment
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Groups />}
                  fullWidth
                  onClick={() => toast.info('Group management coming soon')}
                >
                  Manage Groups
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Visibility />}
                  fullWidth
                  onClick={() => toast.info('Analytics dashboard coming soon')}
                >
                  View Analytics
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Notifications Panel */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Notifications
              </Typography>
              <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                {notifications.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No new notifications
                    </Typography>
                  </Box>
                ) : (
                  notifications.map((notification) => (
                    <ListItem key={notification.id} alignItems="flex-start">
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {getSeverityIcon(notification.severity)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={notification.message}
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {notification.time}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* My Groups */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                My Groups
              </Typography>
              <Grid container spacing={2}>
                {groups.length === 0 ? (
                  <Grid item xs={12}>
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No groups assigned yet
                      </Typography>
                    </Box>
                  </Grid>
                ) : (
                  groups.map((groupData) => (
                    <Grid item xs={12} sm={6} md={4} key={groupData.group._id}>
                      <Card variant="outlined" sx={{ height: '100%' }}>
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
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuClick(e, groupData)}
                            >
                              <MoreVert />
                            </IconButton>
                          </Box>

                          <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                Active Students
                              </Typography>
                              <Typography variant="body2" fontWeight="medium">
                                {groupData.activeStudents}/{groupData.studentCount}
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={(groupData.activeStudents / groupData.studentCount) * 100}
                              sx={{ height: 6, borderRadius: 3 }}
                            />
                          </Box>

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                              Avg Performance
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {groupData.averagePerformance >= 80 ? <TrendingUp color="success" /> : <TrendingDown color="error" />}
                              <Typography variant="body2" fontWeight="medium" sx={{ ml: 1 }}>
                                {groupData.averagePerformance}%
                              </Typography>
                            </Box>
                          </Box>

                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {groupData.pendingSubmissions > 0 && (
                              <Chip
                                label={`${groupData.pendingSubmissions} pending`}
                                color="warning"
                                size="small"
                                variant="outlined"
                              />
                            )}
                            {groupData.upcomingAssessments > 0 && (
                              <Chip
                                label={`${groupData.upcomingAssessments} assessments`}
                                color="info"
                                size="small"
                                variant="outlined"
                              />
                            )}
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

        {/* Recent Modules */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Recent Modules
              </Typography>
              <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                {modules.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No modules created yet
                    </Typography>
                  </Box>
                ) : (
                  modules.slice(0, 5).map((moduleData) => (
                    <ListItem key={moduleData.module._id}>
                      <ListItemText
                        primary={moduleData.module.title}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {moduleData.assignedGroups} groups • {moduleData.completionRate}% completion
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Updated: {moduleData.lastUpdated}
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => toast.info(`Opening ${moduleData.module.title}`)}
                        >
                          <Visibility />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Assessments */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Recent Assessments
              </Typography>
              <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                {assessments.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No assessments created yet
                    </Typography>
                  </Box>
                ) : (
                  assessments.slice(0, 5).map((assessmentData) => (
                    <ListItem key={assessmentData.assessment._id}>
                      <ListItemText
                        primary={assessmentData.assessment.title}
                        secondary={
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              {getStatusIcon(assessmentData.status)}
                              <Chip
                                label={assessmentData.status}
                                color={getStatusColor(assessmentData.status)}
                                size="small"
                                sx={{ ml: 1 }}
                              />
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              {assessmentData.participantCount} participants • {assessmentData.submissionsCount} submissions
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Ends: {new Date(assessmentData.endTime).toLocaleDateString()}
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => toast.info(`Opening ${assessmentData.assessment.title}`)}
                        >
                          <Visibility />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { toast.info('Viewing group details'); handleMenuClose(); }}>
          <Visibility sx={{ mr: 1 }} /> View Details
        </MenuItem>
        <MenuItem onClick={() => { toast.info('Opening group management'); handleMenuClose(); }}>
          <Groups sx={{ mr: 1 }} /> Manage Group
        </MenuItem>
        <MenuItem onClick={() => { toast.info('Creating assessment for group'); handleMenuClose(); }}>
          <Assessment sx={{ mr: 1 }} /> Create Assessment
        </MenuItem>
        <MenuItem onClick={() => { toast.info('Viewing group analytics'); handleMenuClose(); }}>
          <TrendingUp sx={{ mr: 1 }} /> View Analytics
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default TeacherDashboard;