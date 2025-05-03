from django.utils import timezone
from django.db import models
from django.urls import reverse
from .validators import file_size
from .storage_backend import AzureMediaStorage
# Create your models here.

class Video(models.Model):
    caption = models.CharField(max_length=100)
    video= models.FileField(storage=AzureMediaStorage, upload_to='%y/%m/%d', validators=[file_size])
    publish = models.DateTimeField(default=timezone.now)
    slug = models.SlugField(
        max_length=250,
        unique_for_date='publish'
    )
    def __str__(self):
        return self.caption
    
    class Meta:
        ordering = ['-publish']
        indexes = [
            models.Index(fields=['-publish']),
        ]
    
    def get_absolute_url(self):
        return reverse(
            'video:video_detail',
            args=[
                self.publish.year,
                self.publish.month,
                self.publish.day,
                self.slug
            ]
        )