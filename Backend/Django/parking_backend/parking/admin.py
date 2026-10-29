from django.contrib import admin
from .models import ParkingSlot, OwnerProfile

admin.site.register(ParkingSlot)


@admin.register(OwnerProfile)
class OwnerProfileAdmin(admin.ModelAdmin):
    list_display = (
        'business_name',
        'user',
        'phone',
        'approval_status',
        'created_at',
    )

    list_filter = ('approval_status',)

    search_fields = (
        'business_name',
        'user__username',
        'user__email',
    )

    list_editable = ('approval_status',)
