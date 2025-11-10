import React, { useState, useEffect } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Avatar,
  IconButton,
  Paper,
  Grid,
  Alert,
  LinearProgress,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
} from '@mui/material';
import {
  Person,
  Email,
  Phone,
  Business,
  Groups,
  PhotoCamera,
  Visibility,
  VisibilityOff,
  Lock,
  CheckCircle,
  Error,
  Warning,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';
import { User, Department, Group, UserRole } from '../../types';
import toast from 'react-hot-toast';

interface UserFormData {
  // Step 1: Basic Information
  fullName: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;

  // Step 2: Role and Department
  role: UserRole;
  department: string;
  groups: string[];

  // Step 3: Additional Information
  phone: string;
  bio: string;
  profilePhoto: File | null;

  // Step 4: Review
  agreedToTerms: boolean;
}

interface UserFormProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onSave: (user: User) => void;
}

const UserForm: React.FC<UserFormProps> = ({ open, user, onClose, onSave }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [emailValid, setEmailValid] = useState<boolean | null>(null);

  const [formData, setFormData] = useState<UserFormData>({
    fullName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    department: '',
    groups: [],
    phone: '',
    bio: '',
    profilePhoto: null,
    agreedToTerms: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const steps = [
    'Basic Information',
    'Role and Department',
    'Additional Information',
    'Review and Confirm',
  ];

  useEffect(() => {
    if (open) {
      fetchDepartments();
      if (user) {
        // Edit mode - populate form with user data
        setFormData({
          fullName: user.fullName,
          email: user.email,
          username: user.email.split('@')[0], // Extract username from email
          password: '',
          confirmPassword: '',
          role: user.role,
          department: user.department?._id || '',
          groups: user.groups?.map(g => g._id) || [],
          phone: '',
          bio: '',
          profilePhoto: null,
          agreedToTerms: true,
        });
      } else {
        // Create mode - reset form
        setFormData({
          fullName: '',
          email: '',
          username: '',
          password: '',
          confirmPassword: '',
          role: 'student',
          department: '',
          groups: [],
          phone: '',
          bio: '',
          profilePhoto: null,
          agreedToTerms: false,
        });
      }
      setActiveStep(0);
      setErrors({});
    }
  }, [open, user]);

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

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 0:
        if (!formData.fullName.trim()) {
          newErrors.fullName = 'Full name is required';
        } else if (formData.fullName.length < 2 || formData.fullName.length > 100) {
          newErrors.fullName = 'Full name must be between 2 and 100 characters';
        }

        if (!formData.email.trim()) {
          newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = 'Invalid email format';
        }

        if (!formData.username.trim()) {
          newErrors.username = 'Username is required';
        } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
          newErrors.username = 'Username must contain only letters, numbers, and underscores';
        }

        if (!user && !formData.password) {
          newErrors.password = 'Password is required';
        } else if (formData.password && formData.password.length < 8) {
          newErrors.password = 'Password must be at least 8 characters';
        }

        if (formData.password && formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }
        break;

      case 1:
        if (!formData.role) {
          newErrors.role = 'Role is required';
        }
        if (formData.role !== 'admin' && !formData.department) {
          newErrors.department = 'Department is required for this role';
        }
        break;

      case 2:
        if (formData.phone && !/^[+]?[\d\s-()]+$/.test(formData.phone)) {
          newErrors.phone = 'Invalid phone number format';
        }
        if (formData.bio && formData.bio.length > 500) {
          newErrors.bio = 'Bio must be less than 500 characters';
        }
        break;

      case 3:
        if (!formData.agreedToTerms) {
          newErrors.agreedToTerms = 'You must agree to the terms';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 25;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 25;
    return strength;
  };

  const handleInputChange = (field: keyof UserFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Special validations
    if (field === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }

    if (field === 'email') {
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      setEmailValid(isValid);
    }

    if (field === 'username') {
      if (value.length >= 3) {
        // Simulate username availability check
        setTimeout(() => setUsernameAvailable(Math.random() > 0.3), 500);
      } else {
        setUsernameAvailable(null);
      }
    }

    if (field === 'department') {
      setFormData(prev => ({ ...prev, groups: [] }));
      if (value) {
        fetchGroups(value);
      } else {
        setAvailableGroups([]);
      }
    }
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) return;

    setLoading(true);
    try {
      const userData = {
        fullName: formData.fullName,
        email: formData.email,
        role: formData.role,
        department: formData.department,
        groups: formData.groups,
        phone: formData.phone,
        bio: formData.bio,
      };

      if (user) {
        // Update existing user
        const response = await apiService.users.update(user._id, userData);
        toast.success('User updated successfully');
        onSave(response.data);
      } else {
        // Create new user
        const createData = {
          ...userData,
          password: formData.password,
          username: formData.username,
        };
        const response = await apiService.users.create(createData);
        toast.success('User created successfully');
        onSave(response.data);
      }

      onClose();
    } catch (error: any) {
      console.error('Failed to save user:', error);
      toast.error(error.response?.data?.error || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = (strength: number) => {
    if (strength <= 25) return 'error';
    if (strength <= 50) return 'warning';
    if (strength <= 75) return 'info';
    return 'success';
  };

  const getPasswordStrengthText = (strength: number) => {
    if (strength <= 25) return 'Weak';
    if (strength <= 50) return 'Fair';
    if (strength <= 75) return 'Good';
    return 'Strong';
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Full Name"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                error={!!errors.fullName}
                helperText={errors.fullName}
                required
                InputProps={{
                  startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                error={!!errors.email}
                helperText={errors.email}
                required
                InputProps={{
                  startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />,
                  endAdornment: emailValid !== null && (
                    emailValid ? (
                      <CheckCircle color="success" sx={{ ml: 1 }} />
                    ) : (
                      <Error color="error" sx={{ ml: 1 }} />
                    )
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Username"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                error={!!errors.username}
                helperText={errors.username}
                required
                disabled={!!user}
                InputProps={{
                  endAdornment: usernameAvailable !== null && (
                    usernameAvailable ? (
                      <CheckCircle color="success" sx={{ ml: 1 }} />
                    ) : (
                      <Error color="error" sx={{ ml: 1 }} />
                    )
                  ),
                }}
              />
            </Grid>
            {!user && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    error={!!errors.password}
                    helperText={errors.password}
                    required
                    InputProps={{
                      endAdornment: (
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      ),
                    }}
                  />
                  {formData.password && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Password Strength: {getPasswordStrengthText(passwordStrength)}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={passwordStrength}
                        color={getPasswordStrengthColor(passwordStrength)}
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Confirm Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    error={!!errors.confirmPassword}
                    helperText={errors.confirmPassword}
                    required
                    InputProps={{
                      endAdornment: (
                        <IconButton
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      ),
                    }}
                  />
                </Grid>
              </>
            )}
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role}
                  label="Role"
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  error={!!errors.role}
                >
                  <MenuItem value="student">Student</MenuItem>
                  <MenuItem value="teacher">Teacher</MenuItem>
                  <MenuItem value="hod">Head of Department</MenuItem>
                  <MenuItem value="admin">Administrator</MenuItem>
                </Select>
                {errors.role && (
                  <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                    {errors.role}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            {formData.role !== 'admin' && (
              <Grid item xs={12}>
                <FormControl fullWidth required={formData.role !== 'admin'}>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={formData.department}
                    label="Department"
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    error={!!errors.department}
                  >
                    {departments.map((dept) => (
                      <MenuItem key={dept._id} value={dept._id}>
                        {dept.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.department && (
                    <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                      {errors.department}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
            )}
            {availableGroups.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Assign to Groups
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, maxHeight: 200, overflow: 'auto' }}>
                  {availableGroups.map((group) => (
                    <FormControlLabel
                      key={group._id}
                      control={
                        <Checkbox
                          checked={formData.groups.includes(group._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleInputChange('groups', [...formData.groups, group._id]);
                            } else {
                              handleInputChange('groups', formData.groups.filter(id => id !== group._id));
                            }
                          }}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2">{group.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {group.students?.length || 0} students • Capacity: {group.maxCapacity}
                          </Typography>
                        </Box>
                      }
                    />
                  ))}
                </Paper>
              </Grid>
            )}
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  src={formData.profilePhoto ? URL.createObjectURL(formData.profilePhoto) : undefined}
                  sx={{ width: 80, height: 80, mr: 3 }}
                >
                  <PhotoCamera />
                </Avatar>
                <Box>
                  <Typography variant="h6">Profile Photo</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Upload a profile picture (optional)
                  </Typography>
                  <Button
                    variant="outlined"
                    component="label"
                    size="small"
                    sx={{ mt: 1 }}
                  >
                    Choose File
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleInputChange('profilePhoto', file);
                        }
                      }}
                    />
                  </Button>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                error={!!errors.phone}
                helperText={errors.phone}
                InputProps={{
                  startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Bio"
                multiline
                rows={4}
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                error={!!errors.bio}
                helperText={`${formData.bio.length}/500 characters`}
                placeholder="Tell us about yourself..."
              />
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review User Information
            </Typography>
            <Paper variant="outlined" sx={{ p: 3 }}>
              <List>
                <ListItem>
                  <ListItemIcon><Person /></ListItemIcon>
                  <ListItemText
                    primary="Full Name"
                    secondary={formData.fullName}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemIcon><Email /></ListItemIcon>
                  <ListItemText
                    primary="Email"
                    secondary={formData.email}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemIcon><Lock /></ListItemIcon>
                  <ListItemText
                    primary="Role"
                    secondary={formData.role.charAt(0).toUpperCase() + formData.role.slice(1)}
                  />
                </ListItem>
                {formData.department && (
                  <>
                    <Divider />
                    <ListItem>
                      <ListItemIcon><Business /></ListItemIcon>
                      <ListItemText
                        primary="Department"
                        secondary={departments.find(d => d._id === formData.department)?.name}
                      />
                    </ListItem>
                  </>
                )}
                {formData.groups.length > 0 && (
                  <>
                    <Divider />
                    <ListItem>
                      <ListItemIcon><Groups /></ListItemIcon>
                      <ListItemText
                        primary="Groups"
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            {formData.groups.map(groupId => {
                              const group = availableGroups.find(g => g._id === groupId);
                              return group ? (
                                <Chip
                                  key={groupId}
                                  label={group.name}
                                  size="small"
                                  sx={{ mr: 1, mb: 1 }}
                                />
                              ) : null;
                            })}
                          </Box>
                        }
                      />
                    </ListItem>
                  </>
                )}
                {formData.phone && (
                  <>
                    <Divider />
                    <ListItem>
                      <ListItemIcon><Phone /></ListItemIcon>
                      <ListItemText
                        primary="Phone"
                        secondary={formData.phone}
                      />
                    </ListItem>
                  </>
                )}
              </List>
            </Paper>
            <Box sx={{ mt: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.agreedToTerms}
                    onChange={(e) => handleInputChange('agreedToTerms', e.target.checked)}
                  />
                }
                label={
                  <Typography variant="body2">
                    I agree to the terms and conditions for user creation and management
                  </Typography>
                }
              />
              {errors.agreedToTerms && (
                <Typography variant="caption" color="error" sx={{ ml: 4, mt: 1, display: 'block' }}>
                  {errors.agreedToTerms}
                </Typography>
              )}
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          {user ? 'Edit User' : 'Create New User'}
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ mb: 4 }}>
          {renderStepContent(activeStep)}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            Back
          </Button>
          <Box>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Saving...' : (user ? 'Update User' : 'Create User')}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
};

export default UserForm;