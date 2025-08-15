import requests
import sys
import json
from datetime import datetime

class HealthcareAPITester:
    def __init__(self, base_url="https://repo-navigator-8.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tokens = {}  # Store tokens for different users
        self.users = {}   # Store user data
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if not endpoint.startswith('http') else endpoint
        
        # Setup headers
        request_headers = {'Content-Type': 'application/json'}
        if token:
            request_headers['Authorization'] = f'Bearer {token}'
        if headers:
            request_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        print(f"   Method: {method}")
        if data:
            print(f"   Data: {json.dumps(data, indent=2)}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=request_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=request_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=request_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=request_headers)

            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2, default=str)}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {json.dumps(error_data, indent=2)}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test health check endpoint"""
        return self.run_test("Health Check", "GET", "health", 200)

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_user_registration(self, role="patient", email_suffix=""):
        """Test user registration with different roles"""
        timestamp = datetime.now().strftime('%H%M%S')
        user_data = {
            "email": f"test_{role}_{timestamp}{email_suffix}@example.com",
            "password": "TestPass123!",
            "name": f"Test {role.title()} {timestamp}",
            "role": role,
            "phone": "+1234567890",
            "age": 30
        }
        
        success, response = self.run_test(
            f"Register {role.title()}", 
            "POST", 
            "auth/register", 
            200, 
            user_data
        )
        
        if success and 'access_token' in response:
            self.tokens[role] = response['access_token']
            self.users[role] = response['user']
            return True, response
        return False, {}

    def test_duplicate_registration(self):
        """Test duplicate email registration (should fail)"""
        if 'patient' not in self.users:
            print("❌ No patient user found for duplicate test")
            return False, {}
            
        duplicate_data = {
            "email": self.users['patient']['email'],
            "password": "AnotherPass123!",
            "name": "Duplicate User",
            "role": "patient"
        }
        
        return self.run_test(
            "Duplicate Email Registration", 
            "POST", 
            "auth/register", 
            400, 
            duplicate_data
        )

    def test_password_validation(self):
        """Test password validation (should require 8+ chars with letters and numbers)"""
        weak_passwords = [
            "weak",           # Too short
            "weakpassword",   # No numbers
            "12345678",       # No letters
            "Weak1"           # Too short but has letters and numbers
        ]
        
        all_passed = True
        for i, weak_password in enumerate(weak_passwords):
            user_data = {
                "email": f"weakpass_{i}@example.com",
                "password": weak_password,
                "name": f"Weak Pass User {i}",
                "role": "patient"
            }
            
            success, _ = self.run_test(
                f"Weak Password Test {i+1} ({weak_password})", 
                "POST", 
                "auth/register", 
                400, 
                user_data
            )
            
            if not success:
                all_passed = False
                
        return all_passed, {}

    def test_user_login(self, role="patient"):
        """Test user login"""
        if role not in self.users:
            print(f"❌ No {role} user found for login test")
            return False, {}
            
        login_data = {
            "email": self.users[role]['email'],
            "password": "TestPass123!"
        }
        
        success, response = self.run_test(
            f"Login {role.title()}", 
            "POST", 
            "auth/login", 
            200, 
            login_data
        )
        
        if success and 'access_token' in response:
            self.tokens[f"{role}_login"] = response['access_token']
            return True, response
        return False, {}

    def test_invalid_login(self):
        """Test login with invalid credentials"""
        invalid_data = {
            "email": "nonexistent@example.com",
            "password": "WrongPass123!"
        }
        
        return self.run_test(
            "Invalid Login", 
            "POST", 
            "auth/login", 
            401, 
            invalid_data
        )

    def test_get_current_user(self, role="patient"):
        """Test protected /auth/me endpoint"""
        token_key = f"{role}_login" if f"{role}_login" in self.tokens else role
        if token_key not in self.tokens:
            print(f"❌ No token found for {role}")
            return False, {}
            
        return self.run_test(
            f"Get Current User ({role})", 
            "GET", 
            "auth/me", 
            200, 
            token=self.tokens[token_key]
        )

    def test_dashboard_access(self, role="patient"):
        """Test role-specific dashboard access"""
        token_key = f"{role}_login" if f"{role}_login" in self.tokens else role
        if token_key not in self.tokens:
            print(f"❌ No token found for {role}")
            return False, {}
            
        return self.run_test(
            f"Dashboard Access ({role})", 
            "GET", 
            f"dashboard/{role}", 
            200, 
            token=self.tokens[token_key]
        )

    def test_unauthorized_dashboard_access(self):
        """Test accessing dashboard without token"""
        return self.run_test(
            "Unauthorized Dashboard Access", 
            "GET", 
            "dashboard/patient", 
            401
        )

    def test_role_based_access_control(self):
        """Test that users can't access other role's dashboards"""
        if 'patient' not in self.tokens or 'doctor' not in self.tokens:
            print("❌ Need both patient and doctor tokens for RBAC test")
            return False, {}
            
        # Patient trying to access doctor dashboard
        success1, _ = self.run_test(
            "Patient accessing Doctor Dashboard (should fail)", 
            "GET", 
            "dashboard/doctor", 
            403, 
            token=self.tokens['patient']
        )
        
        # Doctor trying to access patient dashboard  
        success2, _ = self.run_test(
            "Doctor accessing Patient Dashboard (should fail)", 
            "GET", 
            "dashboard/patient", 
            403, 
            token=self.tokens['doctor']
        )
        
        return success1 and success2, {}

    # Doctor Profile Management Tests
    def test_create_doctor_profile(self):
        """Test creating a doctor profile"""
        if 'doctor' not in self.tokens:
            print("❌ No doctor token found for profile creation test")
            return False, {}
            
        profile_data = {
            "bio": "Experienced cardiologist with 15 years of practice",
            "specializations": ["Cardiology", "Internal Medicine"],
            "qualifications": ["MBBS", "MD", "FRCS"],
            "experience_years": 15,
            "license_number": "MED12345",
            "consultation_fee_online": 75.0,
            "consultation_fee_clinic": 150.0,
            "consultation_types": ["both"],
            "clinic_info": {
                "name": "Heart Care Center",
                "address": "123 Medical Street",
                "city": "New York",
                "state": "NY",
                "zipcode": "10001",
                "phone": "+1234567890",
                "facilities": ["ECG", "Echo", "Stress Test"]
            }
        }
        
        success, response = self.run_test(
            "Create Doctor Profile", 
            "POST", 
            "doctor/profile", 
            200, 
            profile_data,
            token=self.tokens['doctor']
        )
        
        if success:
            self.doctor_profile_id = response.get('id')
        return success, response

    def test_get_my_doctor_profile(self):
        """Test getting own doctor profile"""
        if 'doctor' not in self.tokens:
            print("❌ No doctor token found")
            return False, {}
            
        return self.run_test(
            "Get My Doctor Profile", 
            "GET", 
            "doctor/profile", 
            200, 
            token=self.tokens['doctor']
        )

    def test_update_doctor_profile(self):
        """Test updating doctor profile"""
        if 'doctor' not in self.tokens:
            print("❌ No doctor token found")
            return False, {}
            
        updated_data = {
            "bio": "Updated bio: Experienced cardiologist with 16 years of practice",
            "specializations": ["Cardiology", "Internal Medicine", "Preventive Medicine"],
            "qualifications": ["MBBS", "MD", "FRCS", "FACC"],
            "experience_years": 16,
            "license_number": "MED12345",
            "consultation_fee_online": 80.0,
            "consultation_fee_clinic": 160.0,
            "consultation_types": ["both"],
            "clinic_info": {
                "name": "Advanced Heart Care Center",
                "address": "456 Medical Avenue",
                "city": "New York",
                "state": "NY",
                "zipcode": "10002",
                "phone": "+1234567891",
                "facilities": ["ECG", "Echo", "Stress Test", "Holter Monitor"]
            }
        }
        
        return self.run_test(
            "Update Doctor Profile", 
            "PUT", 
            "doctor/profile", 
            200, 
            updated_data,
            token=self.tokens['doctor']
        )

    def test_get_doctor_profile_by_id(self):
        """Test getting doctor profile by ID (public endpoint)"""
        if 'doctor' not in self.users:
            print("❌ No doctor user found")
            return False, {}
            
        doctor_id = self.users['doctor']['id']
        return self.run_test(
            "Get Doctor Profile by ID", 
            "GET", 
            f"doctor/profile/{doctor_id}", 
            200
        )

    def test_get_all_doctors(self):
        """Test getting all doctors (public endpoint)"""
        return self.run_test(
            "Get All Doctors", 
            "GET", 
            "doctors", 
            200
        )

    def test_get_doctors_with_filters(self):
        """Test getting doctors with filters"""
        # Test specialization filter
        success1, _ = self.run_test(
            "Get Doctors by Specialization", 
            "GET", 
            "doctors?specialization=Cardiology", 
            200
        )
        
        # Test city filter
        success2, _ = self.run_test(
            "Get Doctors by City", 
            "GET", 
            "doctors?city=New York", 
            200
        )
        
        # Test consultation type filter
        success3, _ = self.run_test(
            "Get Doctors by Consultation Type", 
            "GET", 
            "doctors?consultation_type=both", 
            200
        )
        
        return success1 and success2 and success3, {}

    def test_patient_cannot_create_doctor_profile(self):
        """Test that patients cannot create doctor profiles"""
        if 'patient' not in self.tokens:
            print("❌ No patient token found")
            return False, {}
            
        profile_data = {
            "bio": "This should fail",
            "specializations": ["General Medicine"],
            "qualifications": ["MBBS"],
            "experience_years": 5
        }
        
        return self.run_test(
            "Patient Cannot Create Doctor Profile", 
            "POST", 
            "doctor/profile", 
            403, 
            profile_data,
            token=self.tokens['patient']
        )

    # Doctor Availability Management Tests
    def test_create_availability_slot(self):
        """Test creating availability slot"""
        if 'doctor' not in self.tokens:
            print("❌ No doctor token found")
            return False, {}
            
        from datetime import datetime, timedelta
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        
        slot_data = {
            "date": tomorrow,
            "start_time": "09:00",
            "end_time": "10:00",
            "consultation_type": "both"
        }
        
        success, response = self.run_test(
            "Create Availability Slot", 
            "POST", 
            "doctor/availability", 
            200, 
            slot_data,
            token=self.tokens['doctor']
        )
        
        if success:
            self.availability_slot_id = response.get('id')
        return success, response

    def test_create_multiple_availability_slots(self):
        """Test creating multiple availability slots"""
        if 'doctor' not in self.tokens:
            print("❌ No doctor token found")
            return False, {}
            
        from datetime import datetime, timedelta
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        day_after = (datetime.now() + timedelta(days=2)).strftime('%Y-%m-%d')
        
        slots = [
            {
                "date": tomorrow,
                "start_time": "10:00",
                "end_time": "11:00",
                "consultation_type": "online"
            },
            {
                "date": day_after,
                "start_time": "14:00",
                "end_time": "15:00",
                "consultation_type": "clinic"
            }
        ]
        
        all_success = True
        for i, slot_data in enumerate(slots):
            success, _ = self.run_test(
                f"Create Availability Slot {i+2}", 
                "POST", 
                "doctor/availability", 
                200, 
                slot_data,
                token=self.tokens['doctor']
            )
            if not success:
                all_success = False
                
        return all_success, {}

    def test_get_my_availability(self):
        """Test getting own availability"""
        if 'doctor' not in self.tokens:
            print("❌ No doctor token found")
            return False, {}
            
        return self.run_test(
            "Get My Availability", 
            "GET", 
            "doctor/availability", 
            200, 
            token=self.tokens['doctor']
        )

    def test_get_doctor_availability_public(self):
        """Test getting doctor availability (public endpoint)"""
        if 'doctor' not in self.users:
            print("❌ No doctor user found")
            return False, {}
            
        doctor_id = self.users['doctor']['id']
        return self.run_test(
            "Get Doctor Availability (Public)", 
            "GET", 
            f"doctor/{doctor_id}/availability", 
            200
        )

    def test_invalid_availability_slot(self):
        """Test creating invalid availability slots"""
        if 'doctor' not in self.tokens:
            print("❌ No doctor token found")
            return False, {}
            
        # Test invalid date format
        invalid_slot1 = {
            "date": "invalid-date",
            "start_time": "09:00",
            "end_time": "10:00",
            "consultation_type": "both"
        }
        
        success1, _ = self.run_test(
            "Invalid Date Format", 
            "POST", 
            "doctor/availability", 
            400, 
            invalid_slot1,
            token=self.tokens['doctor']
        )
        
        # Test invalid time format
        from datetime import datetime, timedelta
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        
        invalid_slot2 = {
            "date": tomorrow,
            "start_time": "invalid-time",
            "end_time": "10:00",
            "consultation_type": "both"
        }
        
        success2, _ = self.run_test(
            "Invalid Time Format", 
            "POST", 
            "doctor/availability", 
            400, 
            invalid_slot2,
            token=self.tokens['doctor']
        )
        
        # Test start time after end time
        invalid_slot3 = {
            "date": tomorrow,
            "start_time": "15:00",
            "end_time": "14:00",
            "consultation_type": "both"
        }
        
        success3, _ = self.run_test(
            "Start Time After End Time", 
            "POST", 
            "doctor/availability", 
            400, 
            invalid_slot3,
            token=self.tokens['doctor']
        )
        
        return success1 and success2 and success3, {}

    def test_delete_availability_slot(self):
        """Test deleting availability slot"""
        if 'doctor' not in self.tokens or not hasattr(self, 'availability_slot_id'):
            print("❌ No doctor token or availability slot ID found")
            return False, {}
            
        success, response = self.run_test(
            "Delete Availability Slot", 
            "DELETE", 
            f"doctor/availability/{self.availability_slot_id}", 
            200, 
            token=self.tokens['doctor']
        )
        
        return success, response

    def test_patient_cannot_create_availability(self):
        """Test that patients cannot create availability slots"""
        if 'patient' not in self.tokens:
            print("❌ No patient token found")
            return False, {}
            
        from datetime import datetime, timedelta
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        
        slot_data = {
            "date": tomorrow,
            "start_time": "09:00",
            "end_time": "10:00",
            "consultation_type": "both"
        }
        
        return self.run_test(
            "Patient Cannot Create Availability", 
            "POST", 
            "doctor/availability", 
            403, 
            slot_data,
            token=self.tokens['patient']
        )

    # Appointment Booking System Tests
    def setup_appointment_test_data(self):
        """Setup test data for appointment booking tests"""
        from datetime import datetime, timedelta
        
        # Create availability slots for testing
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        day_after = (datetime.now() + timedelta(days=2)).strftime('%Y-%m-%d')
        
        slots = [
            {
                "date": tomorrow,
                "start_time": "09:00",
                "end_time": "10:00",
                "consultation_type": "online"
            },
            {
                "date": tomorrow,
                "start_time": "11:00",
                "end_time": "12:00",
                "consultation_type": "clinic"
            },
            {
                "date": day_after,
                "start_time": "14:00",
                "end_time": "15:00",
                "consultation_type": "both"
            }
        ]
        
        self.test_slots = []
        for i, slot_data in enumerate(slots):
            success, response = self.run_test(
                f"Setup Availability Slot {i+1}", 
                "POST", 
                "doctor/availability", 
                200, 
                slot_data,
                token=self.tokens['doctor']
            )
            if success:
                self.test_slots.append(response)
        
        return len(self.test_slots) > 0

    def test_book_appointment_success(self):
        """Test successful appointment booking"""
        if 'patient' not in self.tokens or not hasattr(self, 'test_slots') or not self.test_slots:
            print("❌ No patient token or test slots found")
            return False, {}
        
        slot = self.test_slots[0]  # Use first available slot
        from datetime import datetime
        
        appointment_data = {
            "doctor_id": self.users['doctor']['id'],
            "availability_slot_id": slot['id'],
            "consultation_type": slot['consultation_type'],
            "appointment_date": slot['date'],
            "start_time": slot['start_time'],
            "end_time": slot['end_time'],
            "reason": "Regular checkup",
            "symptoms": "Mild chest discomfort",
            "notes": "Patient reports occasional chest pain"
        }
        
        success, response = self.run_test(
            "Book Appointment Successfully", 
            "POST", 
            "appointments", 
            200, 
            appointment_data,
            token=self.tokens['patient']
        )
        
        if success:
            self.test_appointment_id = response.get('id')
        return success, response

    def test_book_appointment_invalid_slot(self):
        """Test booking appointment with invalid slot"""
        if 'patient' not in self.tokens:
            print("❌ No patient token found")
            return False, {}
        
        from datetime import datetime, timedelta
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        
        appointment_data = {
            "doctor_id": self.users['doctor']['id'],
            "availability_slot_id": "invalid-slot-id",
            "consultation_type": "online",
            "appointment_date": tomorrow,
            "start_time": "09:00",
            "end_time": "10:00",
            "reason": "Regular checkup"
        }
        
        return self.run_test(
            "Book Appointment with Invalid Slot", 
            "POST", 
            "appointments", 
            404, 
            appointment_data,
            token=self.tokens['patient']
        )

    def test_book_appointment_already_booked_slot(self):
        """Test booking appointment with already booked slot"""
        if 'patient' not in self.tokens or not hasattr(self, 'test_slots') or len(self.test_slots) < 1:
            print("❌ No patient token or test slots found")
            return False, {}
        
        # Try to book the same slot that was already booked
        slot = self.test_slots[0]
        
        appointment_data = {
            "doctor_id": self.users['doctor']['id'],
            "availability_slot_id": slot['id'],
            "consultation_type": slot['consultation_type'],
            "appointment_date": slot['date'],
            "start_time": slot['start_time'],
            "end_time": slot['end_time'],
            "reason": "Another checkup"
        }
        
        return self.run_test(
            "Book Already Booked Slot", 
            "POST", 
            "appointments", 
            404, 
            appointment_data,
            token=self.tokens['patient']
        )

    def test_book_appointment_mismatched_details(self):
        """Test booking appointment with mismatched slot details"""
        if 'patient' not in self.tokens or not hasattr(self, 'test_slots') or len(self.test_slots) < 2:
            print("❌ No patient token or test slots found")
            return False, {}
        
        slot = self.test_slots[1]  # Use second slot
        
        # Provide wrong time details
        appointment_data = {
            "doctor_id": self.users['doctor']['id'],
            "availability_slot_id": slot['id'],
            "consultation_type": slot['consultation_type'],
            "appointment_date": slot['date'],
            "start_time": "10:00",  # Wrong time
            "end_time": "11:00",    # Wrong time
            "reason": "Regular checkup"
        }
        
        return self.run_test(
            "Book Appointment with Mismatched Details", 
            "POST", 
            "appointments", 
            400, 
            appointment_data,
            token=self.tokens['patient']
        )

    def test_doctor_cannot_book_appointment(self):
        """Test that doctors cannot book appointments"""
        if 'doctor' not in self.tokens or not hasattr(self, 'test_slots') or len(self.test_slots) < 2:
            print("❌ No doctor token or test slots found")
            return False, {}
        
        slot = self.test_slots[1]
        
        appointment_data = {
            "doctor_id": self.users['doctor']['id'],
            "availability_slot_id": slot['id'],
            "consultation_type": slot['consultation_type'],
            "appointment_date": slot['date'],
            "start_time": slot['start_time'],
            "end_time": slot['end_time'],
            "reason": "Should fail"
        }
        
        return self.run_test(
            "Doctor Cannot Book Appointment", 
            "POST", 
            "appointments", 
            403, 
            appointment_data,
            token=self.tokens['doctor']
        )

    def test_get_patient_appointments(self):
        """Test getting patient's appointments"""
        if 'patient' not in self.tokens:
            print("❌ No patient token found")
            return False, {}
        
        return self.run_test(
            "Get Patient Appointments", 
            "GET", 
            "appointments", 
            200, 
            token=self.tokens['patient']
        )

    def test_get_doctor_appointments(self):
        """Test getting doctor's appointments"""
        if 'doctor' not in self.tokens:
            print("❌ No doctor token found")
            return False, {}
        
        return self.run_test(
            "Get Doctor Appointments", 
            "GET", 
            "appointments", 
            200, 
            token=self.tokens['doctor']
        )

    def test_get_appointment_details(self):
        """Test getting appointment details"""
        if 'patient' not in self.tokens or not hasattr(self, 'test_appointment_id'):
            print("❌ No patient token or appointment ID found")
            return False, {}
        
        return self.run_test(
            "Get Appointment Details", 
            "GET", 
            f"appointments/{self.test_appointment_id}", 
            200, 
            token=self.tokens['patient']
        )

    def test_get_appointment_details_unauthorized(self):
        """Test getting appointment details without proper access"""
        if not hasattr(self, 'test_appointment_id'):
            print("❌ No appointment ID found")
            return False, {}
        
        # Store original patient token
        original_patient_token = self.tokens.get('patient')
        original_patient_user = self.users.get('patient')
        
        # Create another patient to test unauthorized access
        timestamp = datetime.now().strftime('%H%M%S')
        unauthorized_user_data = {
            "email": f"unauthorized_patient_{timestamp}@example.com",
            "password": "TestPass123!",
            "name": f"Unauthorized Patient {timestamp}",
            "role": "patient",
            "phone": "+1234567890",
            "age": 25
        }
        
        success, response = self.run_test(
            "Register Unauthorized Patient", 
            "POST", 
            "auth/register", 
            200, 
            unauthorized_user_data
        )
        
        if not success:
            print("❌ Failed to create unauthorized patient")
            return False, {}
        
        unauthorized_token = response.get('access_token')
        
        result = self.run_test(
            "Get Appointment Details Unauthorized", 
            "GET", 
            f"appointments/{self.test_appointment_id}", 
            403, 
            token=unauthorized_token
        )
        
        # Restore original patient token and user
        if original_patient_token:
            self.tokens['patient'] = original_patient_token
        if original_patient_user:
            self.users['patient'] = original_patient_user
            
        return result

    def test_doctor_confirm_appointment(self):
        """Test doctor confirming appointment"""
        if 'doctor' not in self.tokens or not hasattr(self, 'test_appointment_id'):
            print("❌ No doctor token or appointment ID found")
            return False, {}
        
        status_update = {
            "status": "confirmed",
            "notes": "Appointment confirmed by doctor"
        }
        
        return self.run_test(
            "Doctor Confirm Appointment", 
            "PUT", 
            f"appointments/{self.test_appointment_id}", 
            200, 
            status_update,
            token=self.tokens['doctor']
        )

    def test_doctor_complete_appointment(self):
        """Test doctor completing appointment"""
        if 'doctor' not in self.tokens or not hasattr(self, 'test_appointment_id'):
            print("❌ No doctor token or appointment ID found")
            return False, {}
        
        status_update = {
            "status": "completed",
            "notes": "Consultation completed successfully"
        }
        
        return self.run_test(
            "Doctor Complete Appointment", 
            "PUT", 
            f"appointments/{self.test_appointment_id}", 
            200, 
            status_update,
            token=self.tokens['doctor']
        )

    def test_patient_invalid_status_update(self):
        """Test patient trying to set invalid status"""
        # First book another appointment for this test
        if 'patient' not in self.tokens or not hasattr(self, 'test_slots') or len(self.test_slots) < 3:
            print("❌ No patient token or test slots found")
            return False, {}
        
        slot = self.test_slots[2]  # Use third slot
        
        appointment_data = {
            "doctor_id": self.users['doctor']['id'],
            "availability_slot_id": slot['id'],
            "consultation_type": slot['consultation_type'],
            "appointment_date": slot['date'],
            "start_time": slot['start_time'],
            "end_time": slot['end_time'],
            "reason": "Test appointment for status update"
        }
        
        success, response = self.run_test(
            "Book Test Appointment for Status Update", 
            "POST", 
            "appointments", 
            200, 
            appointment_data,
            token=self.tokens['patient']
        )
        
        if not success:
            return False, {}
        
        test_appointment_id = response.get('id')
        
        # Try to confirm appointment as patient (should fail)
        status_update = {
            "status": "confirmed",
            "notes": "Patient trying to confirm"
        }
        
        return self.run_test(
            "Patient Invalid Status Update", 
            "PUT", 
            f"appointments/{test_appointment_id}", 
            403, 
            status_update,
            token=self.tokens['patient']
        )

    def test_patient_cancel_appointment(self):
        """Test patient cancelling appointment"""
        # Book another appointment for cancellation test
        if 'patient' not in self.tokens or 'doctor' not in self.tokens:
            print("❌ No patient or doctor token found")
            return False, {}
        
        # Create a new slot for this test
        from datetime import datetime, timedelta
        future_date = (datetime.now() + timedelta(days=3)).strftime('%Y-%m-%d')
        
        slot_data = {
            "date": future_date,
            "start_time": "16:00",
            "end_time": "17:00",
            "consultation_type": "online"
        }
        
        success, slot_response = self.run_test(
            "Create Slot for Cancellation Test", 
            "POST", 
            "doctor/availability", 
            200, 
            slot_data,
            token=self.tokens['doctor']
        )
        
        if not success:
            return False, {}
        
        # Book appointment
        appointment_data = {
            "doctor_id": self.users['doctor']['id'],
            "availability_slot_id": slot_response['id'],
            "consultation_type": slot_response['consultation_type'],
            "appointment_date": slot_response['date'],
            "start_time": slot_response['start_time'],
            "end_time": slot_response['end_time'],
            "reason": "Test appointment for cancellation"
        }
        
        success, appointment_response = self.run_test(
            "Book Appointment for Cancellation", 
            "POST", 
            "appointments", 
            200, 
            appointment_data,
            token=self.tokens['patient']
        )
        
        if not success:
            return False, {}
        
        # Cancel appointment using PUT
        status_update = {
            "status": "cancelled",
            "cancellation_reason": "Patient cancelled due to schedule conflict"
        }
        
        return self.run_test(
            "Patient Cancel Appointment", 
            "PUT", 
            f"appointments/{appointment_response['id']}", 
            200, 
            status_update,
            token=self.tokens['patient']
        )

    def test_cancel_appointment_delete(self):
        """Test cancelling appointment using DELETE endpoint"""
        # Book another appointment for DELETE cancellation test
        if 'patient' not in self.tokens or 'doctor' not in self.tokens:
            print("❌ No patient or doctor token found")
            return False, {}
        
        # Create a new slot for this test
        from datetime import datetime, timedelta
        future_date = (datetime.now() + timedelta(days=4)).strftime('%Y-%m-%d')
        
        slot_data = {
            "date": future_date,
            "start_time": "10:00",
            "end_time": "11:00",
            "consultation_type": "clinic"
        }
        
        success, slot_response = self.run_test(
            "Create Slot for DELETE Test", 
            "POST", 
            "doctor/availability", 
            200, 
            slot_data,
            token=self.tokens['doctor']
        )
        
        if not success:
            return False, {}
        
        # Book appointment
        appointment_data = {
            "doctor_id": self.users['doctor']['id'],
            "availability_slot_id": slot_response['id'],
            "consultation_type": slot_response['consultation_type'],
            "appointment_date": slot_response['date'],
            "start_time": slot_response['start_time'],
            "end_time": slot_response['end_time'],
            "reason": "Test appointment for DELETE cancellation"
        }
        
        success, appointment_response = self.run_test(
            "Book Appointment for DELETE", 
            "POST", 
            "appointments", 
            200, 
            appointment_data,
            token=self.tokens['patient']
        )
        
        if not success:
            return False, {}
        
        # Cancel appointment using DELETE
        return self.run_test(
            "Cancel Appointment with DELETE", 
            "DELETE", 
            f"appointments/{appointment_response['id']}", 
            200, 
            token=self.tokens['patient']
        )

    def test_appointment_filters(self):
        """Test appointment filtering by status and date"""
        if 'patient' not in self.tokens:
            print("❌ No patient token found")
            return False, {}
        
        from datetime import datetime, timedelta
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        
        # Test status filter
        success1, _ = self.run_test(
            "Get Appointments by Status", 
            "GET", 
            "appointments?status=pending", 
            200, 
            token=self.tokens['patient']
        )
        
        # Test date filter
        success2, _ = self.run_test(
            "Get Appointments by Date", 
            "GET", 
            f"appointments?start_date={tomorrow}", 
            200, 
            token=self.tokens['patient']
        )
        
        return success1 and success2, {}

    def test_slot_availability_after_booking(self):
        """Test that slots become unavailable after booking"""
        if 'doctor' not in self.tokens:
            print("❌ No doctor token found")
            return False, {}
        
        doctor_id = self.users['doctor']['id']
        
        # Get doctor's availability and check if booked slots are marked as booked
        success, response = self.run_test(
            "Check Slot Status After Booking", 
            "GET", 
            f"doctor/{doctor_id}/availability", 
            200
        )
        
        if success:
            # Check if any slots have status 'booked'
            booked_slots = [slot for slot in response if slot.get('status') == 'booked']
            print(f"   Found {len(booked_slots)} booked slots")
        
        return success, response

    def test_slot_availability_after_cancellation(self):
        """Test that slots become available again after cancellation"""
        # This test relies on previous cancellation tests
        if 'doctor' not in self.tokens:
            print("❌ No doctor token found")
            return False, {}
        
        doctor_id = self.users['doctor']['id']
        
        # Get doctor's availability
        success, response = self.run_test(
            "Check Slot Status After Cancellation", 
            "GET", 
            f"doctor/{doctor_id}/availability", 
            200
        )
        
        if success:
            # Check available slots
            available_slots = [slot for slot in response if slot.get('status') == 'available']
            print(f"   Found {len(available_slots)} available slots")
        
        return success, response

