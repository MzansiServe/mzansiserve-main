"""
Pricing Service
"""
import math
from datetime import datetime, time
from backend.models import AppSetting
from backend.extensions import db

class PricingService:
    """Service for calculating service prices"""
    
    # Default settings (used if not in DB)
    DEFAULTS = {
        'base_rate_small_hatchback': 8.12,
        'base_rate_sedan': 8.44,
        'base_rate_suv': 8.92,
        'base_rate_bakkie': 9.40,
        'base_rate_luxury': 11.80,
        'base_rate_van': 15.00,
        'base_rate_truck': 20.00,
        'time_rate_early_peak': 2.0,   # 05:00 - 09:00 (R/min)
        'time_rate_mid_morning': 1.0,  # 09:00 - 12:00
        'time_rate_lunch': 1.5,        # 12:00 - 14:00
        'time_rate_afternoon': 1.0,    # 14:00 - 15:30
        'time_rate_late_peak': 2.0,    # 15:30 - 21:00 (extended from 15:01-21:00)
        'time_rate_night': 3.0,        # 21:00 - 05:00
        'tier2_discount_percent': 5.0, # 100-200km
        'tier3_discount_percent': 10.0 # >200km
    }

    @staticmethod
    def get_setting(key):
        """Get float setting from DB or default"""
        setting = AppSetting.query.get(key)
        if setting:
            try:
                return float(setting.value)
            except (ValueError, TypeError):
                pass
        return PricingService.DEFAULTS.get(key, 0.0)

    @staticmethod
    def get_time_rate(request_time: time):
        """Get R/min rate based on time of day"""
        # Convert time to minutes from midnight for easier comparison
        minutes = request_time.hour * 60 + request_time.minute
        
        # 05:00 (300) - 09:00 (540)
        if 300 <= minutes < 540:
            return PricingService.get_setting('time_rate_early_peak')
        # 09:00 (540) - 12:00 (720)
        elif 540 <= minutes < 720:
            return PricingService.get_setting('time_rate_mid_morning')
        # 12:00 (720) - 14:00 (840)
        elif 720 <= minutes < 840:
            return PricingService.get_setting('time_rate_lunch')
        # 14:00 (840) - 15:30 (930)
        elif 840 <= minutes < 930:
            return PricingService.get_setting('time_rate_afternoon')
        # 15:30 (930) - 21:00 (1260)
        elif 930 <= minutes < 1260:
            return PricingService.get_setting('time_rate_late_peak')
        # 21:00 (1260) - 04:59 (299) - Night time wraps around
        else:
            return PricingService.get_setting('time_rate_night')

    @staticmethod
    def calculate_trip_price(distance_km: float, date_time: datetime, car_type: str = 'sedan'):
        """
        Calculate trip price based on distance, time, and car type.
        
        Rules:
        - Distance < 20km: Time-based pricing (estimated duration * time_rate) 
          *Correction* PDF says "For All trips than are longer than 20 KM traffis are not calculated per time"
          Implies < 20km IS calculated per time (or has a time component). 
          However, usually distance is also a factor. 
          Interpretation: < 20km = (Price per KM * Distance) + (Estimated Time * Time Rate)
          Wait, looking at PDF again:
          "05:00 – 09:00 = 1 X 2 minutes = 2" ... looks like pure time based multiplier?
          Actually, the PDF says: "For All trips than are longer than 20 KM traffis are not calculated per time".
          This implies < 20km includes time calculation.
          
          Let's implement: Max(Base Price, (Distance * Rate) + (Duration * TimeRate)) for short trips?
          Or just following standard logic:
          Price = Distance * Rate_per_km
          IF < 20km: Add Time_Based_Surcharge (Duration * Rate_per_min)
          IF > 20km: Apply Distance Tier Discounts, Ignore Time Rate.
        """
        if distance_km is None or distance_km < 0:
            return 0.0

        # Base Rate per KM
        rate_key = f'base_rate_{car_type.lower()}'
        rate_per_km = PricingService.get_setting(rate_key)
        if rate_per_km == 0.0:
            rate_per_km = PricingService.get_setting('base_rate_sedan') # Fallback

        price = distance_km * rate_per_km

        # Tiered Logic matches PDF:
        # 20 < TRIP < 100 KM = Standard (already calculated)
        # 100 < Trip < 200 = Standard - 5%
        # 200 < Trip < Max = Standard - 10%
        
        if 100 < distance_km <= 200:
             discount_percent = PricingService.get_setting('tier2_discount_percent')
             price = price * (1 - (discount_percent / 100.0))
        elif distance_km > 200:
             discount_percent = PricingService.get_setting('tier3_discount_percent')
             price = price * (1 - (discount_percent / 100.0))

        # Time Based Logic for Short Trips (< 20km)
        if distance_km <= 20:
            # Estimate duration: 3 mins per km in city (avg 20km/h)
            estimated_duration_min = distance_km * 3 
            
            time_rate = PricingService.get_time_rate(date_time.time())
            time_charge = estimated_duration_min * time_rate
            
            # The PDF notation "1 X 2 minutes = 2" is cryptic but implies Rate x Minutes.
            # We add this to the distance based price for short trips to account for traffic/time.
            price += time_charge

        return round(price, 2)
