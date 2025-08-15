import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
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
import { toast } from 'sonner';
import { Toaster } from './components/ui/sonner';
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
  Building
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

  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      navigate('/dashboard');
    }
    
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Heart className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Welcome to DocEase
          </CardTitle>
          <CardDescription>
            Your trusted healthcare companion
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Logging in...' : 'Login'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register" className="space-y-4">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">I am a</Label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="patient">Patient</option>
                    <option value="doctor">Doctor</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone (Optional)</Label>
                    <Input
                      id="phone"
                      name="phone"
                      placeholder="+1234567890"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="age">Age (Optional)</Label>
                    <Input
                      id="age"
                      name="age"
                      type="number"
                      placeholder="25"
                      value={formData.age}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
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

// Doctor Directory Component
const DoctorDirectory = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
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
                    <Button className="w-full" disabled>
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Book Appointment (Coming Soon)
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Dashboard Components
const PatientDashboard = ({ user }) => {
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
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">No appointments scheduled</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Records</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">No records yet</p>
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
      
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button onClick={() => window.location.href = '/doctors'}>
            <Search className="h-4 w-4 mr-2" />
            Find Doctors
          </Button>
          <Button variant="outline">
            <CalendarIcon className="h-4 w-4 mr-2" />
            Book Appointment
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-gray-900">
              Your Health, Our Priority
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Connect with trusted doctors, book appointments, manage prescriptions, 
              and take control of your healthcare journey with DocEase.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            {user ? (
              <Button 
                size="lg" 
                onClick={() => navigate('/dashboard')}
                className="px-8 py-3 text-lg"
              >
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button 
                  size="lg" 
                  onClick={() => navigate('/auth')}
                  className="px-8 py-3 text-lg"
                >
                  Get Started
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="px-8 py-3 text-lg"
                  onClick={() => navigate('/doctors')}
                >
                  Browse Doctors
                </Button>
              </>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <Card className="text-center">
              <CardHeader>
                <Search className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Find Doctors</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Search and connect with qualified doctors in your area
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardHeader>
                <CalendarIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Book Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Schedule appointments online with ease and convenience
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardHeader>
                <Activity className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Manage Health</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Keep track of your health records and prescriptions
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
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