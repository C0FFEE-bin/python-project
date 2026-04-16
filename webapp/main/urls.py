from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="home"),
    path("onboarding", views.onboarding_account_type, name="onboarding_account_type"),
    path("preview/<slug:component_slug>", views.component_preview, name="component_preview"),
    path("about", views.about, name="about"),
    path("tutor/profile", views.tutor_profile_settings, name="tutor_profile_settings"),
    path("tutor/messages", views.tutor_messages, name="tutor_messages"),
    path("database-error", views.database_error_page, name="database_error_page"),
    path("login", views.login_user, name="login_user"),
    path("register", views.register, name="register_user"),
    path("logout", views.logout_user, name="logout_user"),
    path("api/portal-observations", views.portal_observations, name="portal_observations"),
    path("api/portal-post-comments", views.portal_post_comments, name="portal_post_comments"),
    path("api/portal-posts", views.portal_posts, name="portal_posts"),
    path("api/student-onboarding/profile", views.student_onboarding_save, name="student_onboarding_save"),
    path("api/tutor-search", views.tutor_search, name="tutor_search"),
    path("api/tutor-onboarding/profile", views.tutor_onboarding_save, name="tutor_onboarding_save"),
    path("api/tutor-dashboard", views.tutor_dashboard_data, name="tutor_dashboard_data"),
    path("api/tutor-profile", views.tutor_profile_base, name="tutor_profile_base"),
    path("api/tutor-profile/<int:tutor_id>", views.tutor_profile, name="tutor_profile"),
    path("api/tutor-reviews", views.tutor_reviews, name="tutor_reviews"),
    path("api/register/", views.api_register, name="api_register"),
    path("api/user/", views.api_current_user, name="api_current_user"),
    path("api/notifications/", views.api_notifications, name="api_notifications"),
]
