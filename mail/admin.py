from django.contrib import admin
from .models import User, Email

class EmailInline(admin.TabularInline):
    model =   Email
    fk_name = "user"
    
class EmailRecipientInline(admin.TabularInline):
    model = Email.recipients.through
    

class EmailAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "sender","subject", "body", "timestamp", "read", "archived")
    filter_horizontal = ("recipients",)
    
    
class UserAdmin(admin.ModelAdmin):
    list_display = ("id", "email")
    inlines = [
        EmailInline, EmailRecipientInline
    ]

# Register your models here.

admin.site.register(Email, EmailAdmin)
admin.site.register(User, UserAdmin)