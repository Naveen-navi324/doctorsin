import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any

class BackendAPITester:
    def __init__(self, base_url="https://repo-navigator-10.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test_result(self, test_name: str, success: bool, details: str = ""):
        """Log test result for summary"""
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })

    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, data: Dict[Any, Any] = None) -> tuple[bool, Dict[Any, Any]]:
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")

            print(f"   Response Status: {response.status_code}")
            
            # Try to parse JSON response
            try:
                response_data = response.json()
                print(f"   Response Data: {json.dumps(response_data, indent=2, default=str)}")
            except:
                response_data = {"raw_response": response.text}
                print(f"   Raw Response: {response.text}")

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ PASSED - {name}")
                self.log_test_result(name, True, f"Status: {response.status_code}")
            else:
                print(f"❌ FAILED - {name}")
                print(f"   Expected status: {expected_status}, got: {response.status_code}")
                self.log_test_result(name, False, f"Expected {expected_status}, got {response.status_code}")

            return success, response_data

        except requests.exceptions.RequestException as e:
            print(f"❌ FAILED - {name}")
            print(f"   Network Error: {str(e)}")
            self.log_test_result(name, False, f"Network Error: {str(e)}")
            return False, {}
        except Exception as e:
            print(f"❌ FAILED - {name}")
            print(f"   Unexpected Error: {str(e)}")
            self.log_test_result(name, False, f"Unexpected Error: {str(e)}")
            return False, {}

    def test_hello_world_api(self):
        """Test GET /api/ endpoint"""
        success, response = self.run_test(
            "Hello World API",
            "GET",
            "api/",
            200
        )
        
        if success and response.get("message") == "Hello World":
            print("   ✅ Message content verified")
            return True
        elif success:
            print(f"   ⚠️  Unexpected message: {response.get('message')}")
            return False
        return False

    def test_create_status_check(self):
        """Test POST /api/status endpoint"""
        test_data = {
            "client_name": f"test_client_{datetime.now().strftime('%H%M%S')}"
        }
        
        success, response = self.run_test(
            "Create Status Check",
            "POST",
            "api/status",
            200,  # Based on the FastAPI code, it should return 200, not 201
            data=test_data
        )
        
        if success:
            # Verify response structure
            required_fields = ["id", "client_name", "timestamp"]
            missing_fields = [field for field in required_fields if field not in response]
            
            if not missing_fields:
                print("   ✅ Response structure verified")
                if response["client_name"] == test_data["client_name"]:
                    print("   ✅ Client name matches")
                    return response["id"]  # Return ID for further testing
                else:
                    print(f"   ❌ Client name mismatch: expected {test_data['client_name']}, got {response['client_name']}")
            else:
                print(f"   ❌ Missing fields in response: {missing_fields}")
        
        return None

    def test_get_status_checks(self):
        """Test GET /api/status endpoint"""
        success, response = self.run_test(
            "Get Status Checks",
            "GET",
            "api/status",
            200
        )
        
        if success:
            if isinstance(response, list):
                print(f"   ✅ Received list with {len(response)} items")
                
                # If there are items, verify structure of first item
                if len(response) > 0:
                    first_item = response[0]
                    required_fields = ["id", "client_name", "timestamp"]
                    missing_fields = [field for field in required_fields if field not in first_item]
                    
                    if not missing_fields:
                        print("   ✅ Item structure verified")
                        return True
                    else:
                        print(f"   ❌ Missing fields in items: {missing_fields}")
                else:
                    print("   ℹ️  Empty list returned (no status checks yet)")
                    return True
            else:
                print(f"   ❌ Expected list, got: {type(response)}")
        
        return False

    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting Backend API Tests")
        print("=" * 50)
        
        # Test 1: Hello World API
        hello_success = self.test_hello_world_api()
        
        # Test 2: Create Status Check
        status_id = self.test_create_status_check()
        create_success = status_id is not None
        
        # Test 3: Get Status Checks
        get_success = self.test_get_status_checks()
        
        # Print Summary
        print("\n" + "=" * 50)
        print("📊 TEST SUMMARY")
        print("=" * 50)
        
        for result in self.test_results:
            status = "✅ PASS" if result["success"] else "❌ FAIL"
            print(f"{status} - {result['test']}")
            if result["details"]:
                print(f"      {result['details']}")
        
        print(f"\nOverall: {self.tests_passed}/{self.tests_run} tests passed")
        
        # Determine if backend is ready for frontend testing
        critical_tests_passed = hello_success and create_success and get_success
        
        if critical_tests_passed:
            print("\n🎉 All critical backend tests passed! Ready for frontend testing.")
            return True
        else:
            print("\n⚠️  Some critical backend tests failed. Frontend testing may have issues.")
            return False

def main():
    """Main test execution"""
    tester = BackendAPITester()
    backend_ready = tester.run_all_tests()
    
    if backend_ready:
        print("\n✅ Backend is functioning correctly")
        return 0
    else:
        print("\n❌ Backend has issues that need to be addressed")
        return 1

if __name__ == "__main__":
    sys.exit(main())