
from django import forms
from .models import Video
from django.utils.text import slugify


class Video_form(forms.ModelForm):
    
    class Meta:
        model = Video
        fields = ("caption", "video")
    
    def save(self, commit=True):
        instance = super().save(commit=False)  # Don't save yet
        instance.slug = slugify(instance.caption)  # Generate slug from caption
        if commit:
            instance.save()  # Save only if commit=True
        return instance