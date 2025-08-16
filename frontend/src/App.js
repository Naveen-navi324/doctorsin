import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Badge } from './components/ui/badge';
import { Avatar, AvatarFallback } from './components/ui/avatar';
import { Textarea } from './components/ui/textarea';
import { Calendar } from './components/ui/calendar';
import { Separator } from './components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { toast } from 'sonner';
import { Toaster } from './components/ui/sonner';

// Import our new animation components
import { 
  PageTransition, 
  StaggerContainer, 
  StaggerItem, 
  AnimatedCard, 
  AnimatedButton, 
  AnimatedModal, 
  AnimatedCounter,
  FloatingButton 
} from './components/animations/AnimatedComponents';
import { 
  SkeletonLoader, 
  DoctorCardSkeleton, 
  DashboardCardSkeleton, 
  AppointmentCardSkeleton, 
  LoadingSpinner, 
  PageLoader 
} from './components/animations/LoadingStates';
import { 
  AnimatedInput, 
  StepProgress, 
  AnimatedForm, 
  AnimatedSelect 
} from './components/animations/FormAnimations';
import { 
  AnimatedStatCard, 
  AnimatedChart, 
  QuickActionButton, 
  ActivityItem, 
  WelcomeHeader, 
  FloatingWidget 
} from './components/animations/DashboardAnimations';
import { 
  AnimatedAppointmentCard, 
  AnimatedTimeSlot, 
  BookingProgress, 
  DoctorRating, 
  ConsultationTypeSelector 
} from './components/animations/AppointmentAnimations';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar as CalendarIcon, 
  Heart, 
  Shield, 
  Users, 
  Activity,
  LogOut,
  Home,
  Search,
  TestTube,
  Pill,
  Clock,
  MapPin,
  Star,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  DollarSign,
  BookOpen,
  Award,
  Stethoscope,
  Building,
  X,
  Check,
  FileText,
  CalendarCheck,
  CalendarX
} from 'lucide-react';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext();

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, { email, password });
      const { access_token, user: userData } = response.data;
      
      localStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setUser(userData);
      
      toast.success(`Welcome back, ${userData.name}!`);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.detail || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(`${API}/auth/register`, userData);
      const { access_token, user: newUser } = response.data;
      
      localStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setUser(newUser);
      
      toast.success(`Welcome to DocEase, ${newUser.name}!`);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.detail || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        register, 
        logout, 
        loading, 
        isAuthenticated: !!user 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Navigation Component
const Navigation = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white border-b-2 border-blue-100 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <div 
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <Heart className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">DocEase</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            <Button variant="ghost" onClick={() => navigate('/')}>
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
            <Button variant="ghost" onClick={() => navigate('/doctors')}>
              <Search className="h-4 w-4 mr-2" />
              Find Doctors
            </Button>
            <Button variant="ghost">
              <TestTube className="h-4 w-4 mr-2" />
              Lab Tests
            </Button>
            <Button variant="ghost">
              <Pill className="h-4 w-4 mr-2" />
              Pharmacy
            </Button>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Avatar>
                  <AvatarFallback className="bg-blue-600 text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <Badge variant="outline" className="text-xs">
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Badge>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/dashboard')}
              >
                Dashboard
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" onClick={() => navigate('/auth')}>
                Login
              </Button>
              <Button onClick={() => navigate('/auth')}>
                Sign Up
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

