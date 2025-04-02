from ninja import Schema
from datetime import datetime

class VideoSchema(Schema):
    id: int
    caption: str
    video: str  # This will store the file URL as a string
    publish: datetime
    slug: str

    class Config:
        from_attributes = True  # Allows conversion from Django model instances


class VideoCreateSchema(Schema):
    video: str  # This will store the file URL as a string
    caption: str

