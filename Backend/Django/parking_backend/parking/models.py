from django.db import models
from django.conf import settings
# Create your models here.



class ParkingSlot(models.Model):
    VEHICLE_CHOICES = [
        ('Car', 'Car'),
        ('Bike', 'Bike'),
    ]

    STATUS_CHOICES = [
        ('Available', 'Available'),
        ('Booked', 'Booked'),
    ]

    owner = models.ForeignKey(
        'parking.OwnerProfile',
        on_delete=models.CASCADE,
        related_name='parking_slots',
        null=True,
        blank=True
    )

    slot_number = models.CharField(max_length=10, unique=True)
    vehicle_type = models.CharField(
        max_length=10,
        choices=VEHICLE_CHOICES
    )
    status = models.CharField(
        max_length=15,
        choices=STATUS_CHOICES,
        default='Available'
    )

    def __str__(self):
        return self.slot_number



class Booking(models.Model):
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Confirmed', 'Confirmed'),
        ('Cancelled', 'Cancelled'),
        ('Completed', 'Completed'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='parking_bookings'
    )

    parking_slot = models.ForeignKey(
        ParkingSlot,
        on_delete=models.PROTECT,
        related_name='bookings'
    )

    start_time = models.DateTimeField()
    end_time = models.DateTimeField()

    status = models.CharField(
        max_length=15,
        choices=STATUS_CHOICES,
        default='Pending'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Booking {self.id} - {self.parking_slot.slot_number}"
 

 
class OwnerProfile(models.Model):
    APPROVAL_CHOICES = [
        ('Pending', 'Pending'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='owner_profile'
    )

    business_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=15)
    business_address = models.TextField()

    car_price_per_hour = models.DecimalField(
    max_digits=8,
    decimal_places=2,
    default=0)
    bike_price_per_hour = models.DecimalField(
    max_digits=8,
    decimal_places=2,
    default=0)

    approval_status = models.CharField(
        max_length=10,
        choices=APPROVAL_CHOICES,
        default='Pending'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.business_name
   