// Auth Page Component
const AuthPage = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'patient',
    phone: '',
    gender: '',
    age: ''
  });
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    // Clear error when user starts typing
    if (formErrors[e.target.name]) {
      setFormErrors(prev => ({ ...prev, [e.target.name]: '' }));
    }
  };

  const validateForm = (isLogin = true) => {
    const errors = {};
    if (!formData.email) errors.email = 'Email is required';
    if (!formData.password) errors.password = 'Password is required';
    if (!isLogin) {
      if (!formData.name) errors.name = 'Name is required';
      if (formData.password.length < 6) errors.password = 'Password must be at least 6 characters';
    }
    return errors;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const errors = validateForm(true);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setLoading(true);
    setFormErrors({});
    
    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      navigate('/dashboard');
    }
    
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const errors = validateForm(false);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setLoading(true);
    setFormErrors({});
    
    const registerData = {
      ...formData,
      age: formData.age ? parseInt(formData.age) : null
    };
    
    const result = await register(registerData);
    
    if (result.success) {
      navigate('/dashboard');
    }
    
    setLoading(false);
  };

  const roleOptions = [
    { value: 'patient', label: 'Patient' },
    { value: 'doctor', label: 'Doctor' }
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <AnimatedCard className="w-full max-w-md bg-white/80 backdrop-blur-sm border-0 shadow-2xl">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <CardHeader className="text-center pb-2">
                <motion.div 
                  className="flex justify-center mb-4"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full">
                    <Heart className="h-8 w-8 text-white" />
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Welcome to DocEase
                  </CardTitle>
                  <CardDescription className="text-gray-600 mt-2">
                    Your trusted healthcare companion
                  </CardDescription>
                </motion.div>
              </CardHeader>
            </motion.div>
            
            <CardContent className="pt-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="login" className="text-sm font-medium">Login</TabsTrigger>
                    <TabsTrigger value="register" className="text-sm font-medium">Register</TabsTrigger>
                  </TabsList>
                  
                  <AnimatePresence mode="wait">
                    <TabsContent value="login" key="login">
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <AnimatedForm onSubmit={handleLogin} className="space-y-6">
                          <StaggerContainer className="space-y-4">
                            <StaggerItem>
                              <AnimatedInput
                                label="Email Address"
                                name="email"
                                type="email"
                                placeholder="your@email.com"
                                value={formData.email}
                                onChange={handleInputChange}
                                error={formErrors.email}
                                icon={Mail}
                                required
                              />
                            </StaggerItem>
                            
                            <StaggerItem>
                              <AnimatedInput
                                label="Password"
                                name="password"
                                type="password"
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={handleInputChange}
                                error={formErrors.password}
                                required
                              />
                            </StaggerItem>
                          </StaggerContainer>
                          
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                          >
                            <AnimatedButton 
                              type="submit" 
                              className="w-full py-3 text-lg"
                              loading={loading}
                              variant="primary"
                            >
                              <User className="mr-2" size={18} />
                              Login to DocEase
                            </AnimatedButton>
                          </motion.div>
                        </AnimatedForm>
                      </motion.div>
                    </TabsContent>
                    
                    <TabsContent value="register" key="register">
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <AnimatedForm onSubmit={handleRegister} className="space-y-4">
                          <StaggerContainer className="space-y-4" delay={0.05}>
                            <StaggerItem>
                              <AnimatedInput
                                label="Full Name"
                                name="name"
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={handleInputChange}
                                error={formErrors.name}
                                icon={User}
                                required
                              />
                            </StaggerItem>
                            
                            <StaggerItem>
                              <AnimatedInput
                                label="Email Address"
                                name="email"
                                type="email"
                                placeholder="your@email.com"
                                value={formData.email}
                                onChange={handleInputChange}
                                error={formErrors.email}
                                icon={Mail}
                                required
                              />
                            </StaggerItem>
                            
                            <StaggerItem>
                              <AnimatedInput
                                label="Password"
                                name="password"
                                type="password"
                                placeholder="Create a secure password"
                                value={formData.password}
                                onChange={handleInputChange}
                                error={formErrors.password}
                                required
                              />
                            </StaggerItem>
                            
                            <StaggerItem>
                              <AnimatedSelect
                                label="I am a"
                                options={roleOptions}
                                value={formData.role}
                                onChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
                                placeholder="Select your role"
                              />
                            </StaggerItem>
                            
                            <StaggerItem>
                              <div className="grid grid-cols-2 gap-4">
                                <AnimatedInput
                                  label="Phone (Optional)"
                                  name="phone"
                                  placeholder="+1234567890"
                                  value={formData.phone}
                                  onChange={handleInputChange}
                                  icon={Phone}
                                />
                                
                                <AnimatedInput
                                  label="Age (Optional)"
                                  name="age"
                                  type="number"
                                  placeholder="25"
                                  value={formData.age}
                                  onChange={handleInputChange}
                                />
                              </div>
                            </StaggerItem>
                          </StaggerContainer>
                          
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                          >
                            <AnimatedButton 
                              type="submit" 
                              className="w-full py-3 text-lg"
                              loading={loading}
                              variant="success"
                            >
                              <Heart className="mr-2" size={18} />
                              Join DocEase
                            </AnimatedButton>
                          </motion.div>
                        </AnimatedForm>
                      </motion.div>
                    </TabsContent>
                  </AnimatePresence>
                </Tabs>
              </motion.div>
            </CardContent>
          </AnimatedCard>
        </motion.div>
      </div>
    </PageTransition>
  );
};

