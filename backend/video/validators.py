
from django.forms import ValidationError



def file_size(value):
    file_size = value.size
    if file_size > 80000000:
        raise ValidationError("The maximum file size that can be uploaded is 80MB")
    else:
        return value