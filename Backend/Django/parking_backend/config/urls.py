"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.1/topics/http/urls/
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
from django.urls import path
from parking import views


urlpatterns = [
    path(
        'admin/', 
        admin.site.urls
    ),

    path(
        'api/parking_slots_list/',
        views.parking_slots_list,
        name='parking_slots'
    ),

    path(
        'api/register/',
        views.register_user,
        name='register'
    ),

    path(
        'api/login/',
        views.login_user,name='login'
    ),

    path(
        'api/csrf/',
        views.csrf_token,
        name='csrf_token'
    ),

    path(
        'api/booking/create/',
        views.create_booking,
        name='create_booking'
    ),

    path(
        'api/booking/<int:booking_id>/cancel/',
        views.cancel_booking,
        name='cancel_booking'
    ),


    path(
    "api/my-bookings/",
    views.my_bookings,
    name="my_bookings",
),

    
path(
    'api/owner/slots/',
    views.owner_slots_list,
    name='owner_slots_list'
),
path(
    'api/owner/slots/create/',
    views.owner_create_slot,
    name='owner_create_slot'
),
path(
    'api/owner/slots/<int:slot_id>/update/',
    views.owner_update_slot,
    name='owner_update_slot'
),
path(
    'api/owner/slots/<int:slot_id>/delete/',
    views.owner_delete_slot,
    name='owner_delete_slot'
),

path(
    'api/owner/register/',
    views.register_owner,
    name='register_owner'
),


path(
    'api/admin/owners/',
    views.admin_owner_list,
    name='admin_owner_list'
),

path(
    'api/admin/users/',
    views.admin_user_list,
    name='admin_user_list'
),

path(
    'api/admin/owners/<int:owner_id>/status/',
    views.admin_update_owner_status,
    name='admin_update_owner_status'
),

path(
    'api/owner/pricing/', 
    views.owner_pricing, 
    name='owner_pricing'
),

path(
    'api/logout/', 
    views.logout_user, 
    name='logout_user'
),


path(
    "api/parking/owners/",
    views.customer_parking_owners,
    name="customer_parking_owners",
),


]