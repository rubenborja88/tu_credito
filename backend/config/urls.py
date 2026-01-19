from django.contrib import admin
from django.urls import path, include
from django.conf import settings

urlpatterns = [
    path("admin/", admin.site.urls),
    path("v1/", include("config.v1_urls")),
]

if settings.DEBUG:
    from drf_spectacular.views import (
        SpectacularAPIView,
        SpectacularSwaggerView,
        SpectacularRedocView,
    )

    urlpatterns += [
        path("v1/schema/", SpectacularAPIView.as_view(), name="schema"),
        path("v1/docs/", SpectacularSwaggerView.as_view(url_name="schema")),
        path("v1/redoc/", SpectacularRedocView.as_view(url_name="schema")),
    ]
