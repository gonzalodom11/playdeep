from django.contrib.auth.models import User

# Replace 'your_username' with your superuser's username
user = User.objects.get(username='admin')

# Replace 'new_password' with your desired new password
user.set_password('admin')
user.save()