from django.contrib import admin
from .models import Video

# Register your models here.

@admin.register(Video)
class PostAdmin(admin.ModelAdmin):
    list_display = ['caption', 'slug', 'video', 'publish']
    list_filter = ['publish']
    search_fields = ['caption']
    prepopulated_fields = {'slug': ('caption',)}
    date_hierarchy = 'publish'
    ordering = ['publish']
    show_facets = admin.ShowFacets.ALWAYS