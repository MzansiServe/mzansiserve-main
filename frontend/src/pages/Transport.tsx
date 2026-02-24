import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MapPin, Navigation, Car, Users, Clock, Loader2, PlaySquare, Calendar, Star,
  CheckCircle2, AlertCircle, ChevronRight, PhoneCall, Wallet
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";
import { useJsApiLoader, Autocomplete, GoogleMap, Marker } from "@react-google-maps/api";

type Step = 1 | 2 | 3;

const LIBRARIES: ("places")[] = ["places"];

// Using the key found in .env as a stable default to avoid 404 fetch issues during dev
const GOOGLE_MAPS_API_KEY = "AIzaSyBtXh26PcILBqis4Ad66wPetvU_wUKMNRs";

const VEHICLE_TYPES = [
  { id: "hatchback", name: "Small Hatchback", desc: "Affordable compact rides", icon: Car, capacity: 3, multiplier: 1 },
  { id: "sedan", name: "Sedan", desc: "Comfortable everyday rides", icon: Car, capacity: 4, multiplier: 1.2 },
  { id: "suv", name: "SUV", desc: "Spacious for groups", icon: Users, capacity: 6, multiplier: 1.8 },
  { id: "luxury", name: "Luxury", desc: "Travel in style", icon: Star, capacity: 4, multiplier: 2.5 },
];

