from ninja import NinjaAPI, Router
from ninja_jwt.controller import NinjaJWTDefaultController
from ninja_jwt.authentication import JWTAuth
from ninja_extra import NinjaExtraAPI
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login
from .schemas import UserSchema, RegisterSchema, LoginSchema

api = NinjaExtraAPI()
api.register_controllers(NinjaJWTDefaultController)
api.add_router("", "video.api.router")

router = Router()

@router.post("/register")
def register(request, data: RegisterSchema):
    user = User.objects.create_user(username=data.username, password=data.password, email=data.email)
    return {"success": True, "message": "User registered successfully"}

@router.post("/login")
def login_user(request, data: LoginSchema):
    user = authenticate(request, username=data.username, password=data.password)
    if user is not None:
        login(request, user)
        return {"success": True, "message": "Logged in successfully"}
    else:
        return {"success": False, "message": "Invalid credentials"}
    
@router.get("/me", response=UserSchema, auth=JWTAuth())
def me(request):
    return request.user

api.add_router("/auth", router)


