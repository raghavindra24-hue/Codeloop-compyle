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
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  Badge,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  PlayArrow,
  CheckCircle,
  RadioButtonUnchecked,
  Lock,
  LockOpen,
  School,
  Timer,
  Book,
  Code,
  Visibility,
  Download,
  ExpandMore,
  Star,
  Psychology,
  EmojiEvents,
  Refresh,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';
import { Module, Question, ModuleProgress } from '../../types';
import toast from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';

interface ModuleViewProps {}

const ModuleView: React.FC<ModuleViewProps> = () => {
  const { user } = useAuth();
  const { moduleId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [module, setModule] = useState<Module | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [progress, setProgress] = useState<ModuleProgress | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [practiceDialogOpen, setPracticeDialogOpen] = useState(false);

  useEffect(() => {
    if (moduleId) {
      fetchModuleData();
    }
  }, [moduleId]);

  const fetchModuleData = async () => {
    try {
      setLoading(true);

      // Fetch module details
      const moduleResponse = await apiService.modules.getById(moduleId!);
      setModule(moduleResponse.data);

      // Fetch module questions
      const questionsResponse = await apiService.modules.getQuestions(moduleId!);
      setQuestions(questionsResponse.data || []);

      // Fetch student progress
      if (user?._id) {
        const progressResponse = await apiService.modules.getProgress(moduleId!, user._id);
        setProgress(progressResponse.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch module data:', error);
      toast.error('Failed to load module');
    } finally {
      setLoading(false);
    }
  };

  const handleStartPractice = (question: Question) => {
    setSelectedQuestion(question);
    setPracticeDialogOpen(true);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'error';
      default: return 'default';
    }
  };

  const getQuestionStatus = (questionId: string) => {
    // Mock status - in real implementation, this would come from progress API
    const statuses = ['completed', 'in-progress', 'not-started'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle color="success" />;
      case 'in-progress': return <RadioButtonUnchecked color="warning" />;
      default: return <RadioButtonUnsigned color="action" />;
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress === 100) return 'success';
    if (progress >= 50) return 'warning';
    return 'error';
  };

  const estimatedTime = questions.reduce((total, question) => {
    const timeMap = { easy: 15, medium: 30, hard: 45 };
    return total + (timeMap[question.difficulty as keyof typeof timeMap] || 30);
  }, 0);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ textAlign: 'center', mt: 2 }}>
          Loading module...
        </Typography>
      </Box>
    );
  }

  if (!module) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Module not found
        </Typography>
        <Button variant="outlined" onClick={() => navigate('/student/dashboard')} sx={{ mt: 2 }}>
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  const completedQuestions = progress?.completed || 0;
  const progressPercentage = questions.length > 0 ? (completedQuestions / questions.length) * 100 : 0;

  return (
    <Box sx={{ p: 3 }}>
      {/* Module Header */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 3 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                {module.title}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Chip
                  label={module.difficulty}
                  color={getDifficultyColor(module.difficulty)}
                  size="medium"
                />
                <Chip
                  icon={<Timer />}
                  label={`${module.estimatedHours} hours`}
                  variant="outlined"
                  size="medium"
                />
                <Chip
                  icon={<Book />}
                  label={`${questions.length} questions`}
                  variant="outlined"
                  size="medium"
                />
              </Box>
            </Box>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={() => toast.info('Download resources coming soon')}
            >
              Resources
            </Button>
          </Box>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {module.description}
          </Typography>

          {/* Progress Overview */}
          <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight="medium">
                Your Progress
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="primary.main">
                {progressPercentage.toFixed(0)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progressPercentage}
              color={getProgressColor(progressPercentage)}
              sx={{ height: 10, borderRadius: 5, mb: 2 }}
            />
            <Typography variant="body2" color="text.secondary">
              {completedQuestions} of {questions.length} questions completed
            </Typography>
          </Paper>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Questions List */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Module Questions
              </Typography>

              {questions.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Book sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No questions available
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                This module doesn't have any questions yet
                  </Typography>
                </Box>
              ) : (
                <List>
                  {questions.map((question, index) => {
                    const status = getQuestionStatus(question._id);
                    const isLocked = index > 0 && getQuestionStatus(questions[index - 1]._id) !== 'completed';

                    return (
                      <React.Fragment key={question._id}>
                        <ListItem
                          sx={{
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 2,
                            mb: 2,
                            p: 2,
                          }}
                        >
                          <ListItemIcon sx={{ mr: 2 }}>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              {index + 1}
                            </Avatar>
                          </ListItemIcon>

                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="h6" fontWeight="medium">
                                  {question.title}
                                </Typography>
                                {getStatusIcon(status)}
                                {isLocked && <Lock color="action" />}
                              </Box>
                            }
                            secondary={
                              <Box sx={{ mt: 1 }}>
                                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                  <Chip
                                    label={question.type}
                                    size="small"
                                    variant="outlined"
                                  />
                                  <Chip
                                    label={question.difficulty}
                                    color={getDifficultyColor(question.difficulty)}
                                    size="small"
                                  />
                                  {question.language && (
                                    <Chip
                                      label={question.language}
                                      size="small"
                                      variant="outlined"
                                    />
                                  )}
                                </Box>
                                <Typography variant="body2" color="text.secondary">
                                  {question.description.substring(0, 150)}...
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                  {question.tags.map((tag) => (
                                    <Chip
                                      key={tag}
                                      label={tag}
                                      size="small"
                                      variant="outlined"
                                      sx={{ fontSize: '0.7rem' }}
                                    />
                                  ))}
                                </Box>
                              </Box>
                            }
                          />

                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', ml: 2 }}>
                            {status === 'completed' ? (
                              <Button
                                variant="outlined"
                                startIcon={<Visibility />}
                                onClick={() => handleStartPractice(question)}
                              >
                                Review
                              </Button>
                            ) : (
                              <Button
                                variant={status === 'in-progress' ? 'contained' : 'outlined'}
                                startIcon={<PlayArrow />}
                                onClick={() => handleStartPractice(question)}
                                disabled={isLocked}
                              >
                                {status === 'in-progress' ? 'Continue' : 'Start'}
                              </Button>
                            )}
                          </Box>
                        </ListItem>
                      </React.Fragment>
                    );
                  })}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Module Info */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Module Information
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Difficulty Level
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {module.difficulty.charAt(0).toUpperCase() + module.difficulty.slice(1)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Estimated Time
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {Math.ceil(estimatedTime / 60)} hours
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Questions
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {questions.length}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Created by
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {module.createdBy?.fullName || 'Unknown'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Prerequisites */}
          {module.prerequisites && module.prerequisites.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Prerequisites
                </Typography>
                <List dense>
                  {module.prerequisites.map((prereq) => (
                    <ListItem key={prereq._id}>
                      <ListItemIcon>
                        <CheckCircle color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary={prereq.title}
                        secondary={`Completed • ${prereq.difficulty}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}

          {/* Learning Tips */}
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Learning Tips
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Alert severity="info" icon={<Psychology />}>
                  Take your time to understand each concept before moving to the next question
                </Alert>
                <Alert severity="warning" icon={<Timer />}>
                  This module requires approximately {Math.ceil(estimatedTime / 60)} hours to complete
                </Alert>
                <Alert severity="success" icon={<EmojiEvents />}>
                  Complete all questions to earn a module completion certificate
                </Alert>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Practice Dialog */}
      <Dialog
        open={practiceDialogOpen}
        onClose={() => setPracticeDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Practice: {selectedQuestion?.title}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ py: 4, textAlign: 'center' }}>
            Code editor with Piston API integration will be implemented here
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            This practice interface will include a Monaco code editor connected to the Piston API for code execution
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPracticeDialogOpen(false)}>Close</Button>
          <Button variant="contained" onClick={() => {
            toast.info('Code editor with Piston API integration coming next');
            setPracticeDialogOpen(false);
          }}>
            Start Coding
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ModuleView;