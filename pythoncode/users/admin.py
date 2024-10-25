from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

class CustomUserAdmin(UserAdmin):
    fieldsets = (
        (None, {'fields': ('email', 'username', 'password')}),
        ('Personal Info', {
            'fields': ('first_name', 'last_name', 'full_name', 'birth_date', 
                      'occupation', 'about', 'profile_picture')
        }),
        ('Document Info', {
            'fields': ('document_type', 'document_number')
        }),
        ('Contact & Location', {
            'fields': ('phone_number', 'province', 'district', 'address', 
                      'city', 'country')
        }),
        ('Role & Type', {
            'fields': ('user_type', 'is_admin')
        }),
        ('Specific Info', {
            'fields': ('shares', 'junta_count')
        }),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 
                      'groups', 'user_permissions')
        }),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'password1', 'password2', 
                      'first_name', 'last_name', 'full_name',
                      'document_type', 'document_number', 'birth_date',
                      'province', 'district', 'address', 'shares',
                      'user_type')
        }),
    )
    
    list_display = ('username', 'email', 'first_name', 'last_name', 
                   'user_type', 'is_staff', 'is_superuser')
    search_fields = ('username', 'email', 'first_name', 'last_name', 
                    'document_number')
    ordering = ('email',)

admin.site.register(CustomUser, CustomUserAdmin)