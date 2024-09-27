import requests

BASE_URL = "http://localhost:3000/api/v1"


class TestCarbonAPI():
    def assertEqual(self, first, second):
        if first != second:
            raise AssertionError(f"Expected {second} but got {first}")
        
    def assertIn(self, member, container):
        if member not in container:
            raise AssertionError(f"{member} not in {container}")
        
    def assertIsNotNone(self, obj):
        if obj is None:
            raise AssertionError("Object is None")
        
    def assertIsNone(self, obj):
        if obj is not None:
            raise AssertionError("Object is not None")
        
    def assertIsInstance(self, obj, cls):
        if not isinstance(obj, cls):
            raise AssertionError(f"{obj} is not an instance of {cls}")
        
    def assertIsNotInstance(self, obj, cls):
        if isinstance(obj, cls):
            raise AssertionError(f"{obj} is an instance of {cls}")
    
    def setUp(self):
        self.base_url = BASE_URL
        self.token = ""
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.token}",
        }
        self.valid_user_data = {
            "username": "testuser",
            "password": "password123",
        }
        self.valid_chat_data = {"name": "Test Chat"}
        self.chatId = ""
        self.password_update_data = {"password": "newPassword123"}

    def test_register_user_success(self):
        url = f"{self.base_url}/register"
        response = requests.post(url, json=self.valid_user_data, headers=self.headers)
        self.assertEqual(response.status_code, 200)
        self.assertIn("userId", response.json())
        self.token = response.json()["code"]
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.token}",
        }

    def test_authenticate_user_success(self):
        url = f"{self.base_url}/auth"
        login_data = {"username": "testuser", "password": "password123"}
        response = requests.post(url, json=login_data, headers=self.headers)
        self.assertEqual(response.status_code, 200)
        self.assertIn("userId", response.json())
        self.token = response.json()["code"]

    def test_update_password_success(self):
        url = f"{self.base_url}/updatePassword"
        response = requests.post(
            url, json=self.password_update_data, headers=self.headers
        )
        self.assertEqual(response.status_code, 200)

    def test_create_chat_success(self):
        url = f"{self.base_url}/createChat"
        response = requests.post(url, json=self.valid_chat_data, headers=self.headers)
        self.assertEqual(response.status_code, 200)
        self.assertIn("chatId", response.json())
        self.chatId = response.json()["chatId"]

    def test_create_chat_message_success(self):
        url = f"{self.base_url}/createChatMessage"
        response = requests.post(
            url,
            json={"chatId": self.chatId, "content": "Hello, world!"},
            headers=self.headers,
        )
        self.assertEqual(response.status_code, 200)

    def test_get_chat_messages_success(self):
        url = f"{self.base_url}/getChatMessages"
        response = requests.post(
            url, json={"chatId": self.chatId}, headers=self.headers
        )
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)

    def test_get_involved_chats_success(self):
        url = f"{self.base_url}/getInvolvedChats"
        response = requests.post(url, headers=self.headers)
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)

    def test_get_chat_users_success(self):
        url = f"{self.base_url}/getChatUsers"
        response = requests.post(
            url, json={"chatId": self.chatId}, headers=self.headers
        )
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)

    def test_health_check(self):
        url = "http://localhost:3000/healthcheck"
        response = requests.get(url)
        self.assertEqual(response.status_code, 200)


tests = TestCarbonAPI()
tests.setUp()
tests.test_register_user_success()
tests.test_authenticate_user_success()
tests.test_update_password_success()
tests.test_create_chat_success()
tests.test_create_chat_message_success()
tests.test_get_chat_messages_success()
tests.test_get_involved_chats_success()
tests.test_get_chat_users_success()
tests.test_health_check()
