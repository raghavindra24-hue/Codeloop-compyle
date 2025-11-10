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
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  School,
  Code,
  Assessment,
  PlayArrow,
  TrendingUp,
  EmojiEvents,
  Timer,
  Star,
  Book,
  Psychology,
  Flag,
  Refresh,
  Visibility,
  CheckCircle,
  RadioButtonUnchecked,
  Lock,
  Launch,
  Info,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';
import { Module, Assessment as AssessmentType, Question, PerformanceMetric } from '../../types';
import toast from 'react-hot-toast';

interface ModuleProgress {
  module: Module;
  progress: number;
  completedQuestions: number;
  totalQuestions: number;
  lastAccessed: string;
  isLocked: boolean;
  prerequisites: Module[];
}

interface AssessmentData {
  assessment: AssessmentType;
  status: 'available' | 'in_progress' | 'completed' | 'upcoming';
  score?: number;
  timeRemaining?: string;
  deadline: string;
  duration: number;
  questionsCount: number;
}

interface RecentSubmission {
  question: Question;
  submittedAt: string;
  score: number;
  language: string;
  status: 'correct' | 'wrong' | 'partial';
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  unlockedAt?: string;
}

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState<ModuleProgress[]>([]);
  const [assessments, setAssessments] = useState<AssessmentData[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<RecentSubmission[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState({
    totalModules: 0,
    completedModules: 0,
    totalSubmissions: 0,
    successfulSubmissions: 0,
    currentStreak: 0,
    averageScore: 0,
    rank: 0,
  });
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchStudentData = async () => {
    try {
      setLoading(true);

      // Fetch student's modules
      if (user?.groups && user.groups.length > 0) {
        const modulesResponse = await apiService.modules.getAll({
          groups: user.groups.map(g => g._id).join(',')
        });

        const modulesData = modulesResponse.data.map((module: Module) => ({
          module,
          progress: Math.floor(Math.random() * 100), // Mock data
          completedQuestions: Math.floor(Math.random() * 10), // Mock data
          totalQuestions: Math.floor(Math.random() * 10) + 5, // Mock data
          lastAccessed: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          isLocked: Math.random() > 0.7, // Mock data
          prerequisites: module.prerequisites || [],
        }));
        setModules(modulesData);

        // Fetch student's assessments
        const assessmentsResponse = await apiService.assessments.getAll({
          groups: user.groups.map(g => g._id).join(','),
          status: 'published'
        });

        const assessmentsData = assessmentsResponse.data.map((assessment: AssessmentType) => ({
          assessment,
          status: Math.random() > 0.5 ? 'available' : Math.random() > 0.5 ? 'completed' : 'upcoming' as any,
          score: Math.random() > 0.5 ? Math.floor(Math.random() * 40) + 60 : undefined,
          deadline: assessment.endTime,
          duration: assessment.duration,
          questionsCount: (assessment.codingQuestions?.length || 0) + (assessment.mcqQuestions?.length || 0),
        }));
        setAssessments(assessmentsData);
      }

      // Mock recent submissions data
      const mockSubmissions: RecentSubmission[] = [
        {
          question: {
            _id: '1',
            title: 'Two Sum Problem',
            type: 'coding',
            difficulty: 'easy',
            language: 'python',
            tags: ['arrays', 'hashing'],
          } as Question,
          submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toLocaleString(),
          score: 100,
          language: 'Python',
          status: 'correct',
        },
        {
          question: {
            _id: '2',
            title: 'Binary Search Tree',
            type: 'coding',
            difficulty: 'medium',
            language: 'python',
            tags: ['trees', 'algorithms'],
          } as Question,
          submittedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toLocaleString(),
          score: 75,
          language: 'Python',
          status: 'partial',
        },
        {
          question: {
            _id: '3',
            title: 'Linked List Cycle',
            type: 'coding',
            difficulty: 'medium',
            language: 'python',
            tags: ['linked-lists', 'algorithms'],
          } as Question,
          submittedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleString(),
          score: 0,
          language: 'Python',
          status: 'wrong',
        },
      ];
      setRecentSubmissions(mockSubmissions);

      // Mock achievements data
      const mockAchievements: Achievement[] = [
        {
          id: '1',
          title: 'First Steps',
          description: 'Complete your first module',
          icon: <Star />,
          unlocked: true,
          unlockedAt: '2024-01-15',
        },
        {
          id: '2',
          title: 'Problem Solver',
          description: 'Solve 10 coding problems',
          icon: <Psychology />,
          unlocked: true,
          unlockedAt: '2024-01-20',
        },
        {
          id: '3',
          title: 'Consistent Learner',
          description: 'Maintain a 7-day streak',
          icon: <Flag />,
          unlocked: false,
        },
        {
          id: '4',
          title: 'Top Performer',
          description: 'Score above 90% in an assessment',
          icon: <EmojiEvents />,
          unlocked: false,
        },
      ];
      setAchievements(mockAchievements);

      // Mock stats
      const mockStats = {
        totalModules: modules.length,
        completedModules: modules.filter(m => m.progress === 100).length,
        totalSubmissions: 47,
        successfulSubmissions: 35,
        currentStreak: 5,
        averageScore: 78,
        rank: 12,
      };
      setStats(mockStats);

      setLastRefresh(new Date());
    } catch (error: any) {
      console.error('Failed to fetch student data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
    const interval = setInterval(fetchStudentData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user?.groups]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'correct': return <CheckCircle color="success" />;
      case 'partial': return <Star color="warning" />;
      case 'wrong': return <RadioButtonUnchecked color="error" />;
      default: return <RadioButtonUnchecked />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'success';
      case 'in_progress': return 'warning';
      case 'completed': return 'info';
      case 'upcoming': return 'default';
      default: return 'default';
    }
  };

  const getTimeRemaining = (deadline: string) => {
    const now = new Date();
    const end = new Date(deadline);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading && modules.length === 0) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ textAlign: 'center', mt: 2 }}>
          Loading student dashboard...
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
            Welcome back, {user?.fullName}!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track your progress and continue learning
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </Typography>
          <Tooltip title="Refresh Dashboard">
            <IconButton onClick={fetchStudentData} disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Progress Overview Cards */}
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
                    {stats.completedModules}/{stats.totalModules}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Modules Completed
                  </Typography>
                </Box>
              </Box>
              <LinearProgress
                variant="determinate"
                value={stats.totalModules > 0 ? (stats.completedModules / stats.totalModules) * 100 : 0}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                  <Code />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {stats.successfulSubmissions}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Successful Submissions
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {stats.totalSubmissions - stats.successfulSubmissions} attempts remaining
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <Flag />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {stats.currentStreak}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Day Streak
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Keep it going!
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <EmojiEvents />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    #{stats.rank}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Leaderboard Rank
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Avg Score: {stats.averageScore}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Available Modules */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Available Modules
              </Typography>
              <Grid container spacing={2}>
                {modules.length === 0 ? (
                  <Grid item xs={12}>
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No modules available yet
                      </Typography>
                    </Box>
                  </Grid>
                ) : (
                  modules.map((moduleProgress) => (
                    <Grid item xs={12} sm={6} key={moduleProgress.module._id}>
                      <Card variant="outlined" sx={{ height: '100%', position: 'relative' }}>
                        {moduleProgress.isLocked && (
                          <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
                            <Chip
                              icon={<Lock />}
                              label="Locked"
                              size="small"
                              color="default"
                            />
                          </Box>
                        )}
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6" fontWeight="medium" gutterBottom>
                                {moduleProgress.module.title}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                <Chip
                                  label={moduleProgress.module.difficulty}
                                  color={getDifficultyColor(moduleProgress.module.difficulty)}
                                  size="small"
                                />
                                <Chip
                                  label={`${moduleProgress.module.estimatedHours}h`}
                                  variant="outlined"
                                  size="small"
                                />
                              </Box>
                            </Box>
                          </Box>

                          <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                Progress
                              </Typography>
                              <Typography variant="body2" fontWeight="medium">
                                {moduleProgress.progress}% ({moduleProgress.completedQuestions}/{moduleProgress.totalQuestions})
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={moduleProgress.progress}
                              sx={{ height: 6, borderRadius: 3 }}
                            />
                          </Box>

                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {moduleProgress.module.description.substring(0, 100)}...
                          </Typography>

                          <Button
                            variant={moduleProgress.progress > 0 ? "outlined" : "contained"}
                            startIcon={moduleProgress.progress > 0 ? <PlayArrow /> : <Launch />}
                            fullWidth
                            disabled={moduleProgress.isLocked}
                            onClick={() => {
                              if (moduleProgress.isLocked) {
                                toast.error('Complete prerequisites first');
                              } else {
                                toast.info(`Opening ${moduleProgress.module.title}`);
                              }
                            }}
                          >
                            {moduleProgress.progress > 0 ? 'Continue Learning' : 'Start Module'}
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Achievements */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Achievements
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {achievements.map((achievement) => (
                  <Box
                    key={achievement.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      p: 2,
                      border: '1px solid',
                      borderColor: achievement.unlocked ? 'success.main' : 'grey.300',
                      borderRadius: 2,
                      opacity: achievement.unlocked ? 1 : 0.6,
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: achievement.unlocked ? 'success.main' : 'grey.400',
                        mr: 2,
                      }}
                    >
                      {achievement.icon}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight="medium">
                        {achievement.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {achievement.description}
                      </Typography>
                      {achievement.unlocked && achievement.unlockedAt && (
                        <Typography variant="caption" color="success.main">
                          Unlocked: {new Date(achievement.unlockedAt).toLocaleDateString()}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Assessments */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Assessments
              </Typography>
              <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                {assessments.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No assessments available
                    </Typography>
                  </Box>
                ) : (
                  assessments.map((assessmentData) => (
                    <ListItem key={assessmentData.assessment._id}>
                      <ListItemText
                        primary={assessmentData.assessment.title}
                        secondary={
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Chip
                                label={assessmentData.status}
                                color={getStatusColor(assessmentData.status)}
                                size="small"
                                sx={{ mr: 1 }}
                              />
                              {assessmentData.score !== undefined && (
                                <Typography variant="body2" fontWeight="medium">
                                  Score: {assessmentData.score}%
                                </Typography>
                              )}
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              {assessmentData.questionsCount} questions • {assessmentData.duration} minutes
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {assessmentData.status === 'upcoming'
                                ? `Starts in ${getTimeRemaining(assessmentData.deadline)}`
                                : `Ends in ${getTimeRemaining(assessmentData.deadline)}`
                              }
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Button
                          variant={assessmentData.status === 'completed' ? 'outlined' : 'contained'}
                          size="small"
                          startIcon={assessmentData.status === 'completed' ? <Visibility /> : <PlayArrow />}
                          onClick={() => {
                            if (assessmentData.status === 'available') {
                              toast.info('Starting assessment...');
                            } else if (assessmentData.status === 'completed') {
                              toast.info('Viewing results...');
                            } else {
                              toast.info('Assessment not available yet');
                            }
                          }}
                        >
                          {assessmentData.status === 'completed' ? 'View Results' :
                           assessmentData.status === 'available' ? 'Start' : 'View'}
                        </Button>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Submissions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Recent Submissions
              </Typography>
              <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                {recentSubmissions.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No submissions yet
                    </Typography>
                  </Box>
                ) : (
                  recentSubmissions.map((submission, index) => (
                    <React.Fragment key={index}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {getStatusIcon(submission.status)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={submission.question.title}
                          secondary={
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <Chip
                                  label={submission.question.difficulty}
                                  color={getDifficultyColor(submission.question.difficulty)}
                                  size="small"
                                  sx={{ mr: 1 }}
                                />
                                <Typography variant="body2" fontWeight="medium">
                                  Score: {submission.score}%
                                </Typography>
                              </Box>
                              <Typography variant="body2" color="text.secondary">
                                Language: {submission.language}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {submission.submittedAt}
                              </Typography>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={() => toast.info('Viewing submission details')}
                          >
                            <Visibility />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < recentSubmissions.length - 1 && <Divider variant="inset" component="li" />}
                    </React.Fragment>
                  ))
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StudentDashboard;