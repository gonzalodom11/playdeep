from ninja import Schema

class UserSchema(Schema):
    username: str
    is_authenticated: bool
    email: str = None

class RegisterSchema(Schema):
    username: str
    email: str
    password: str

class LoginSchema(Schema):
    username: str
    password: str 