import json
import tempfile
import os
from unittest.mock import patch, MagicMock, Mock
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from django.test.utils import override_settings
from .models import Video
from .views import extract_frame_as_base64, analyze_frame_with_ai
import cv2
import numpy as np

User = get_user_model()


class VideoModelTest(TestCase):
    """Test cases for the Video model"""
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
    def test_video_creation(self):
        """Test that a Video instance is created correctly"""
        # Create a mock video file
        video_file = SimpleUploadedFile(
            "test_video.mp4",
            b"fake video content",
            content_type="video/mp4"
        )
        
        video = Video.objects.create(
            caption="Test Video",
            video=video_file,
            slug="test-video",
            user=self.user
        )
        
        # Assert video is created with correct attributes
        self.assertEqual(video.caption, "Test Video")
        self.assertEqual(video.slug, "test-video")
        self.assertEqual(video.user, self.user)
        self.assertIsNotNone(video.publish)
        # Check that publish is a datetime instance
        from datetime import datetime
        self.assertIsInstance(video.publish, datetime)
        
    def test_video_string_representation(self):
        """Test that the string representation returns the expected value"""
        video_file = SimpleUploadedFile(
            "test_video.mp4",
            b"fake video content",
            content_type="video/mp4"
        )
        
        video = Video.objects.create(
            caption="My Test Video",
            video=video_file,
            slug="my-test-video",
            user=self.user
        )
        
        # Test __str__ method
        self.assertEqual(str(video), "My Test Video")
        
    def test_video_get_absolute_url(self):
        """Test that get_absolute_url returns the correct URL"""
        video_file = SimpleUploadedFile(
            "test_video.mp4",
            b"fake video content",
            content_type="video/mp4"
        )
        
        video = Video.objects.create(
            caption="URL Test Video",
            video=video_file,
            slug="url-test-video",
            user=self.user
        )
        
        expected_url = reverse(
            'video:video_detail',
            args=[
                video.publish.year,
                video.publish.month,
                video.publish.day,
                video.slug
            ]
        )
        
        self.assertEqual(video.get_absolute_url(), expected_url)


class VideoViewTest(TestCase):
    """Test cases for the video views"""
    
    def setUp(self):
        """Set up test data"""
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
    def test_index_get_request(self):
        """Test that a GET request to the index returns status 200"""
        response = self.client.get(reverse('video:index'))
        
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'PlayDeep')  # Check if the template is rendered
        
    @patch('video.views.Video_form')
    def test_index_post_valid_video(self, mock_form_class):
        """Test that submitting a POST request with a valid video file uploads successfully"""
        # Mock the form and its methods
        mock_form = MagicMock()
        mock_form.is_valid.return_value = True
        mock_form.save.return_value = None
        mock_form_class.return_value = mock_form
        
        # Create a mock video file
        video_file = SimpleUploadedFile(
            "test_video.mp4",
            b"fake video content",
            content_type="video/mp4"
        )
        
        response = self.client.post(
            reverse('video:index'),
            {
                'caption': 'Test Video Upload',
                'video': video_file
            }
        )
        
        # Check that form was called and video was "uploaded"
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Video Uploaded")
        mock_form.is_valid.assert_called_once()
        mock_form.save.assert_called_once()
        
    def test_index_pagination(self):
        """Test that pagination works correctly"""
        # Create multiple videos to test pagination
        video_file = SimpleUploadedFile(
            "test_video.mp4",
            b"fake video content",
            content_type="video/mp4"
        )
        
        for i in range(5):
            Video.objects.create(
                caption=f"Test Video {i}",
                video=video_file,
                slug=f"test-video-{i}",
                user=self.user
            )
        
        response = self.client.get(reverse('video:index'))
        self.assertEqual(response.status_code, 200)
        
        # Check pagination context (2 videos per page as per the view)
        self.assertTrue('videos' in response.context)
        self.assertEqual(len(response.context['videos']), 2)