def main():
    print("🏥 DocEase Healthcare API Testing Suite")
    print("=" * 50)
    
    tester = HealthcareAPITester()
    
    # Basic API Tests
    print("\n📋 Basic API Tests")
    tester.test_health_check()
    tester.test_root_endpoint()
    
    # Registration Tests
    print("\n👤 User Registration Tests")
    tester.test_user_registration("patient")
    tester.test_user_registration("doctor")
    tester.test_duplicate_registration()
    tester.test_password_validation()
    
    # Login Tests
    print("\n🔐 Authentication Tests")
    tester.test_user_login("patient")
    tester.test_user_login("doctor")
    tester.test_invalid_login()
    
    # Protected Endpoint Tests
    print("\n🛡️ Protected Endpoint Tests")
    tester.test_get_current_user("patient")
    tester.test_get_current_user("doctor")
    tester.test_unauthorized_dashboard_access()
    
    # Dashboard Tests
    print("\n📊 Dashboard Access Tests")
    tester.test_dashboard_access("patient")
    tester.test_dashboard_access("doctor")
    
    # Role-Based Access Control Tests
    print("\n🔒 Role-Based Access Control Tests")
    tester.test_role_based_access_control()
    
    # Doctor Profile Management Tests
    print("\n👨‍⚕️ Doctor Profile Management Tests")
    tester.test_patient_cannot_create_doctor_profile()
    tester.test_create_doctor_profile()
    tester.test_get_my_doctor_profile()
    tester.test_update_doctor_profile()
    tester.test_get_doctor_profile_by_id()
    tester.test_get_all_doctors()
    tester.test_get_doctors_with_filters()
    
    # Doctor Availability Management Tests
    print("\n📅 Doctor Availability Management Tests")
    tester.test_patient_cannot_create_availability()
    tester.test_create_availability_slot()
    tester.test_create_multiple_availability_slots()
    tester.test_get_my_availability()
    tester.test_get_doctor_availability_public()
    tester.test_invalid_availability_slot()
    tester.test_delete_availability_slot()
    
    # Appointment Booking System Tests
    print("\n📋 Appointment Booking System Tests")
    print("   Setting up test data...")
    if tester.setup_appointment_test_data():
        print("   ✅ Test data setup complete")
        
        # Booking Tests
        print("   📝 Booking Tests")
        tester.test_book_appointment_success()
        tester.test_book_appointment_invalid_slot()
        tester.test_book_appointment_already_booked_slot()
        tester.test_book_appointment_mismatched_details()
        tester.test_doctor_cannot_book_appointment()
        
        # Appointment Retrieval Tests
        print("   📖 Appointment Retrieval Tests")
        tester.test_get_patient_appointments()
        tester.test_get_doctor_appointments()
        tester.test_get_appointment_details()
        tester.test_get_appointment_details_unauthorized()
        tester.test_appointment_filters()
        
        # Status Management Tests
        print("   🔄 Status Management Tests")
        tester.test_doctor_confirm_appointment()
        tester.test_doctor_complete_appointment()
        tester.test_patient_invalid_status_update()
        tester.test_patient_cancel_appointment()
        tester.test_cancel_appointment_delete()
        
        # Slot Management Tests
        print("   🎯 Slot Management Tests")
        tester.test_slot_availability_after_booking()
        tester.test_slot_availability_after_cancellation()
    else:
        print("   ❌ Failed to setup test data for appointment tests")
    
    # Admin Tests (if we can create admin user)
    print("\n👑 Admin Tests")
    admin_success, _ = tester.test_user_registration("admin", "_admin")
    if admin_success:
        tester.test_user_login("admin")
        tester.test_dashboard_access("admin")
    
    # Print Results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"❌ {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())