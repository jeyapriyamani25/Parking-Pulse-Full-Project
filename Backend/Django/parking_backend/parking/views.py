import math
from decimal import Decimal, InvalidOperation
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, IsAdminUser

from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import ensure_csrf_cookie
from django.middleware.csrf import get_token

from django.shortcuts import get_object_or_404
from django.db import transaction, IntegrityError

from .models import Booking, ParkingSlot, OwnerProfile
from .serializer import ParkingSlotSerializer, BookingSerializer



# Create your views here.

def can_manage_parking_slots(user):
    if not user.is_authenticated:
        return False

    # Platform admin access
    if user.is_superuser:
        return True

    try:
        return user.owner_profile.approval_status == 'Approved'
    except OwnerProfile.DoesNotExist:
        return False


def is_approved_owner(user):
    if not user.is_authenticated:
        return False

    try:
        return user.owner_profile.approval_status == 'Approved'
    except OwnerProfile.DoesNotExist:
        return False


    

@api_view(['GET'])
def parking_slots_list(request):
    slots = ParkingSlot.objects.order_by('vehicle_type', 'slot_number')
    serializer = ParkingSlotSerializer(slots, many=True)
    return Response(serializer.data)



#owner_slots_list

# owner_slots_list
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def owner_slots_list(request):
    if not can_manage_parking_slots(request.user):
        return Response(
            {"error": "Admin approval is required."},
            status=status.HTTP_403_FORBIDDEN
        )

    if request.user.is_superuser:
        slots = ParkingSlot.objects.all()
    else:
        slots = ParkingSlot.objects.filter(
            owner=request.user.owner_profile
        )

    serializer = ParkingSlotSerializer(slots, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def owner_create_slot(request):
    if not can_manage_parking_slots(request.user):
        return Response(
            {"error": "Admin approval is required."},
            status=status.HTTP_403_FORBIDDEN
        )

    serializer = ParkingSlotSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    if request.user.is_superuser:
        serializer.save()
    else:
        serializer.save(owner=request.user.owner_profile)

    return Response(
        serializer.data,
        status=status.HTTP_201_CREATED
    )



@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def owner_update_slot(request, slot_id):
    if not can_manage_parking_slots(request.user):
        return Response(
            {"error": "Admin approval is required."},
            status=status.HTTP_403_FORBIDDEN
        )

    if request.user.is_superuser:
        slot = get_object_or_404(ParkingSlot, pk=slot_id)
    else:
        slot = get_object_or_404(
            ParkingSlot,
            pk=slot_id,
            owner=request.user.owner_profile
        )

    serializer = ParkingSlotSerializer(
        slot,
        data=request.data,
        partial=True
    )
    serializer.is_valid(raise_exception=True)
    serializer.save(owner=slot.owner)

    return Response(serializer.data)



@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def owner_delete_slot(request, slot_id):
    if not can_manage_parking_slots(request.user):
        return Response(
            {"error": "Admin approval is required."},
            status=status.HTTP_403_FORBIDDEN
        )

    if request.user.is_superuser:
        slot = get_object_or_404(ParkingSlot, pk=slot_id)
    else:
        slot = get_object_or_404(
            ParkingSlot,
            pk=slot_id,
            owner=request.user.owner_profile
        )

    if slot.bookings.filter(
        status__in=['Pending', 'Confirmed']
    ).exists():
        return Response(
            {"error": "Cannot delete a slot with active bookings."},
            status=status.HTTP_400_BAD_REQUEST
        )

    slot.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def owner_pricing(request):
    if not can_manage_parking_slots(request.user):
        return Response(
            {"error": "Admin approval is required."},
            status=status.HTTP_403_FORBIDDEN
        )
    print("USERNAME:", request.user.username)
    print("IS SUPERUSER:", request.user.is_superuser)
    print("PRICING SESSION KEY:", request.session.session_key)

    if request.user.is_superuser:
        return Response(
            {"error": "Use an owner account to manage owner pricing."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        owner = request.user.owner_profile
    except OwnerProfile.DoesNotExist:
        return Response(
            {"error": "Owner profile not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    if request.method == 'GET':
        return Response({
            "business_name": owner.business_name,
            "car_price_per_hour": owner.car_price_per_hour,
            "bike_price_per_hour": owner.bike_price_per_hour,
        })

    car_price = request.data.get('car_price_per_hour')
    bike_price = request.data.get('bike_price_per_hour')

    if car_price is None or bike_price is None:
        return Response(
            {"error": "Car and Bike hourly prices are required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        car_price = float(car_price)
        bike_price = float(bike_price)

        if (
            not math.isfinite(car_price)
            or not math.isfinite(bike_price)
            or car_price <= 0
            or bike_price <= 0
        ):
            raise ValueError
    except (ValueError, TypeError):
        return Response(
            {"error": "Both prices must be valid numbers greater than zero."},
            status=status.HTTP_400_BAD_REQUEST
        )

    owner.car_price_per_hour = car_price
    owner.bike_price_per_hour = bike_price
    owner.save(update_fields=[
        'car_price_per_hour',
        'bike_price_per_hour'
    ])

    return Response({
        "message": "Pricing updated successfully.",
        "business_name": owner.business_name,
        "car_price_per_hour": owner.car_price_per_hour,
        "bike_price_per_hour": owner.bike_price_per_hour,
    })

#create_booking
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_booking(request):
    slot_id = request.data.get('parking_slot')

    if not slot_id or not request.data.get('start_time') or not request.data.get('end_time'):
        return Response(
            {"error": "Parking slot, start time and end time are required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    serializer = BookingSerializer(
        data=request.data,
        context={'request': request}
    )
    serializer.is_valid(raise_exception=True)

    start = serializer.validated_data['start_time']
    end = serializer.validated_data['end_time']

    with transaction.atomic():
        slot = get_object_or_404(
            ParkingSlot.objects.select_for_update(),
            pk=slot_id
        )

        overlapping = Booking.objects.filter(
            parking_slot=slot,
            start_time__lt=end,
            end_time__gt=start,
            status__in=['Pending', 'Confirmed']
        ).exists()

        if overlapping:
            return Response(
                {"error": "This slot is already booked for that time."},
                status=status.HTTP_400_BAD_REQUEST
            )

        booking = serializer.save(user=request.user)

        # Keep the existing general slot status in sync.
        # Booking permission is determined by time overlap above.
        slot.status = 'Booked'
        slot.save(update_fields=['status'])

    return Response(
        BookingSerializer(booking).data,
        status=status.HTTP_201_CREATED
    )


# my_bookings
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_bookings(request):
    bookings = (
        Booking.objects
        .filter(user=request.user)
        .select_related('parking_slot')
        .order_by('-created_at')
    )

    serializer = BookingSerializer(
        bookings,
        many=True,
        context={'request': request}
    )

    return Response(
        serializer.data,
        status=status.HTTP_200_OK
    )



#cancel_booking
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_booking(request, booking_id):
    booking = get_object_or_404(
        Booking,
        pk=booking_id,
        user=request.user
    )

    if booking.status in ['Cancelled', 'Completed']:
        return Response(
            {"error": "This booking cannot be cancelled."},
            status=status.HTTP_400_BAD_REQUEST
        )

    with transaction.atomic():
        slot = ParkingSlot.objects.select_for_update().get(
            pk=booking.parking_slot_id
        )

        booking.status = 'Cancelled'
        booking.save(update_fields=['status'])

        other_active_bookings = Booking.objects.filter(
            parking_slot=slot,
            status__in=['Pending', 'Confirmed']
        ).exclude(pk=booking.pk).exists()

        if not other_active_bookings:
            slot.status = 'Available'
            slot.save(update_fields=['status'])

    return Response(
        {
            "message": "Booking cancelled successfully.",
            "booking": BookingSerializer(booking).data
        },
        status=status.HTTP_200_OK
    )


#Register_user
@api_view(['POST'])
def register_user(request):
    username = request.data.get('username', '').strip()
    email = request.data.get('email', '').strip()
    password = request.data.get('password', '')

    if not username or not email or not password:
        return Response(
            {"error": "All fields are required"},
            status=400
        )

    if len(password) < 8:
        return Response(
            {"error": "Password must be at least 8 characters"},
            status=400
        )

    if User.objects.filter(username__iexact=username).exists():
        return Response(
            {"error": "Username already exists"},
            status=400
        )

    if User.objects.filter(email__iexact=email).exists():
        return Response(
            {"error": "Email already exists"},
            status=400
        )

    User.objects.create_user(
        username=username,
        email=email,
        password=password
    )

    return Response(
        {"message": "Registration successful"},
        status=201
    )

#Login_user

# Login user
@api_view(['POST'])
def login_user(request):
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '')

    if not username or not password:
        return Response(
            {"error": "Username and password are required"},
            status=400
        )

    user = authenticate(
        request,
        username=username,
        password=password
    )

    if user is None:
        return Response(
            {"error": "Invalid username or password"},
            status=400
        )

    if not user.is_active:
        return Response(
            {"error": "Account is inactive"},
            status=403
        )

    # Check whether this user is a parking owner
    try:
        owner_profile = user.owner_profile
    except OwnerProfile.DoesNotExist:
        owner_profile = None

    # Owner approval check
    if owner_profile:
        if owner_profile.approval_status != 'Approved':
            return Response(
                {
                    "error": (
                        "Your owner account is "
                        + owner_profile.approval_status
                        + ". Please contact the admin."
                    )
                },
                status=403
            )

    login(request, user)
    request.session.save()
    print("LOGIN SESSION KEY:", request.session.session_key)
    print("SUCCESSFUL LOGIN:", user.username, "OWNER:", owner_profile is not None)

    return Response({
        "message": "Login successful",
        "username": user.username,
        "is_admin": user.is_staff,
        "is_owner": owner_profile is not None,
        "approval_status": (
            owner_profile.approval_status
            if owner_profile else None
        )
    })

@api_view(['POST'])
def logout_user(request):
    logout(request)
    return Response({"message": "Logged out successfully."})

#csrf_token
@ensure_csrf_cookie
@api_view(['GET'])
def csrf_token(request):
    token = get_token(request)
    return Response({
        "message": "CSRF cookie set",
        "csrfToken": token
    })


#Register_Owner

@api_view(['POST'])
def register_owner(request):
    username = request.data.get('username', '').strip()
    email = request.data.get('email', '').strip()
    password = request.data.get('password', '')
    business_name = request.data.get('business_name', '').strip()
    phone = request.data.get('phone', '').strip()
    business_address = request.data.get('business_address', '').strip()

    car_price = request.data.get('car_price_per_hour')
    bike_price = request.data.get('bike_price_per_hour')

    if not all([
        username, email, password,
        business_name, phone, business_address,
        car_price, bike_price
    ]):
        return Response(
            {"error": "All fields are required, including parking prices."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        car_price = Decimal(str(car_price))
        bike_price = Decimal(str(bike_price))

        if car_price <= 0 or bike_price <= 0:
            return Response(
                {"error": "Car and Bike prices must be greater than zero."},
                status=status.HTTP_400_BAD_REQUEST
            )
    except (InvalidOperation, ValueError, TypeError):
        return Response(
            {"error": "Enter valid Car and Bike hourly prices."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if len(password) < 8:
        return Response(
            {"error": "Password must be at least 8 characters."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if User.objects.filter(username__iexact=username).exists():
        return Response(
            {"error": "Username already exists."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if User.objects.filter(email__iexact=email).exists():
        return Response(
            {"error": "Email already exists."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        with transaction.atomic():
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password
            )

            OwnerProfile.objects.create(
                user=user,
                business_name=business_name,
                phone=phone,
                business_address=business_address,
                car_price_per_hour=car_price,
                bike_price_per_hour=bike_price,
                approval_status='Pending'
            )

    except IntegrityError:
        return Response(
            {"error": "Could not create owner account. Please try again."},
            status=status.HTTP_400_BAD_REQUEST
        )

    return Response(
        {
            "message": "Owner registration successful. Await admin approval.",
            "approval_status": "Pending"
        },
        status=status.HTTP_201_CREATED
    )


# Admin: Get all owner registrations
@api_view(['GET'])
def admin_owner_list(request):
    if not request.user.is_authenticated or not request.user.is_staff:
        return Response(
            {"error": "Admin access required"},
            status=status.HTTP_403_FORBIDDEN
        )

    owners = OwnerProfile.objects.select_related('user').all().order_by('-created_at')

    data = [
        {
            "id": owner.id,
            "username": owner.user.username,
            "email": owner.user.email,
            "business_name": owner.business_name,
            "phone": owner.phone,
            "business_address": owner.business_address,
            "approval_status": owner.approval_status,
            "created_at": owner.created_at,
        }
        for owner in owners
    ]

    return Response(data)



# Admin: Approve or reject an owner
@api_view(['POST'])
def admin_update_owner_status(request, owner_id):
    if not request.user.is_authenticated or not request.user.is_staff:
        return Response(
            {"error": "Admin access required"},
            status=status.HTTP_403_FORBIDDEN
        )

    approval_status = request.data.get('approval_status')

    if approval_status not in ['Approved', 'Rejected']:
        return Response(
            {"error": "Status must be Approved or Rejected"},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        owner = OwnerProfile.objects.get(id=owner_id)
    except OwnerProfile.DoesNotExist:
        return Response(
            {"error": "Owner registration not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    owner.approval_status = approval_status
    owner.save(update_fields=['approval_status'])

    return Response({
        "message": f"Owner {approval_status.lower()} successfully",
        "owner_id": owner.id,
        "approval_status": owner.approval_status
    })

#userlist in admin dashboard
@api_view(['GET'])
def admin_user_list(request):
    if not request.user.is_authenticated or not request.user.is_staff:
        return Response(
            {"error": "Admin access required"},
            status=status.HTTP_403_FORBIDDEN
        )

    users = User.objects.filter(
        is_staff=False,
        is_superuser=False
    ).order_by('-date_joined')

    data = [
        {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "date_joined": user.date_joined,
            "is_active": user.is_active,
        }
        for user in users
        if not hasattr(user, "owner_profile")
    ]

    return Response(data)



@api_view(["GET"])
def customer_parking_owners(request):
    # Only show approved parking owners
    owners = OwnerProfile.objects.filter(
        approval_status="Approved"
    ).select_related("user")

    result = []

    for owner in owners:
        # Get only this owner's parking slots
        slots = ParkingSlot.objects.filter(owner=owner)

        result.append({
            "owner_id": owner.id,
            "business_name": owner.business_name,
            "username": owner.user.username,
            "phone": owner.phone,
            "address": owner.business_address,
            "car_price_per_hour": owner.car_price_per_hour,
            "bike_price_per_hour": owner.bike_price_per_hour,
            "slots": ParkingSlotSerializer(
                slots, many=True
            ).data,
        })

    return Response(result, status=status.HTTP_200_OK)
