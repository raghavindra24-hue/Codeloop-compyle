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
  IconButton,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Menu,
  Tooltip,
  Badge,
  Alert,
  Snackbar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
} from '@mui/material';
import {
  Search,
  Add,
  Edit,
  Delete,
  Visibility,
  MoreVert,
  School,
  Book,
  Timer,
  People,
  Assessment,
  TrendingUp,
  ContentCopy,
  PlayArrow,
  Lock,
  LockOpen,
  FilterList,
  Refresh,
  DragIndicator,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';
import { Module, Question, Department, Group } from '../../types';
import toast from 'react-hot-toast';

interface ModuleFormData {
  _id?: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedHours: number;
  department: string;
  groups: string[];
  questionIds: string[];
  prerequisites: string[];
  isActive: boolean;
}

const ModuleManagement: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState<Module[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Table state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Dialog state
  const [moduleFormOpen, setModuleFormOpen] = useState(false);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);

  // Menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedModuleForMenu, setSelectedModuleForMenu] = useState<Module | null>(null);

  // Question selection state
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);

  const fetchModules = async () => {
    try {
      setLoading(true);
      const params: any = {
        createdBy: user?._id,
        page: page + 1,
        limit: rowsPerPage,
        sort: 'createdAt',
        order: 'desc'
      };

      if (searchTerm) params.search = searchTerm;
      if (selectedDifficulty) params.difficulty = selectedDifficulty;
      if (selectedDepartment) params.department = selectedDepartment;
      if (selectedStatus !== 'all') params.isActive = selectedStatus === 'active';

      const response = await apiService.modules.getAll(params);
      setModules(response.data.data || response.data);
    } catch (error: any) {
      console.error('Failed to fetch modules:', error);
      toast.error('Failed to load modules');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async () => {
    try {
      const response = await apiService.questions.getAll();
      setQuestions(response.data.data || response.data);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await apiService.departments.getAll();
      setDepartments(response.data.data || response.data);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const fetchGroups = async (departmentId: string) => {
    try {
      const response = await apiService.departments.getGroups(departmentId);
      setAvailableGroups(response.data.data || response.data);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    }
  };

  useEffect(() => {
    fetchModules();
    fetchQuestions();
    fetchDepartments();
  }, [page, rowsPerPage, searchTerm, selectedDifficulty, selectedDepartment, selectedStatus]);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, module: Module) => {
    setAnchorEl(event.currentTarget);
    setSelectedModuleForMenu(module);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedModuleForMenu(null);
  };

  const handleEditModule = (module: Module) => {
    setEditingModule(module);
    setModuleFormOpen(true);
    handleMenuClose();
  };

  const handleDuplicateModule = async (module: Module) => {
    try {
      const duplicatedData = {
        title: `${module.title} (Copy)`,
        description: module.description,
        difficulty: module.difficulty,
        estimatedHours: module.estimatedHours,
        department: module.department?._id,
        groups: module.groups?.map(g => g._id) || [],
        questionIds: module.modules?.map(m => m._id) || [],
        prerequisites: module.prerequisites?.map(p => p._id) || [],
        isActive: false,
      };

      // await apiService.modules.create(duplicatedData);
      toast.success('Module duplicated successfully');
      fetchModules();
    } catch (error: any) {
      toast.error('Failed to duplicate module');
    }
    handleMenuClose();
  };

  const handleToggleModuleStatus = async (module: Module) => {
    try {
      // await apiService.modules.update(module._id, { isActive: !module.isActive });
      toast.success(`Module ${module.isActive ? 'deactivated' : 'activated'} successfully`);
      fetchModules();
    } catch (error: any) {
      toast.error('Failed to update module status');
    }
    handleMenuClose();
  };

  const handleDeleteModule = async (module: Module) => {
    if (window.confirm(`Are you sure you want to delete "${module.title}"? This action cannot be undone.`)) {
      try {
        // await apiService.modules.delete(module._id);
        toast.success('Module deleted successfully');
        fetchModules();
      } catch (error: any) {
        toast.error('Failed to delete module');
      }
    }
    handleMenuClose();
  };

  const handleManageQuestions = (module: Module) => {
    setSelectedModule(module);
    setSelectedQuestions(module.modules?.map(q => q._id) || []);
    setQuestionDialogOpen(true);
    handleMenuClose();
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'error';
      default: return 'default';
    }
  };

  const getModuleStats = (module: Module) => {
    // Mock stats - in real implementation, these would come from analytics API
    return {
      assignedGroups: module.groups?.length || 0,
      totalStudents: Math.floor(Math.random() * 50) + 10,
      completionRate: Math.floor(Math.random() * 40) + 60,
      averageScore: Math.floor(Math.random() * 30) + 70,
      timeSpent: Math.floor(Math.random() * 20) + 5,
    };
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Module Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create and manage learning modules
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={() => toast.info('Advanced filters coming soon')}
          >
            Filters
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setEditingModule(null);
              setModuleFormOpen(true);
            }}
          >
            Create Module
          </Button>
        </Box>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search modules..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Difficulty</InputLabel>
                <Select
                  value={selectedDifficulty}
                  label="Difficulty"
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                >
                  <MenuItem value="">All Levels</MenuItem>
                  <MenuItem value="easy">Easy</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="hard">Hard</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Department</InputLabel>
                <Select
                  value={selectedDepartment}
                  label="Department"
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                >
                  <MenuItem value="">All Departments</MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept._id} value={dept._id}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={selectedStatus}
                  label="Status"
                  onChange={(e) => setSelectedStatus(e.target.value as 'all' | 'active' | 'inactive')}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchModules}
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Modules Grid */}
      <Grid container spacing={3}>
        {loading ? (
          <Grid item xs={12}>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography>Loading modules...</Typography>
            </Box>
          </Grid>
        ) : modules.length === 0 ? (
          <Grid item xs={12}>
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <School sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No modules found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Create your first module to get started
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => {
                  setEditingModule(null);
                  setModuleFormOpen(true);
                }}
              >
                Create Module
              </Button>
            </Box>
          </Grid>
        ) : (
          modules.map((module) => {
            const stats = getModuleStats(module);
            return (
              <Grid item xs={12} md={6} lg={4} key={module._id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                  <CardContent sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                          {module.title}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                          <Chip
                            label={module.difficulty}
                            color={getDifficultyColor(module.difficulty)}
                            size="small"
                          />
                          <Chip
                            label={`${module.estimatedHours}h`}
                            variant="outlined"
                            size="small"
                            icon={<Timer />}
                          />
                          <Chip
                            icon={module.isActive ? <LockOpen /> : <Lock />}
                            label={module.isActive ? 'Active' : 'Inactive'}
                            color={module.isActive ? 'success' : 'default'}
                            size="small"
                          />
                        </Box>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, module)}
                      >
                        <MoreVert />
                      </IconButton>
                    </Box>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 2,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {module.description}
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    {/* Module Stats */}
                    <Box sx={{ mb: 2 }}>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" fontWeight="bold" color="primary.main">
                              {stats.assignedGroups}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Groups
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" fontWeight="bold" color="success.main">
                              {stats.completionRate}%
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Completion
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <Chip
                        icon={<People />}
                        label={`${stats.totalStudents} students`}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        icon={<Assessment />}
                        label={`${module.modules?.length || 0} questions`}
                        size="small"
                        variant="outlined"
                      />
                    </Box>

                    <Typography variant="caption" color="text.secondary">
                      Avg Score: {stats.averageScore}% • Avg Time: {stats.timeSpent}h
                    </Typography>
                  </CardContent>

                  <Box sx={{ p: 2, pt: 0 }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Visibility />}
                        onClick={() => toast.info('Module preview coming soon')}
                        fullWidth
                      >
                        Preview
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<PlayArrow />}
                        onClick={() => toast.info('Module analytics coming soon')}
                        fullWidth
                      >
                        Analytics
                      </Button>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            );
          })
        )}
      </Grid>

      {/* Pagination */}
      {modules.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <TablePagination
            rowsPerPageOptions={[12, 24, 48, 96]}
            component="div"
            count={modules.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </Box>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => selectedModuleForMenu && handleEditModule(selectedModuleForMenu)}>
          <Edit sx={{ mr: 1 }} /> Edit Module
        </MenuItem>
        <MenuItem onClick={() => selectedModuleForMenu && handleManageQuestions(selectedModuleForMenu)}>
          <Book sx={{ mr: 1 }} /> Manage Questions
        </MenuItem>
        <MenuItem onClick={() => selectedModuleForMenu && handleDuplicateModule(selectedModuleForMenu)}>
          <ContentCopy sx={{ mr: 1 }} /> Duplicate Module
        </MenuItem>
        <MenuItem onClick={() => selectedModuleForMenu && handleToggleModuleStatus(selectedModuleForMenu)}>
          {selectedModuleForMenu?.isActive ? <Lock sx={{ mr: 1 }} /> : <LockOpen sx={{ mr: 1 }} />}
          {selectedModuleForMenu?.isActive ? 'Deactivate' : 'Activate'}
        </MenuItem>
        <MenuItem
          onClick={() => selectedModuleForMenu && handleDeleteModule(selectedModuleForMenu)}
          sx={{ color: 'error.main' }}
        >
          <Delete sx={{ mr: 1 }} /> Delete Module
        </MenuItem>
      </Menu>

      {/* Module Form Dialog (placeholder) */}
      <Dialog
        open={moduleFormOpen}
        onClose={() => setModuleFormOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingModule ? 'Edit Module' : 'Create New Module'}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ py: 4, textAlign: 'center' }}>
            Module form with rich text editor, question assignment, and prerequisites management
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModuleFormOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => {
            toast.info('Module form implementation coming next');
            setModuleFormOpen(false);
          }}>
            {editingModule ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Question Management Dialog */}
      <Dialog
        open={questionDialogOpen}
        onClose={() => setQuestionDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Manage Questions</DialogTitle>
        <DialogContent>
          <Typography sx={{ py: 2 }}>
            Module: {selectedModule?.title}
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox />
                  </TableCell>
                  <TableCell>Question</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Difficulty</TableCell>
                  <TableCell>Points</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {questions.slice(0, 5).map((question) => (
                  <TableRow key={question._id}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedQuestions.includes(question._id)}
                      />
                    </TableCell>
                    <TableCell>{question.title}</TableCell>
                    <TableCell>
                      <Chip label={question.type} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={question.difficulty}
                        color={getDifficultyColor(question.difficulty)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{10}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuestionDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => {
            toast.success('Questions assigned successfully');
            setQuestionDialogOpen(false);
          }}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ModuleManagement;