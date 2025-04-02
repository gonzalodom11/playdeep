from ninja import Schema
from datetime import datetime
from django.core.files.uploadedfile import UploadedFile
from django.core.exceptions import ValidationError


# Custom function to validate file type
def validate_video_file(video: UploadedFile):
    allowed_types = ["video/mp4", "video/mkv", "video/avi", "video/webm"]
    if video.content_type not in allowed_types:
        raise ValidationError("Invalid video format. Allowed formats: MP4, MKV, AVI, WEBM")

class VideoSchema(Schema):
    id: int
    caption: str
    video: str  # This will store the file URL as a string
    publish: datetime
    slug: str

    class Config:
        from_attributes = True  # Allows conversion from Django model instances


class VideoCreateSchema(Schema):
    video: UploadedFile  # Accepts file uploads instead of just a string
    caption: str

    def validate(self):
        validate_video_file(self.video)
