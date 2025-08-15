import requests
import sys
import json
from datetime import datetime

class HealthcareAPITester:
    def __init__(self, base_url="https://docease.preview.emergentagent.com"):
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