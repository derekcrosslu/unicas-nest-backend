from django.contrib import admin
from .models import Junta

from django.contrib.auth import get_user_model
User = get_user_model()

class JuntaAdmin(admin.ModelAdmin):
    list_display = ('name', 'total_shares', 'share_value', 'duration_months', 'current_month')
    filter_horizontal = ('members',)

    def formfield_for_manytomany(self, db_field, request, **kwargs):
        if db_field.name == "members":
            kwargs["queryset"] = User.objects.filter(is_active=True)
        return super().formfield_for_manytomany(db_field, request, **kwargs)

admin.site.register(Junta, JuntaAdmin)