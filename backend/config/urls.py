"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    # /api/users/ (signup, login)
    # /api/profile/ (프로필 관련)
    # /api/titles/, /api/tech-stacks/, /api/clubs/ (참조 데이터)
    path('api/', include('users.urls')),
    # POST /api/token/refresh/ (Access Token 재발급)
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