// Doctor Profile Management Component
const DoctorProfileManagement = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    bio: '',
    specializations: [],
    qualifications: [],
    experience_years: '',
    license_number: '',
    consultation_fee_online: '',
    consultation_fee_clinic: '',
    consultation_types: ['both'],
    clinic_info: {
      name: '',
      address: '',
      city: '',
      state: '',
      zipcode: '',
      phone: '',
      facilities: []
    }
  });

  // Availability form state
  const [availabilityForm, setAvailabilityForm] = useState({
    date: '',
    start_time: '',
    end_time: '',
    consultation_type: 'both'
  });

  useEffect(() => {
    fetchProfile();
    fetchAvailability();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API}/doctor/profile`);
      setProfile(response.data);
      setProfileForm({
        bio: response.data.bio || '',
        specializations: response.data.specializations || [],
        qualifications: response.data.qualifications || [],
        experience_years: response.data.experience_years || '',
        license_number: response.data.license_number || '',
        consultation_fee_online: response.data.consultation_fee_online || '',
        consultation_fee_clinic: response.data.consultation_fee_clinic || '',
        consultation_types: response.data.consultation_types || ['both'],
        clinic_info: response.data.clinic_info || {
          name: '',
          address: '',
          city: '',
          state: '',
          zipcode: '',
          phone: '',
          facilities: []
        }
      });
    } catch (error) {
      if (error.response?.status !== 404) {
        toast.error('Error fetching profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailability = async () => {
    try {
      const response = await axios.get(`${API}/doctor/availability`);
      setAvailability(response.data);
    } catch (error) {
      console.error('Error fetching availability:', error);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...profileForm,
        experience_years: profileForm.experience_years ? parseInt(profileForm.experience_years) : null,
        consultation_fee_online: profileForm.consultation_fee_online ? parseFloat(profileForm.consultation_fee_online) : null,
        consultation_fee_clinic: profileForm.consultation_fee_clinic ? parseFloat(profileForm.consultation_fee_clinic) : null,
      };

      if (profile) {
        await axios.put(`${API}/doctor/profile`, data);
        toast.success('Profile updated successfully!');
      } else {
        await axios.post(`${API}/doctor/profile`, data);
        toast.success('Profile created successfully!');
      }
      
      fetchProfile();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error saving profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAvailabilitySubmit = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post(`${API}/doctor/availability`, availabilityForm);
      toast.success('Availability slot added successfully!');
      setAvailabilityForm({
        date: '',
        start_time: '',
        end_time: '',
        consultation_type: 'both'
      });
      fetchAvailability();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error adding availability');
    }
  };

  const deleteAvailabilitySlot = async (slotId) => {
    try {
      await axios.delete(`${API}/doctor/availability/${slotId}`);
      toast.success('Availability slot deleted successfully!');
      fetchAvailability();
    } catch (error) {
      toast.error('Error deleting availability slot');
    }
  };

  const handleArrayInput = (field, value) => {
    const items = value.split(',').map(item => item.trim()).filter(item => item);
    setProfileForm(prev => ({
      ...prev,
      [field]: items
    }));
  };

  if (loading && !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Heart className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dr. {user.name} - Profile Management
        </h1>
        <p className="text-gray-600">Manage your professional profile and availability</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile">Profile Information</TabsTrigger>
          <TabsTrigger value="availability">Availability Management</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Professional Profile
              </CardTitle>
              <CardDescription>
                Update your professional information to help patients find and trust you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                {/* Bio Section */}
                <div className="space-y-2">
                  <Label htmlFor="bio">Professional Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell patients about yourself, your approach to healthcare, and what makes you unique..."
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                    rows={4}
                  />
                </div>

                {/* Specializations */}
                <div className="space-y-2">
                  <Label htmlFor="specializations">Specializations</Label>
                  <Input
                    id="specializations"
                    placeholder="e.g., Cardiology, Internal Medicine, Pediatrics (comma separated)"
                    value={profileForm.specializations.join(', ')}
                    onChange={(e) => handleArrayInput('specializations', e.target.value)}
                  />
                </div>

                {/* Qualifications */}
                <div className="space-y-2">
                  <Label htmlFor="qualifications">Qualifications</Label>
                  <Input
                    id="qualifications"
                    placeholder="e.g., MBBS, MD, FRCS (comma separated)"
                    value={profileForm.qualifications.join(', ')}
                    onChange={(e) => handleArrayInput('qualifications', e.target.value)}
                  />
                </div>

                {/* Experience and License */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="experience_years">Years of Experience</Label>
                    <Input
                      id="experience_years"
                      type="number"
                      placeholder="5"
                      value={profileForm.experience_years}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, experience_years: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="license_number">Medical License Number</Label>
                    <Input
                      id="license_number"
                      placeholder="MED12345"
                      value={profileForm.license_number}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, license_number: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Consultation Fees */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="consultation_fee_online">Online Consultation Fee ($)</Label>
                    <Input
                      id="consultation_fee_online"
                      type="number"
                      placeholder="50"
                      value={profileForm.consultation_fee_online}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, consultation_fee_online: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="consultation_fee_clinic">Clinic Consultation Fee ($)</Label>
                    <Input
                      id="consultation_fee_clinic"
                      type="number"
                      placeholder="100"
                      value={profileForm.consultation_fee_clinic}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, consultation_fee_clinic: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Consultation Types */}
                <div className="space-y-2">
                  <Label>Consultation Types Offered</Label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={profileForm.consultation_types.includes('online')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setProfileForm(prev => ({
                              ...prev,
                              consultation_types: [...prev.consultation_types, 'online']
                            }));
                          } else {
                            setProfileForm(prev => ({
                              ...prev,
                              consultation_types: prev.consultation_types.filter(t => t !== 'online')
                            }));
                          }
                        }}
                        className="mr-2"
                      />
                      Online Consultations
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={profileForm.consultation_types.includes('clinic')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setProfileForm(prev => ({
                              ...prev,
                              consultation_types: [...prev.consultation_types, 'clinic']
                            }));
                          } else {
                            setProfileForm(prev => ({
                              ...prev,
                              consultation_types: prev.consultation_types.filter(t => t !== 'clinic')
                            }));
                          }
                        }}
                        className="mr-2"
                      />
                      Clinic Consultations
                    </label>
                  </div>
                </div>

                <Separator />

                {/* Clinic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Building className="h-5 w-5 mr-2" />
                    Clinic Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="clinic_name">Clinic Name</Label>
                      <Input
                        id="clinic_name"
                        placeholder="City Medical Center"
                        value={profileForm.clinic_info.name}
                        onChange={(e) => setProfileForm(prev => ({
                          ...prev,
                          clinic_info: { ...prev.clinic_info, name: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clinic_phone">Clinic Phone</Label>
                      <Input
                        id="clinic_phone"
                        placeholder="+1234567890"
                        value={profileForm.clinic_info.phone}
                        onChange={(e) => setProfileForm(prev => ({
                          ...prev,
                          clinic_info: { ...prev.clinic_info, phone: e.target.value }
                        }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clinic_address">Clinic Address</Label>
                    <Input
                      id="clinic_address"
                      placeholder="123 Medical Street"
                      value={profileForm.clinic_info.address}
                      onChange={(e) => setProfileForm(prev => ({
                        ...prev,
                        clinic_info: { ...prev.clinic_info, address: e.target.value }
                      }))}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="clinic_city">City</Label>
                      <Input
                        id="clinic_city"
                        placeholder="New York"
                        value={profileForm.clinic_info.city}
                        onChange={(e) => setProfileForm(prev => ({
                          ...prev,
                          clinic_info: { ...prev.clinic_info, city: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clinic_state">State</Label>
                      <Input
                        id="clinic_state"
                        placeholder="NY"
                        value={profileForm.clinic_info.state}
                        onChange={(e) => setProfileForm(prev => ({
                          ...prev,
                          clinic_info: { ...prev.clinic_info, state: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clinic_zipcode">ZIP Code</Label>
                      <Input
                        id="clinic_zipcode"
                        placeholder="10001"
                        value={profileForm.clinic_info.zipcode}
                        onChange={(e) => setProfileForm(prev => ({
                          ...prev,
                          clinic_info: { ...prev.clinic_info, zipcode: e.target.value }
                        }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clinic_facilities">Clinic Facilities</Label>
                    <Input
                      id="clinic_facilities"
                      placeholder="e.g., X-Ray, ECG, Blood Tests (comma separated)"
                      value={profileForm.clinic_info.facilities.join(', ')}
                      onChange={(e) => {
                        const facilities = e.target.value.split(',').map(item => item.trim()).filter(item => item);
                        setProfileForm(prev => ({
                          ...prev,
                          clinic_info: { ...prev.clinic_info, facilities }
                        }));
                      }}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Saving...' : profile ? 'Update Profile' : 'Create Profile'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="availability" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Add Availability Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="h-5 w-5 mr-2" />
                  Add Availability Slot
                </CardTitle>
                <CardDescription>
                  Set your available time slots for appointments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAvailabilitySubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="slot_date">Date</Label>
                    <Input
                      id="slot_date"
                      type="date"
                      value={availabilityForm.date}
                      onChange={(e) => setAvailabilityForm(prev => ({ ...prev, date: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_time">Start Time</Label>
                      <Input
                        id="start_time"
                        type="time"
                        value={availabilityForm.start_time}
                        onChange={(e) => setAvailabilityForm(prev => ({ ...prev, start_time: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_time">End Time</Label>
                      <Input
                        id="end_time"
                        type="time"
                        value={availabilityForm.end_time}
                        onChange={(e) => setAvailabilityForm(prev => ({ ...prev, end_time: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="consultation_type">Consultation Type</Label>
                    <select
                      id="consultation_type"
                      value={availabilityForm.consultation_type}
                      onChange={(e) => setAvailabilityForm(prev => ({ ...prev, consultation_type: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="both">Both Online & Clinic</option>
                      <option value="online">Online Only</option>
                      <option value="clinic">Clinic Only</option>
                    </select>
                  </div>

                  <Button type="submit" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Slot
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Current Availability */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  Current Availability
                </CardTitle>
                <CardDescription>
                  Your upcoming available time slots
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {availability.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No availability slots added yet</p>
                    </div>
                  ) : (
                    availability.map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <CalendarIcon className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">
                              {new Date(slot.date).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 mt-1 text-sm text-gray-600">
                            <Clock className="h-3 w-3" />
                            <span>{slot.start_time} - {slot.end_time}</span>
                          </div>
                          <Badge variant="outline" className="mt-1">
                            {slot.consultation_type}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteAvailabilitySlot(slot.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Appointment Booking Modal Component
const AppointmentBookingModal = ({ doctor, onClose, onBookingSuccess }) => {
  const { user } = useAuth();
  const [availability, setAvailability] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    reason: '',
    symptoms: '',
    notes: ''
  });
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [step, setStep] = useState(1); // 1: Select slot, 2: Fill details, 3: Confirm

  useEffect(() => {
    if (doctor) {
      fetchDoctorAvailability();
    }
  }, [doctor]);

  const fetchDoctorAvailability = async () => {
    try {
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const response = await axios.get(
        `${API}/doctor/${doctor.user_id}/availability?start_date=${today.toISOString().split('T')[0]}&end_date=${nextWeek.toISOString().split('T')[0]}`
      );
      setAvailability(response.data);
    } catch (error) {
      toast.error('Error fetching doctor availability');
    } finally {
      setLoading(false);
    }
  };

  const handleSlotSelection = (slot) => {
    setSelectedSlot(slot);
    setStep(2);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlot) return;

    setBooking(true);

    try {
      const appointmentData = {
        doctor_id: doctor.user_id,
        availability_slot_id: selectedSlot.id,
        consultation_type: selectedSlot.consultation_type,
        appointment_date: selectedSlot.date,
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
        reason: bookingForm.reason,
        symptoms: bookingForm.symptoms,
        notes: bookingForm.notes
      };

      await axios.post(`${API}/appointments`, appointmentData);
      
      toast.success('Appointment booked successfully!');
      onBookingSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error booking appointment');
    } finally {
      setBooking(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(`1970-01-01T${timeString}:00`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getConsultationFee = () => {
    if (selectedSlot?.consultation_type === 'online') {
      return doctor.consultation_fee_online;
    } else if (selectedSlot?.consultation_type === 'clinic') {
      return doctor.consultation_fee_clinic;
    }
    return null;
  };

  if (!user || user.role !== 'patient') {
    return (
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Login Required</DialogTitle>
          <DialogDescription>
            Please login as a patient to book appointments.
          </DialogDescription>
        </DialogHeader>
        <Button onClick={onClose}>Close</Button>
      </DialogContent>
    );
  }

  return (
    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center">
          <CalendarIcon className="h-6 w-6 mr-2 text-blue-600" />
          Book Appointment with Dr. {doctor.user_name}
        </DialogTitle>
        <DialogDescription>
          {step === 1 && "Select an available time slot"}
          {step === 2 && "Provide appointment details"}
          {step === 3 && "Confirm your appointment"}
        </DialogDescription>
      </DialogHeader>

      <div className="mt-4">
        {/* Progress Indicators */}
        <div className="flex items-center justify-center space-x-4 mb-6">
          <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'}`}>
              1
            </div>
            <span className="ml-2 text-sm font-medium">Select Slot</span>
          </div>
          <div className={`w-8 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
          <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'}`}>
              2
            </div>
            <span className="ml-2 text-sm font-medium">Details</span>
          </div>
          <div className={`w-8 h-1 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
          <div className={`flex items-center ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 3 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'}`}>
              3
            </div>
            <span className="ml-2 text-sm font-medium">Confirm</span>
          </div>
        </div>

        {/* Step 1: Slot Selection */}
        {step === 1 && (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Available Time Slots</h3>
              <p className="text-gray-600 text-sm">Select a convenient time slot from the available options below.</p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Clock className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
                  <p className="text-gray-600">Loading availability...</p>
                </div>
              </div>
            ) : availability.length === 0 ? (
              <div className="text-center py-8">
                <CalendarX className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Available Slots</h3>
                <p className="text-gray-600">This doctor doesn't have any available slots in the next week.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {availability.map((slot) => (
                  <Card 
                    key={slot.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-blue-200"
                    onClick={() => handleSlotSelection(slot)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <CalendarIcon className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">{formatDate(slot.date)}</span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatTime(slot.start_time)} - {formatTime(slot.end_time)}</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {slot.consultation_type === 'online' ? '💻 Online' : 
                               slot.consultation_type === 'clinic' ? '🏥 Clinic' : '🔄 Both'}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-green-600">
                            ${slot.consultation_type === 'online' ? doctor.consultation_fee_online : doctor.consultation_fee_clinic}
                          </div>
                          <Button size="sm" className="mt-2">
                            Select Slot
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="flex justify-end mt-6">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Appointment Details */}
        {step === 2 && selectedSlot && (
          <div>
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Selected Time Slot</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Date:</span> {formatDate(selectedSlot.date)}
                </div>
                <div>
                  <span className="font-medium">Time:</span> {formatTime(selectedSlot.start_time)} - {formatTime(selectedSlot.end_time)}
                </div>
                <div>
                  <span className="font-medium">Type:</span> {selectedSlot.consultation_type}
                </div>
                <div>
                  <span className="font-medium">Fee:</span> ${getConsultationFee()}
                </div>
              </div>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Visit *</Label>
                <Input
                  id="reason"
                  placeholder="e.g., Regular checkup, Follow-up, Specific concern"
                  value={bookingForm.reason}
                  onChange={(e) => setBookingForm(prev => ({ ...prev, reason: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="symptoms">Current Symptoms (Optional)</Label>
                <Textarea
                  id="symptoms"
                  placeholder="Describe any symptoms you're experiencing..."
                  value={bookingForm.symptoms}
                  onChange={(e) => setBookingForm(prev => ({ ...prev, symptoms: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional information for the doctor..."
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="flex justify-between pt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setStep(1)}
                >
                  Back to Slots
                </Button>
                <Button 
                  type="submit" 
                  disabled={!bookingForm.reason.trim() || booking}
                  className="min-w-32"
                >
                  {booking ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Booking...
                    </div>
                  ) : (
                    'Book Appointment'
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </DialogContent>
  );
};

// Doctor Directory Component
const DoctorDirectory = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [filters, setFilters] = useState({
    specialization: '',
    city: '',
    consultation_type: ''
  });

  useEffect(() => {
    fetchDoctors();
  }, [filters]);

  const fetchDoctors = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.specialization) params.append('specialization', filters.specialization);
      if (filters.city) params.append('city', filters.city);
      if (filters.consultation_type) params.append('consultation_type', filters.consultation_type);
      
      const response = await axios.get(`${API}/doctors?${params}`);
      setDoctors(response.data);
    } catch (error) {
      toast.error('Error fetching doctors');
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setFilters({
      specialization: '',
      city: '',
      consultation_type: ''
    });
  };

  const handleBookAppointment = (doctor) => {
    setSelectedDoctor(doctor);
    setShowBookingModal(true);
  };

  const handleBookingSuccess = () => {
    // Refresh doctors list to get updated availability
    fetchDoctors();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Doctors</h1>
          <p className="text-gray-600">Browse and connect with qualified healthcare professionals</p>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              Search Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization</Label>
                <Input
                  id="specialization"
                  placeholder="e.g. Cardiology"
                  value={filters.specialization}
                  onChange={(e) => setFilters(prev => ({ ...prev, specialization: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="e.g. New York"
                  value={filters.city}
                  onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="consultation_type">Consultation Type</Label>
                <select
                  id="consultation_type"
                  value={filters.consultation_type}
                  onChange={(e) => setFilters(prev => ({ ...prev, consultation_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="online">Online Only</option>
                  <option value="clinic">Clinic Only</option>
                  <option value="both">Both</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <Button variant="outline" onClick={resetFilters} className="w-full">
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Doctor List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Heart className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
              <p className="text-gray-600">Loading doctors...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No doctors found</h3>
                <p className="text-gray-600">Try adjusting your search filters</p>
              </div>
            ) : (
              doctors.map((doctor) => (
                <Card key={doctor.id} className="doctor-card">
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-blue-600 text-white">
                          {doctor.user_name?.charAt(0).toUpperCase() || 'D'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <CardTitle className="text-lg">Dr. {doctor.user_name}</CardTitle>
                        <div className="flex items-center space-x-1 mt-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="text-sm text-gray-600">
                            {doctor.rating.toFixed(1)} ({doctor.total_reviews} reviews)
                          </span>
                        </div>
                      </div>
                      {doctor.is_verified && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Specializations */}
                    <div>
                      <div className="flex flex-wrap gap-1">
                        {doctor.specializations.slice(0, 3).map((spec, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                        {doctor.specializations.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{doctor.specializations.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Experience */}
                    {doctor.experience_years && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Award className="h-4 w-4" />
                        <span>{doctor.experience_years} years experience</span>
                      </div>
                    )}

                    {/* Location */}
                    {doctor.clinic_info?.city && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{doctor.clinic_info.city}, {doctor.clinic_info.state}</span>
                      </div>
                    )}

                    {/* Consultation Fees */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        {doctor.consultation_fee_online && (
                          <div className="flex items-center space-x-2 text-sm">
                            <DollarSign className="h-3 w-3 text-green-600" />
                            <span>Online: ${doctor.consultation_fee_online}</span>
                          </div>
                        )}
                        {doctor.consultation_fee_clinic && (
                          <div className="flex items-center space-x-2 text-sm">
                            <DollarSign className="h-3 w-3 text-blue-600" />
                            <span>Clinic: ${doctor.consultation_fee_clinic}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Consultation Types */}
                    <div className="flex flex-wrap gap-1">
                      {doctor.consultation_types.map((type, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {type === 'online' ? '💻 Online' : type === 'clinic' ? '🏥 Clinic' : '🔄 Both'}
                        </Badge>
                      ))}
                    </div>

                    {/* Book Button */}
                    <Button 
                      className="w-full" 
                      onClick={() => handleBookAppointment(doctor)}
                    >
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Book Appointment
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      {/* Appointment Booking Modal */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <AppointmentBookingModal
          doctor={selectedDoctor}
          onClose={() => setShowBookingModal(false)}
          onBookingSuccess={handleBookingSuccess}
        />
      </Dialog>
    </div>
  );
};

// Appointment Management Components
const AppointmentCard = ({ appointment, userRole, onStatusUpdate, onCancel }) => {
  const [updating, setUpdating] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(`1970-01-01T${timeString}:00`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleStatusUpdate = async (newStatus, reason = null) => {
    setUpdating(true);
    try {
      const updateData = { 
        status: newStatus,
        cancellation_reason: reason
      };
      
      await axios.put(`${API}/appointments/${appointment.id}`, updateData);
      toast.success(`Appointment ${newStatus} successfully!`);
      onStatusUpdate();
    } catch (error) {
      toast.error(error.response?.data?.detail || `Error updating appointment`);
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      await handleStatusUpdate('cancelled', 'Cancelled by user');
    }
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-blue-600 text-white">
                  {userRole === 'patient' 
                    ? appointment.doctor_name?.charAt(0).toUpperCase() || 'D'
                    : appointment.patient_name?.charAt(0).toUpperCase() || 'P'
                  }
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">
                  {userRole === 'patient' ? `Dr. ${appointment.doctor_name}` : appointment.patient_name}
                </h3>
                {appointment.doctor_specializations && appointment.doctor_specializations.length > 0 && (
                  <p className="text-sm text-gray-600">
                    {appointment.doctor_specializations.join(', ')}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-4 w-4 text-gray-400" />
                <span>{formatDate(appointment.appointment_date)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span>{formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  {appointment.consultation_type === 'online' ? '💻 Online' : '🏥 Clinic'}
                </Badge>
              </div>
              {appointment.consultation_fee && (
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span>${appointment.consultation_fee}</span>
                </div>
              )}
            </div>

            {appointment.reason && (
              <div className="mt-3">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Reason:</span> {appointment.reason}
                </p>
              </div>
            )}

            {appointment.symptoms && (
              <div className="mt-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Symptoms:</span> {appointment.symptoms}
                </p>
              </div>
            )}

            {appointment.notes && (
              <div className="mt-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Notes:</span> {appointment.notes}
                </p>
              </div>
            )}
          </div>

          <div className="ml-6 flex flex-col items-end space-y-2">
            <Badge className={`px-3 py-1 text-xs font-medium border ${getStatusColor(appointment.status)}`}>
              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
            </Badge>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              {userRole === 'doctor' && appointment.status === 'pending' && (
                <Button
                  size="sm"
                  onClick={() => handleStatusUpdate('confirmed')}
                  disabled={updating}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Confirm
                </Button>
              )}

              {userRole === 'doctor' && appointment.status === 'confirmed' && (
                <Button
                  size="sm"
                  onClick={() => handleStatusUpdate('completed')}
                  disabled={updating}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <CalendarCheck className="h-3 w-3 mr-1" />
                  Complete
                </Button>
              )}

              {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleCancel}
                  disabled={updating}
                >
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const AppointmentsList = ({ userRole }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, upcoming, past

  useEffect(() => {
    fetchAppointments();
  }, [filter]);

  const fetchAppointments = async () => {
    try {
      let params = '';
      if (filter === 'upcoming') {
        const today = new Date().toISOString().split('T')[0];
        params = `?start_date=${today}`;
      } else if (filter === 'past') {
        const today = new Date().toISOString().split('T')[0];
        params = `?end_date=${today}`;
      }

      const response = await axios.get(`${API}/appointments${params}`);
      setAppointments(response.data);
    } catch (error) {
      toast.error('Error fetching appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = () => {
    fetchAppointments();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <CalendarIcon className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">My Appointments</h2>
        
        {/* Filter Buttons */}
        <div className="flex space-x-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'upcoming' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('upcoming')}
          >
            Upcoming
          </Button>
          <Button
            variant={filter === 'past' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('past')}
          >
            Past
          </Button>
        </div>
      </div>

      {appointments.length === 0 ? (
        <div className="text-center py-12">
          <CalendarX className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Appointments Found</h3>
          <p className="text-gray-600">
            {filter === 'all' 
              ? "You don't have any appointments yet."
              : filter === 'upcoming'
              ? "You don't have any upcoming appointments."
              : "You don't have any past appointments."
            }
          </p>
        </div>
      ) : (
        <div>
          {appointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              userRole={userRole}
              onStatusUpdate={handleStatusUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Appointments Page Wrapper
const AppointmentsPage = () => {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <AppointmentsList userRole={user?.role} />
      </div>
    </div>
  );
};

// Dashboard Components
const PatientDashboard = ({ user }) => {
  const [appointmentStats, setAppointmentStats] = useState({
    upcoming: 0,
    total: 0,
    recentAppointments: []
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAppointmentStats();
  }, []);

  const fetchAppointmentStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch upcoming appointments
      const upcomingResponse = await axios.get(`${API}/appointments?start_date=${today}`);
      const upcoming = upcomingResponse.data;

      // Fetch all appointments for total count
      const allResponse = await axios.get(`${API}/appointments`);
      const all = allResponse.data;

      // Get recent appointments (last 5)
      const recent = all
        .sort((a, b) => new Date(b.appointment_date) - new Date(a.appointment_date))
        .slice(0, 5);

      setAppointmentStats({
        upcoming: upcoming.length,
        total: all.length,
        recentAppointments: recent
      });
    } catch (error) {
      console.error('Error fetching appointment stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(`1970-01-01T${timeString}:00`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user.name}!
        </h1>
        <Badge variant="outline" className="text-sm">
          <User className="h-4 w-4 mr-1" />
          Patient
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : appointmentStats.upcoming}
            </div>
            <p className="text-xs text-muted-foreground">
              {appointmentStats.upcoming === 0 
                ? 'No appointments scheduled'
                : `${appointmentStats.upcoming} appointment${appointmentStats.upcoming > 1 ? 's' : ''} coming up`
              }
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : appointmentStats.total}
            </div>
            <p className="text-xs text-muted-foreground">
              {appointmentStats.total === 0 
                ? 'No appointments yet'
                : 'Lifetime appointments'
              }
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prescriptions</CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">No active prescriptions</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Appointments */}
      {appointmentStats.recentAppointments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2" />
              Recent Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {appointmentStats.recentAppointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-600 text-white text-xs">
                        {appointment.doctor_name?.charAt(0).toUpperCase() || 'D'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">Dr. {appointment.doctor_name}</p>
                      <p className="text-xs text-gray-600">{appointment.reason}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatDate(appointment.appointment_date)}</p>
                    <p className="text-xs text-gray-600">{formatTime(appointment.start_time)}</p>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      appointment.status === 'completed' ? 'border-green-200 text-green-700' :
                      appointment.status === 'confirmed' ? 'border-blue-200 text-blue-700' :
                      appointment.status === 'cancelled' ? 'border-red-200 text-red-700' :
                      'border-yellow-200 text-yellow-700'
                    }`}
                  >
                    {appointment.status}
                  </Badge>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/appointments')}
              >
                View All Appointments
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button onClick={() => navigate('/doctors')}>
            <Search className="h-4 w-4 mr-2" />
            Find Doctors
          </Button>
          <Button variant="outline" onClick={() => navigate('/appointments')}>
            <CalendarIcon className="h-4 w-4 mr-2" />
            My Appointments
          </Button>
          <Button variant="outline">
            <TestTube className="h-4 w-4 mr-2" />
            Lab Tests
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

const DoctorDashboard = ({ user, dashboardData }) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">
          Dr. {user.name}
        </h1>
        <Badge variant="outline" className="text-sm">
          <Shield className="h-4 w-4 mr-1" />
          Doctor
        </Badge>
      </div>

      {!dashboardData?.has_profile && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-800">
              <AlertCircle className="h-5 w-5 mr-2" />
              Complete Your Profile
            </CardTitle>
            <CardDescription className="text-orange-700">
              Create your professional profile to start receiving appointments from patients.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/doctor/profile')} className="bg-orange-600 hover:bg-orange-700">
              <User className="h-4 w-4 mr-2" />
              Create Profile
            </Button>
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Availability</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.today_availability_slots || 0}</div>
            <p className="text-xs text-muted-foreground">Available slots today</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">No patients yet</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Earnings</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0</div>
            <p className="text-xs text-muted-foreground">No earnings this month</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button onClick={() => navigate('/doctor/profile')}>
            <User className="h-4 w-4 mr-2" />
            {dashboardData?.has_profile ? 'Manage Profile' : 'Create Profile'}
          </Button>
          <Button variant="outline" onClick={() => navigate('/doctor/profile')}>
            <CalendarIcon className="h-4 w-4 mr-2" />
            Manage Schedule
          </Button>
          <Button variant="outline">
            <Users className="h-4 w-4 mr-2" />
            View Patients
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

const AdminDashboard = ({ user }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">
          Admin Dashboard
        </h1>
        <Badge variant="outline" className="text-sm">
          <Shield className="h-4 w-4 mr-1" />
          Administrator
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">System users</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doctors</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Registered doctors</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patients</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Registered patients</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Management Tools</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button>
            <Users className="h-4 w-4 mr-2" />
            Manage Users
          </Button>
          <Button variant="outline">
            <Shield className="h-4 w-4 mr-2" />
            System Settings
          </Button>
          <Button variant="outline">
            <Activity className="h-4 w-4 mr-2" />
            Analytics
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

// Dashboard Page
const DashboardPage = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/${user.role}`);
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderDashboard = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Heart className="h-12 w-12 text-blue-600 animate-pulse" />
        </div>
      );
    }

    switch (user?.role) {
      case 'patient':
        return <PatientDashboard user={user} />;
      case 'doctor':
        return <DoctorDashboard user={user} dashboardData={dashboardData} />;
      case 'admin':
        return <AdminDashboard user={user} />;
      default:
        return <div>Invalid user role</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-6 py-8">
        {renderDashboard()}
      </div>
    </div>
  );
};

// Home Page
const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      icon: Search,
      title: "Find Doctors",
      description: "Search and connect with qualified doctors in your area",
      color: "blue"
    },
    {
      icon: CalendarIcon,
      title: "Book Appointments", 
      description: "Schedule appointments online with ease and convenience",
      color: "green"
    },
    {
      icon: Activity,
      title: "Manage Health",
      description: "Keep track of your health records and prescriptions", 
      color: "purple"
    }
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 relative overflow-hidden">
        {/* Animated Background Elements */}
        <motion.div
          className="absolute top-20 left-20 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30"
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-40 right-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30"
          animate={{
            x: [0, -50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute -bottom-20 left-1/2 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30"
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <Navigation />
        
        <div className="max-w-7xl mx-auto px-6 py-16 relative z-10">
          {/* Hero Section */}
          <div className="text-center space-y-8">
            <StaggerContainer className="space-y-6">
              <StaggerItem>
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="flex justify-center mb-8"
                >
                  <div className="p-4 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full shadow-2xl">
                    <Heart className="h-16 w-16 text-white" />
                  </div>
                </motion.div>
              </StaggerItem>
              
              <StaggerItem>
                <motion.h1 
                  className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent leading-tight"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                >
                  Your Health,
                  <br />
                  <motion.span
                    animate={{ 
                      backgroundPosition: ["0%", "100%", "0%"] 
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                    className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent bg-300% animate-gradient"
                  >
                    Our Priority
                  </motion.span>
                </motion.h1>
              </StaggerItem>
              
              <StaggerItem>
                <motion.p 
                  className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  Connect with trusted doctors, book appointments seamlessly, 
                  manage prescriptions, and take control of your healthcare journey 
                  with <span className="font-semibold text-blue-600">DocEase</span>.
                </motion.p>
              </StaggerItem>
            </StaggerContainer>
            
            {/* Action Buttons */}
            <motion.div 
              className="flex flex-wrap justify-center gap-6 pt-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              {user ? (
                <AnimatedButton
                  onClick={() => navigate('/dashboard')}
                  className="px-10 py-4 text-xl font-semibold shadow-2xl"
                  variant="primary"
                >
                  <Activity className="mr-3" size={24} />
                  Go to Dashboard
                </AnimatedButton>
              ) : (
                <>
                  <AnimatedButton
                    onClick={() => navigate('/auth')}
                    className="px-10 py-4 text-xl font-semibold shadow-2xl"
                    variant="primary"
                  >
                    <Heart className="mr-3" size={24} />
                    Get Started
                  </AnimatedButton>
                  <AnimatedButton
                    onClick={() => navigate('/doctors')}
                    className="px-10 py-4 text-xl font-semibold shadow-xl"
                    variant="secondary"
                  >
                    <Search className="mr-3" size={24} />
                    Browse Doctors
                  </AnimatedButton>
                </>
              )}
            </motion.div>
          </div>
          
          {/* Features Section */}
          <motion.div 
            className="mt-24"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Why Choose DocEase?
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Experience healthcare like never before with our comprehensive platform
              </p>
            </motion.div>
            
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8" delay={0.15}>
              {features.map((feature, index) => {
                const Icon = feature.icon;
                const colorClasses = {
                  blue: "from-blue-500 to-blue-600",
                  green: "from-green-500 to-green-600", 
                  purple: "from-purple-500 to-purple-600"
                };
                
                return (
                  <StaggerItem key={index}>
                    <AnimatedCard className="text-center h-full bg-white/70 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl">
                      <CardHeader className="pb-4">
                        <motion.div
                          className="flex justify-center mb-6"
                          whileHover={{ 
                            scale: 1.1,
                            rotate: [0, -5, 5, 0]
                          }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className={`p-4 bg-gradient-to-r ${colorClasses[feature.color]} rounded-2xl shadow-lg`}>
                            <Icon className="h-12 w-12 text-white" />
                          </div>
                        </motion.div>
                        <CardTitle className="text-2xl font-bold text-gray-900">
                          {feature.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 text-lg leading-relaxed">
                          {feature.description}
                        </p>
                      </CardContent>
                    </AnimatedCard>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </motion.div>
          
          {/* Call to Action */}
          {!user && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              className="text-center mt-20 p-8 bg-white/60 backdrop-blur-sm rounded-3xl shadow-xl"
            >
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Ready to Transform Your Healthcare Experience?
              </h3>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Join thousands of patients and doctors who trust DocEase for their healthcare needs.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <AnimatedButton
                  onClick={() => navigate('/auth')}
                  className="px-8 py-3 text-lg font-semibold"
                  variant="primary"
                >
                  Join as Patient
                </AnimatedButton>
                <AnimatedButton
                  onClick={() => navigate('/auth')}
                  className="px-8 py-3 text-lg font-semibold"
                  variant="success"
                >
                  Join as Doctor
                </AnimatedButton>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Heart className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/auth" replace />;
};

// Doctor Protected Route
const DoctorRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Heart className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (user.role !== 'doctor') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Main App Component
function App() {
  return (
    <div>
      <Toaster position="top-right" />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/doctors" element={<DoctorDirectory />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/appointments" 
              element={
                <ProtectedRoute>
                  <AppointmentsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/doctor/profile" 
              element={
                <DoctorRoute>
                  <div className="min-h-screen bg-gray-50">
                    <Navigation />
                    <DoctorProfileManagement />
                  </div>
                </DoctorRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;