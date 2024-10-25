from django.db import models
from django.contrib.auth.models import AbstractUser

class UserType(models.TextChoices):
    ADMIN = 'ADMIN', 'Administrador'
    FACILITATOR = 'FACILITATOR', 'Facilitador'
    DIRECTOR = 'DIRECTOR', 'Directivo'
    PARTNER = 'PARTNER', 'Socio'

class RoleType(models.TextChoices):
    PRESIDENT = 'PRESIDENTE', 'Presidente'
    SECRETARIO = 'SECRETARIO', 'Secretario'
    TESORERO = 'TESORERO', 'Tesorero'
    VOCAL = 'VOCAL', 'Vocal'
    SOCIO = 'SOCIO', 'Socio'
    NONE = 'NONE', 'None'

class DocumentType(models.TextChoices):
    DNI = 'DNI', 'DNI'
    CE = 'CE', 'CE'
    NONE = 'NONE', 'None'
    
class CustomUser(AbstractUser):
    # Basic Info
    username = models.CharField(max_length=255, unique=True)
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=255, null=True, blank=True)
    last_name = models.CharField(max_length=255, null=True, blank=True)
    full_name = models.CharField(max_length=255, blank=True)
    
    # User Type and Role
    is_admin = models.BooleanField(default=False)
    user_type = models.CharField(
        max_length=20,
        choices=UserType.choices,
        default=UserType.PARTNER
    )
    
    # Document Information
    document_type = models.CharField(
        max_length=10,
        choices=DocumentType.choices,
        default=DocumentType.NONE
    )
    document_number = models.CharField(max_length=20, blank=True)

    groups = models.ManyToManyField(
        'auth.Group',
        related_name='custom_user_set',  # Custom related_name to avoid conflict
        blank=True,
        help_text='The groups this user belongs to.',
        verbose_name='groups'
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='custom_user_permissions',  # Custom related_name to avoid conflict
        blank=True,
        help_text='Specific permissions for this user.',
        verbose_name='user permissions'
    )
    
    # Contact and Location
    phone_number = models.CharField(max_length=15, blank=True)
    province = models.CharField(max_length=100, blank=True)
    district = models.CharField(max_length=100, blank=True)
    address = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)
    
    # Additional Information
    birth_date = models.DateField(null=True, blank=True)
    occupation = models.CharField(max_length=100, blank=True)
    about = models.TextField(blank=True)
    profile_picture = models.URLField(max_length=255, blank=True)
    
    # Specific Fields
    shares = models.IntegerField(default=0)
    junta_count = models.IntegerField(default=0)

    def __str__(self):
        return self.email

    @property
    def is_admin_user(self):
        return self.user_type == UserType.ADMIN  
    