class AnalyzeFrameWithAITest(TestCase):
    """Test cases for the analyze_frame_with_ai view"""
    
    def setUp(self):
        """Set up test data"""
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # Create a test video
        video_file = SimpleUploadedFile(
            "test_video.mp4",
            b"fake video content",
            content_type="video/mp4"
        )
        
        self.video = Video.objects.create(
            caption="Test Analysis Video",
            video=video_file,
            slug="test-analysis-video",
            user=self.user,
            publish=timezone.now()
        )
        
        self.url = reverse(
            'video:analyze_frame_with_ai',
            args=[
                self.video.publish.year,
                self.video.publish.month,
                self.video.publish.day,
                self.video.slug
            ]
        )
        
    def test_non_post_method_returns_405(self):
        """Test that when the method is not POST, it returns status 405"""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 405)
        
        response_data = json.loads(response.content)
        self.assertEqual(response_data['error'], 'Only POST method allowed')
        
    @patch('video.views.cv2.VideoCapture')
    def test_empty_prompt_returns_400(self, mock_cv2):
        """Test that sending an empty prompt returns status 400"""
        # Mock cv2.VideoCapture
        mock_cap = MagicMock()
        mock_cap.get.return_value = 100  # Mock frame count
        mock_cv2.return_value = mock_cap
        
        response = self.client.post(
            self.url,
            json.dumps({'prompt': ''}),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        response_data = json.loads(response.content)
        self.assertEqual(response_data['error'], 'Prompt cannot be empty')
        
    @patch('video.views.config')
    @patch('video.views.OpenAI')
    @patch('video.views.cv2.VideoCapture')
    @patch('video.views.extract_frame_as_base64')
    def test_valid_prompt_with_mocked_openai(self, mock_extract_frame, mock_cv2, mock_openai_class, mock_config):
        """Test that a valid prompt triggers a mocked OpenAI API call and returns status 200"""
        # Mock configuration
        mock_config.return_value = 'fake-api-key'
        
        # Mock cv2.VideoCapture
        mock_cap = MagicMock()
        mock_cap.get.return_value = 300  # Mock frame count
        mock_cv2.return_value = mock_cap
        
        # Mock extract_frame_as_base64
        mock_extract_frame.return_value = "data:image/jpeg;base64,fake_base64_data"
        
        # Mock OpenAI client and response
        mock_client = MagicMock()
        mock_openai_class.return_value = mock_client
        
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "This is a mocked AI analysis of the frame."
        mock_client.chat.completions.create.return_value = mock_response
        
        # Make the request
        response = self.client.post(
            self.url,
            json.dumps({'prompt': 'Analyze this football frame'}),
            content_type='application/json'
        )
        
        # Assertions
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content)
        
        # Check expected fields in response
        self.assertTrue(response_data['success'])
        self.assertIn('analysis', response_data)
        self.assertIn('prompt_used', response_data)
        self.assertEqual(response_data['prompt_used'], 'Analyze this football frame')
        self.assertIn('This is a mocked AI analysis', response_data['analysis'])
        
        # Verify OpenAI was called
        mock_client.chat.completions.create.assert_called()
        
    @patch('video.views.config')
    def test_missing_openai_api_key(self, mock_config):
        """Test that missing OpenAI API key returns status 500"""
        # Mock config to raise an exception
        mock_config.side_effect = Exception("API key not found")
        
        response = self.client.post(
            self.url,
            json.dumps({'prompt': 'Test prompt'}),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 500)
        response_data = json.loads(response.content)
        self.assertEqual(response_data['error'], 'OpenAI API key not configured')


class ExtractFrameAsBase64Test(TestCase):
    """Test cases for the extract_frame_as_base64 helper function"""
    
    def setUp(self):
        """Set up test video file"""
        self.temp_dir = tempfile.mkdtemp()
        self.test_video_path = os.path.join(self.temp_dir, 'test_video.mp4')
        
        # Create a simple test video using OpenCV
        self.create_test_video()
        
    def create_test_video(self):
        """Create a simple test video file"""
        # Create a simple 10-frame video
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(self.test_video_path, fourcc, 30.0, (640, 480))
        
        for i in range(10):
            # Create a simple frame with different colors
            frame = np.zeros((480, 640, 3), dtype=np.uint8)
            frame[:, :] = (i * 25, 100, 200)  # Different color for each frame
            out.write(frame)
            
        out.release()
        
    def tearDown(self):
        """Clean up test files"""
        if os.path.exists(self.test_video_path):
            os.remove(self.test_video_path)
        os.rmdir(self.temp_dir)
        
    @patch('video.views.sv.get_video_frames_generator')
    def test_extract_frame_returns_valid_base64(self, mock_frame_generator):
        """Test that the function returns a valid base64 string"""
        # Mock the frame generator to return a test frame
        test_frame = np.zeros((480, 640, 3), dtype=np.uint8)
        test_frame[:, :] = (100, 150, 200)  # RGB values
        
        # Mock generator that yields frames
        def mock_generator():
            for i in range(5):
                yield test_frame
                
        mock_frame_generator.return_value = mock_generator()
        
        # Test the function
        result = extract_frame_as_base64(self.test_video_path, 3)
        
        # Assertions
        self.assertIsInstance(result, str)
        self.assertTrue(result.startswith('data:image/jpeg;base64,'))
        
        # Verify the base64 part is not empty
        base64_part = result.split(',')[1]
        self.assertGreater(len(base64_part), 0)
        
        # Verify frame generator was called with correct video URL
        mock_frame_generator.assert_called_once_with(self.test_video_path)
        
    @patch('video.views.sv.get_video_frames_generator')
    def test_extract_first_frame(self, mock_frame_generator):
        """Test extracting the first frame (frame_number=1)"""
        test_frame = np.zeros((480, 640, 3), dtype=np.uint8)
        test_frame[:, :] = (255, 0, 0)  # Red frame
        
        mock_frame_generator.return_value = iter([test_frame])
        
        result = extract_frame_as_base64(self.test_video_path, 1)
        
        self.assertIsInstance(result, str)
        self.assertTrue(result.startswith('data:image/jpeg;base64,'))


class VideoIntegrationTest(TestCase):
    """Integration tests for video functionality"""
    
    def setUp(self):
        """Set up test data"""
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
    def test_video_workflow(self):
        """Test the complete video workflow from creation to viewing"""
        video_file = SimpleUploadedFile(
            "integration_test.mp4",
            b"fake video content for integration test",
            content_type="video/mp4"
        )
        
        # Create a video
        video = Video.objects.create(
            caption="Integration Test Video",
            video=video_file,
            slug="integration-test-video",
            user=self.user
        )
        
        # Test that the video appears in the index
        response = self.client.get(reverse('video:index'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Integration Test Video")
        
        # Test accessing the video detail page
        detail_url = reverse(
            'video:video_detail',
            args=[
                video.publish.year,
                video.publish.month,
                video.publish.day,
                video.slug
            ]
        )
        
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Integration Test Video")