const Transport = () => {
  const { toast } = useToast();

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  const [step, setStep] = useState<Step>(1);
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [pickupCoords, setPickupCoords] = useState<{ lat: number, lng: number } | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<{ lat: number, lng: number } | null>(null);

  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [scheduleType, setScheduleType] = useState<"now" | "later">("now");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState("12:00");
  const [driverPref, setDriverPref] = useState("");

  const [quote, setQuote] = useState<{ amount: number, rate: number } | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);

  // Refs for focusing and controlling Autocomplete
  const pickupInputRef = useRef<HTMLInputElement>(null);
  const dropoffInputRef = useRef<HTMLInputElement>(null);
  const pickupAutocompleteRef = useRef<any>(null);
  const dropoffAutocompleteRef = useRef<any>(null);

  useEffect(() => {
    if (loadError) {
      console.error("Google Maps Load Error:", loadError);
      toast({ variant: "destructive", title: "Maps Error", description: "Failed to load Google Maps. Suggestions may not work." });
    }
  }, [loadError, toast]);

  const handleSetRoute = async () => {
    if (!pickup || !dropoff || !pickupCoords || !dropoffCoords) {
      toast({
        variant: "destructive",
        title: "Missing locations",
        description: "Please select both pick-up and drop-off locations from the suggestions."
      });
      return;
    }
    setIsCalculating(true);

    if (isLoaded && window.google) {
      console.log("Calculating route with coords:", {
        pickup,
        dropoff,
        pickupCoords,
        dropoffCoords,
        formattedPickup: `${pickupCoords.lat},${pickupCoords.lng}`,
        formattedDropoff: `${dropoffCoords.lat},${dropoffCoords.lng}`
      });
      try {
        const service = new google.maps.DistanceMatrixService();
        service.getDistanceMatrix(
          {
            origins: [new google.maps.LatLng(pickupCoords.lat, pickupCoords.lng)],
            destinations: [new google.maps.LatLng(dropoffCoords.lat, dropoffCoords.lng)],
            travelMode: google.maps.TravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.METRIC,
          },
          (response, status) => {
            console.log("DistanceMatrix Response:", response);
            console.log("DistanceMatrix Status:", status);
            setIsCalculating(false);
            if (status === 'OK' && response && response.rows[0].elements[0].status === 'OK') {
              const distMetres = response.rows[0].elements[0].distance.value;
              setDistanceKm(distMetres / 1000);
              setStep(2);
            } else {
              const elementStatus = response?.rows[0]?.elements[0]?.status;
              console.error(`DistanceMatrix Failed. Status: ${status}, Element Status: ${elementStatus}`);
              toast({
                variant: "destructive",
                title: "Route Error",
                description: `Could not calculate driving distance. Status: ${status} ${elementStatus ? `(${elementStatus})` : ''}. Please try again.`
              });
            }
          }
        );
      } catch (err) {
        setIsCalculating(false);
        console.error("Distance Matrix Error:", err);
      }
    } else {
      setIsCalculating(false);
      toast({ variant: "destructive", title: "Error", description: "Google Maps service is not ready." });
    }
  };

  useEffect(() => {
    const fetchFare = async () => {
      if (distanceKm && selectedVehicle) {
        try {
          // Fetch real fare from database using the new endpoint
          const res = await apiFetch(`/api/public/calculate-fare?distance=${distanceKm}&car_type=${selectedVehicle}`);
          if (res.success && res.data?.fare) {
            setQuote({ amount: res.data.fare, rate: res.data.fare / distanceKm });
          } else {
            // Fallback to local calculation if API fails
            const v = VEHICLE_TYPES.find(v => v.id === selectedVehicle);
            if (v) {
              const rate = 12 * v.multiplier;
              const baseFare = 25;
              const total = baseFare + (distanceKm * rate);
              setQuote({ amount: total, rate: rate });
            }
          }
        } catch (error) {
          console.error("Failed to fetch fare:", error);
        }
      }
    };
    fetchFare();
  }, [distanceKm, selectedVehicle]);

  const handleRequestRide = async () => {
    if (!quote || !selectedVehicle) return;

    if (scheduleType === "later" && (!date || !time)) {
      toast({ variant: "destructive", title: "Missing Schedule", description: "Please provide both date and time for scheduled rides." });
      return;
    }

    setIsRequesting(true);
    try {
      const payload = {
        pickup: {
          address: pickup,
          lat: pickupCoords?.lat,
          lng: pickupCoords?.lng
        },
        dropoff: {
          address: dropoff,
          lat: dropoffCoords?.lat,
          lng: dropoffCoords?.lng
        },
        date,
        time,
        preferences: {
          car_type: selectedVehicle,
          driver_preference: driverPref
        },
        payment_amount: quote.amount,
        distance_km: distanceKm
      };

      const res = await apiFetch('/api/requests/cab-checkout', {
        method: 'POST',
        data: payload
      });

      if (res.success && res.data?.redirect_url) {
        toast({ title: "Redirecting", description: "Taking you to secure checkout..." });
        // Small delay to let toast show
        setTimeout(() => {
          window.location.href = res.data.redirect_url;
        }, 1000);
      } else {
        toast({ 
          variant: "destructive", 
          title: "Request failed", 
          description: res.message || "Could not initiate checkout." 
        });
      }
    } catch (e: any) {
      toast({ 
        variant: "destructive", 
        title: "Request failed", 
        description: e.message || "An unexpected error occurred." 
      });
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="flex-1 container mx-auto px-4 py-24 lg:px-8 max-w-4xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl tracking-tight">Request a Ride</h1>
          <p className="mt-3 text-lg text-slate-500">Get where you need to go safely and reliably across Mzansi.</p>
        </div>

        <div className="mb-12 relative max-w-2xl mx-auto">
          <div className="absolute left-[10%] right-[10%] top-1/2 -translate-y-1/2 h-[2px] bg-slate-200 -z-10 rounded-full"></div>
          <motion.div
            initial={false}
            animate={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
            className="absolute left-[10%] top-1/2 -translate-y-1/2 h-[2px] bg-primary -z-10 rounded-full transition-all duration-500 ease-in-out"
          ></motion.div>

          <div className="flex justify-between relative z-10 px-4">
            <div className="flex flex-col items-center cursor-pointer" onClick={() => step > 1 && setStep(1)}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-sm transition-colors duration-300 ${step >= 1 ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' : 'bg-slate-200 text-slate-500'}`}>
                {step > 1 ? <CheckCircle2 className="h-6 w-6" /> : '1'}
              </div>
              <span className={`mt-2 text-[13px] font-semibold ${step >= 1 ? 'text-primary' : 'text-slate-500'}`}>Route</span>
            </div>
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-sm transition-colors duration-300 ${step >= 2 ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' : 'bg-slate-200 text-slate-500'}`}>
                {step > 2 ? <CheckCircle2 className="h-6 w-6" /> : '2'}
              </div>
              <span className={`mt-2 text-[13px] font-semibold ${step >= 2 ? 'text-primary' : 'text-slate-500'}`}>Ride</span>
            </div>
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-sm transition-colors duration-300 ${step >= 3 ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' : 'bg-slate-200 text-slate-500'}`}>
                3
              </div>
              <span className={`mt-2 text-[13px] font-semibold ${step >= 3 ? 'text-primary' : 'text-slate-500'}`}>Confirm</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-border/60 overflow-hidden relative min-h-[400px]">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-6 sm:p-8"
              >
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-border/50 pb-4">
                  <Navigation className="h-5 w-5 text-primary" /> Where are you going?
                </h3>

                <div className="grid lg:grid-cols-2 gap-8">
                  <div className="space-y-6 relative">
                    <div className="absolute left-[1.1rem] top-[2.5rem] bottom-[5rem] w-0.5 bg-slate-200 z-0 hidden sm:block"></div>
                    <div className="relative z-10">
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Pick-up Location</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.15)]"></div>
                        </div>
                        {isLoaded ? (
                          <Autocomplete
                            onLoad={ref => pickupAutocompleteRef.current = ref}
                            onPlaceChanged={() => {
                              if (pickupAutocompleteRef.current) {
                                const place = pickupAutocompleteRef.current.getPlace();
                                if (place && place.geometry && place.geometry.location) {
                                  setPickup(place.formatted_address || place.name || "");
                                  setPickupCoords({
                                    lat: place.geometry.location.lat(),
                                    lng: place.geometry.location.lng()
                                  });
                                }
                              }
                            }}
                          >
                            <Input
                              ref={pickupInputRef}
                              value={pickup}
                              onChange={(e) => setPickup(e.target.value)}
                              placeholder="e.g. 1 Nelson Mandela Sq, Sandton"
                              className="pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white text-base shadow-sm"
                              onKeyDown={(e) => e.key === "Enter" && dropoffInputRef.current?.focus()}
                            />
                          </Autocomplete>
                        ) : (
                          <Input placeholder="Loading maps..." className="pl-10 h-12 bg-slate-50 border-slate-200" disabled />
                        )}
                      </div>
                    </div>

                    <div className="relative z-10">
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Drop-off Destination</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                          <div className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-[0_0_0_4px_rgba(244,63,94,0.15)]"></div>
                        </div>
                        {isLoaded ? (
                          <Autocomplete
                            onLoad={ref => dropoffAutocompleteRef.current = ref}
                            onPlaceChanged={() => {
                              if (dropoffAutocompleteRef.current) {
                                const place = dropoffAutocompleteRef.current.getPlace();
                                if (place && place.geometry && place.geometry.location) {
                                  setDropoff(place.formatted_address || place.name || "");
                                  setDropoffCoords({
                                    lat: place.geometry.location.lat(),
                                    lng: place.geometry.location.lng()
                                  });
                                }
                              }
                            }}
                          >
                            <Input
                              ref={dropoffInputRef}
                              placeholder="e.g. O.R. Tambo International Airport"
                              className="pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white text-base shadow-sm"
                              value={dropoff}
                              onChange={(e) => setDropoff(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && handleSetRoute()}
                            />
                          </Autocomplete>
                        ) : (
                          <Input placeholder="Loading maps..." className="pl-10 h-12 bg-slate-50 border-slate-200" disabled />
                        )}
                      </div>
                    </div>

                    <Button
                      className="w-full h-12 text-base font-bold shadow-md mt-2"
                      onClick={handleSetRoute}
                      disabled={isCalculating || !pickup || !dropoff}
                    >
                      {isCalculating ? (
                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Calculating route...</>
                      ) : (
                        <><MapPin className="mr-2 h-5 w-5" /> Set Route</>
                      )}
                    </Button>
                  </div>

                  <div className="bg-slate-100 rounded-xl border border-slate-200 overflow-hidden flex flex-col items-center justify-center min-h-[300px] text-slate-400 relative z-0">
                    {isLoaded && pickupCoords ? (
                      <GoogleMap
                        mapContainerStyle={{ width: '100%', height: '100%' }}
                        center={dropoffCoords || pickupCoords}
                        zoom={12}
                        options={{ disableDefaultUI: true, zoomControl: true }}
                      >
                        <Marker position={pickupCoords} title="Pickup" />
                        {dropoffCoords && (
                          <Marker position={dropoffCoords} title="Drop-off" />
                        )}
                      </GoogleMap>
                    ) : (
                      <div className="flex flex-col items-center">
                        <MapPin className="h-10 w-10 mb-2 opacity-50" />
                        <p className="text-sm">Map preview will appear here</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-6 sm:p-8 flex flex-col h-full"
              >
                <div className="flex items-center justify-between border-b border-border/50 pb-4 mb-6">
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Car className="h-5 w-5 text-primary" /> Choose Your Ride
                  </h3>
                  <div className="text-right bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                    <p className="text-xs text-slate-500 uppercase font-semibold">Est. Distance</p>
                    <p className="font-semibold text-slate-900 text-lg">{distanceKm?.toFixed(1)} <span className="text-sm font-medium text-slate-500">km</span></p>
                  </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8 mb-8">
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-semibold text-slate-800 mb-3">Vehicle Type</label>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {VEHICLE_TYPES.map((v) => {
                        const Icon = v.icon;
                        const isSelected = selectedVehicle === v.id;
                        return (
                          <div
                            key={v.id}
                            className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 ${isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'border-slate-200 bg-white hover:border-primary/40'}`}
                            onClick={() => setSelectedVehicle(v.id)}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className={`p-2.5 rounded-lg ${isSelected ? 'bg-primary text-white shadow-md' : 'bg-slate-100 text-slate-600'}`}>
                                <Icon className="h-6 w-6" />
                              </div>
                              {isSelected && (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-primary">
                                  <CheckCircle2 className="h-6 w-6" />
                                </motion.div>
                              )}
                            </div>
                            <h4 className="font-bold text-slate-900">{v.name}</h4>
                            <p className="text-xs text-slate-500 mt-0.5">{v.desc}</p>
                            <p className="text-xs font-semibold text-slate-400 mt-2 flex items-center gap-1">
                              <Users className="h-3 w-3" /> Up to {v.capacity}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 mb-3">Schedule</label>
                      <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200 flex gap-1 mb-4">
                        <button
                          onClick={() => setScheduleType("now")}
                          className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${scheduleType === "now" ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          Now
                        </button>
                        <button
                          onClick={() => setScheduleType("later")}
                          className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${scheduleType === "later" ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          Later
                        </button>
                      </div>

                      <AnimatePresence>
                        {scheduleType === "later" && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-3"
                          >
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none z-10" />
                              <Input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="pl-10 h-10 text-sm"
                                min={new Date().toISOString().split('T')[0]}
                              />
                            </div>
                            <div className="relative">
                              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none z-10" />
                              <Input
                                type="time"
                                value={time}
                                onChange={e => setTime(e.target.value)}
                                className="pl-10 h-10 text-sm"
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-800 mb-2">Driver Preference</label>
                      <select
                        value={driverPref}
                        onChange={e => setDriverPref(e.target.value)}
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                      >
                        <option value="">No Preference</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mt-auto">
                  <AnimatePresence>
                    {quote && selectedVehicle && (
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-primary/5 border border-primary/20 rounded-xl p-5 flex items-center justify-between shadow-sm">
                        <div>
                          <p className="text-xs font-bold text-primary/60 uppercase tracking-wider">Estimated Total</p>
                          <p className="text-3xl font-semibold text-primary">R {quote.amount.toFixed(2)}</p>
                        </div>
                        <Button onClick={handleRequestRide} disabled={isRequesting} className="h-12 px-8 text-base">
                          {isRequesting ? <Loader2 className="animate-spin h-5 w-5" /> : "Request Ride"}
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-12 flex flex-col items-center text-center">
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-6" />
                <h2 className="text-3xl font-semibold text-slate-900 mb-2">Confirmed!</h2>
                <p className="text-slate-500 mb-8">Your ride request has been sent successfully.</p>
                <Button onClick={() => window.location.href = '/'}>Return Home</Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <Footer />
    </main>
  );
};

export default Transport;
