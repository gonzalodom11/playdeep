# Generated by Django 5.0.12 on 2025-03-09 18:55

import video.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('video', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='video',
            name='video',
            field=models.FileField(upload_to='videos/%y', validators=[video.validators.file_size]),
        ),
    ]
