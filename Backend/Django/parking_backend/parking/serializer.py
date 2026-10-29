from rest_framework import serializers
from .models import ParkingSlot
from rest_framework import serializers
from django.utils import timezone
from .models import Booking




class ParkingSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParkingSlot
        fields = '__all__'
        read_only_fields = ['owner']




class BookingSerializer(serializers.ModelSerializer):
    slot_number = serializers.CharField(
        source='parking_slot.slot_number',
        read_only=True
    )

    vehicle_type = serializers.CharField(
        source='parking_slot.vehicle_type',
        read_only=True
    )

    business_name = serializers.CharField(
        source='parking_slot.owner.business_name',
        read_only=True
    )

    class Meta:
        model = Booking
        fields = [
            'id',
            'user',
            'parking_slot',
            'slot_number',
            'vehicle_type',
            'business_name',
            'start_time',
            'end_time',
            'status',
            'created_at',
        ]

        read_only_fields = [
            'id',
            'user',
            'status',
            'created_at',
            'slot_number',
            'vehicle_type',
            'business_name',
        ]

    def validate(self, data):
        start_time = data.get('start_time')
        end_time = data.get('end_time')
        parking_slot = data.get('parking_slot')

        if start_time and end_time:
            if start_time >= end_time:
                raise serializers.ValidationError(
                    "End time must be after start time."
                )

            if start_time <= timezone.now():
                raise serializers.ValidationError(
                    "Booking start time must be in the future."
                )

        if start_time and end_time and parking_slot:
            overlapping_bookings = Booking.objects.filter(
                parking_slot=parking_slot,
                start_time__lt=end_time,
                end_time__gt=start_time,
                status__in=['Pending', 'Confirmed'],
            )

            if overlapping_bookings.exists():
                raise serializers.ValidationError(
                    "This parking slot is already booked for this time."
                )

        return data
