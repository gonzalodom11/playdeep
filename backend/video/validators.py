
from django.forms import ValidationError



def file_size(value):
    file_size = value.size
    if file_size > 90000000:
        raise ValidationError("The maximum file size that can be uploaded is 90MB")
    else:
        return value