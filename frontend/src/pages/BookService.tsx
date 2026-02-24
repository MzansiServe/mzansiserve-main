import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Star, MapPin, BadgeCheck, Calendar, Clock,
  CreditCard, Check, Loader2, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useJsApiLoader, Autocomplete } from "@react-google-maps/api";
import BookingStepWizard from "@/components/BookingStepWizard";

const LIBRARIES: ("places")[] = ["places"];
const GOOGLE_MAPS_API_KEY = "AIzaSyBtXh26PcILBqis4Ad66wPetvU_wUKMNRs";

const timeSlots = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

const BookService = () => {
  const { id, category } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState("");
  const [coords, setCoords] = useState<{ lat: number, lng: number } | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [calloutFee, setCalloutFee] = useState<number>(150);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<"form" | "confirm" | "done">("form");

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  // Fetch provider data
  const { data: providerData, isLoading, error } = useQuery({
    queryKey: ['provider', category, id],
    queryFn: async () => {
      const endpoint = category === 'professionals'
        ? `/api/profile/professional/${id}`
        : `/api/profile/service-provider/${id}`;
      const res = await apiFetch(endpoint);
      return res.data;
    },
    enabled: !!id && !!category
  });

  const provider = category === 'professionals'
    ? providerData?.professional
    : providerData?.provider;
  const services = providerData?.services || [];

  // Fetch callout fee setting
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await apiFetch('/api/admin/settings');
        if (res.success) {
          const settingKey = category === 'professionals'
            ? 'professional_callout_fee_amount'
            : 'provider_callout_fee_amount';
          const setting = res.data.find((s: any) => s.id === settingKey) || res.data.find((s: any) => s.id === 'callout_fee_amount');
          if (setting) setCalloutFee(parseFloat(setting.value));
        }
      } catch (err) {
        console.error("Failed to fetch settings", err);
      }
    };
    fetchSettings();
  }, [category]);

  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry && place.geometry.location) {
        setLocation(place.formatted_address || place.name || "");
        setCoords({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        });
      }
    }
  };

  const handleSubmit = () => {
    if (!isAuthenticated) { navigate("/login"); return; }
    if (!date || !time || !location || !selectedService) {
      toast({ title: "Please fill in all details", variant: "destructive" });
      return;
    }
    setStep("confirm");
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        date,
        time,
        notes,
        location: {
          address: location,
          lat: coords?.lat,
          lng: coords?.lng
        },
        preferences: {
          [category === 'professionals' ? 'professional_id' : 'provider_id']: id,
          service_name: selectedService
        },
        payment_amount: calloutFee
      };

      if (category === 'professionals') {
        // Professional flow uses a specific checkout endpoint for Yoco
        const res = await apiFetch('/api/requests/professional-checkout', {
          method: 'POST',
          data: payload
        });
        if (res.success && res.data?.redirect_url) {
          window.location.href = res.data.redirect_url;
        } else {
          toast({ title: "Checkout failed", description: res.message || "Failed to initiate payment", variant: "destructive" });
        }
      } else {
        // General service provider flow uses the standard requests endpoint
        const res = await apiFetch('/api/requests', {
          method: 'POST',
          data: { ...payload, type: 'provider' }
        });
        if (res.success) {
          setStep("done");
          toast({ title: "Booking confirmed!", description: `Your request with ${provider?.data?.full_name || 'the provider'} has been submitted.` });
        } else {
          toast({ title: "Booking failed", description: res.message || "An error occurred", variant: "destructive" });
        }
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to process booking", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Navbar />
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p>Loading provider details...</p>
      </main>
    );
  }

  if (error || !provider) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center pt-20">
          <div className="text-center p-8 border border-dashed rounded-2xl max-w-md">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Provider not found</h2>
            <p className="text-muted-foreground mb-6">We couldn't find the provider you're looking for. They may have been removed or the link is invalid.</p>
            <Button variant="outline" onClick={() => navigate("/services")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Services
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const fullName = `${provider.data?.full_name || ''} ${provider.data?.surname || ''}`.trim() || provider.data?.business_name || "Provider";

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12 lg:px-8 max-w-5xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-semibold text-gray-900 sm:text-4xl">
            Request {category === 'professionals' ? 'a Professional' : 'a Service Provider'}
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            {category === 'professionals' ? 'Verified experts at your fingertips.' : 'Plumbers, electricians, and more at your fingertips.'}
          </p>
        </div>

        <BookingStepWizard currentStep={step === "form" ? 2 : (step === "confirm" ? 3 : 3)} />

        <div className="grid gap-8">
          {/* Step 2: Details */}
          {step === "form" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left: Form */}
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Request Details</h3>

                  {!isAuthenticated && (
                    <div className="mb-6 rounded-lg bg-blue-50 border border-blue-100 p-4 text-sm text-blue-700">
                      <strong>Note:</strong> You'll need to <button onClick={() => navigate("/login")} className="font-bold underline">log in</button> or <button onClick={() => navigate("/register")} className="font-bold underline">register</button> to complete your booking.
                    </div>
                  )}

                  <div className="space-y-6">
                    {/* Service Selection */}
                    <div className="space-y-2">
                      <Label className="block text-sm font-medium text-gray-700 mb-1">Choose Service</Label>
                      <Select value={selectedService || ""} onValueChange={setSelectedService}>
                        <SelectTrigger className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 h-12">
                          <SelectValue placeholder="Select a specific service" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl shadow-xl border-gray-100">
                          {services.map((svc: any) => (
                            <SelectItem key={svc.name} value={svc.name} className="py-3 focus:bg-purple-50 cursor-pointer">
                              <div className="flex flex-col">
                                <span className="font-bold text-gray-900">{svc.name}</span>
                                {svc.hourly_rate && <span className="text-xs text-gray-500">R{svc.hourly_rate} per hour</span>}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Location */}
                    <div className="space-y-2">
                      <Label className="block text-sm font-medium text-gray-700 mb-1">Location</Label>
                      {isLoaded ? (
                        <Autocomplete
                          onLoad={ref => autocompleteRef.current = ref}
                          onPlaceChanged={onPlaceChanged}
                        >
                          <Input
                            value={location}
                            onChange={e => setLocation(e.target.value)}
                            placeholder="Enter address"
                            className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 h-12"
                          />
                        </Autocomplete>
                      ) : (
                        <Input placeholder="Loading maps..." disabled className="h-12 bg-gray-50" />
                      )}
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="block text-sm font-medium text-gray-700 mb-1">Preferred Date</Label>
                        <Input
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          min={new Date().toISOString().split("T")[0]}
                          className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 h-10"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="block text-sm font-medium text-gray-700 mb-1">Preferred Time</Label>
                        <Select value={time} onValueChange={setTime}>
                          <SelectTrigger className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 h-10">
                            <SelectValue placeholder="Select a time slot" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl shadow-xl border-gray-100">
                            {timeSlots.map((t) => <SelectItem key={t} value={t} className="focus:bg-purple-50 cursor-pointer">{t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                      <Label className="block text-sm font-medium text-gray-700 mb-1">Job Description / Notes</Label>
                      <textarea
                        id="requestNotes"
                        rows={3}
                        placeholder="Describe the job in detail..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 py-2 px-3 text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between mt-8">
                  <Button
                    variant="outline"
                    className="px-6 py-6 border border-gray-300 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                    onClick={() => navigate(-1)}
                  >
                    Back
                  </Button>
                  <Button
                    variant="default"
                    className="px-8 py-6 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 shadow-md transition-all transform hover:-translate-y-0.5"
                    onClick={handleSubmit}
                  >
                    Continue
                  </Button>
                </div>
              </motion.div>

              {/* Right: Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
                  <h4 className="text-lg font-bold text-gray-900 mb-4">Selected Provider</h4>
                  <div className="flex items-center mb-4">
                    <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold mr-3 shadow-inner">
                      {fullName.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{fullName}</p>
                      <p className="text-sm text-gray-500">{category === 'professionals' ? 'Accredited Professional' : 'Service Provider'}</p>
                    </div>
                  </div>
                  {selectedService && (
                    <div className="border-t border-gray-100 pt-3">
                      <p className="text-sm text-gray-500">Service Category</p>
                      <p className="font-medium text-purple-700">{selectedService}</p>
                    </div>
                  )}
                  <button onClick={() => navigate(-1)} className="w-full mt-4 text-center text-sm text-gray-500 hover:text-purple-600 transition-colors">Change Provider</button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === "confirm" && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto w-full">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-purple-600 px-6 py-4">
                  <h3 className="text-lg font-bold text-white flex items-center">
                    <Check className="w-6 h-6 mr-2" /> Confirm Request
                  </h3>
                </div>
                <div className="p-6 sm:p-8 space-y-6">
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start">
                    <AlertCircle className="h-6 w-6 text-blue-400 mt-0.5" />
                    <div className="ml-3">
                      <h3 className="text-sm font-bold text-blue-800">Standard Call-out Fee</h3>
                      <div className="mt-1 text-sm text-blue-700">
                        <p>A fee of <strong>R{calloutFee.toFixed(2)}</strong> is charged to confirm the request and cover travel. Additional labor/parts are billed separately.</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-4 border-b border-gray-100">
                    <span className="text-gray-600 font-medium text-lg">Call-out Fee</span>
                    <span className="text-3xl font-black text-gray-900">R{calloutFee.toFixed(2)}</span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Service:</span>
                      <span className="font-bold text-gray-900">{selectedService}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Date & Time:</span>
                      <span className="font-bold text-gray-900">{date} at {time}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Location:</span>
                      <span className="font-bold text-gray-900 text-right max-w-[250px] truncate">{location}</span>
                    </div>
                  </div>

                  <div className="pt-4 space-y-3">
                    <Button
                      className="w-full bg-green-600 text-white py-8 rounded-xl font-bold hover:bg-green-700 shadow-lg text-xl transition-all transform hover:-translate-y-1 flex items-center justify-center disabled:opacity-70 disabled:transform-none"
                      onClick={handleConfirm}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                      ) : (
                        <CreditCard className="mr-2 h-6 w-6" />
                      )}
                      {category === 'professionals' ? 'Pay & Secure Request' : 'Confirm & Submit'}
                    </Button>

                    <Button
                      variant="ghost"
                      className="w-full text-center text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg py-2"
                      onClick={() => setStep("form")}
                    >
                      Back to Details
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Success State */}
          {step === "done" && (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="py-20 text-center bg-white rounded-2xl shadow-lg border border-gray-100 max-w-2xl mx-auto w-full">
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 shadow-inner">
                <Check className="h-12 w-12 text-emerald-600" />
              </div>
              <h2 className="mb-3 text-3xl font-bold text-gray-900">Request Submitted!</h2>
              <p className="mb-10 text-gray-500 text-lg max-w-sm mx-auto">
                Your request with {fullName} has been successfully sent. Track your status in your dashboard.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 px-8">
                <Button
                  variant="outline"
                  className="py-6 px-10 rounded-xl border-gray-200 font-bold hover:bg-gray-50 transition-all flex-1"
                  onClick={() => navigate("/services")}
                >
                  Browse More
                </Button>
                <Button
                  className="bg-purple-600 hover:bg-purple-700 py-6 px-10 rounded-xl font-bold text-white shadow-lg transition-all transform hover:-translate-y-0.5 flex-1"
                  onClick={() => navigate("/")}
                >
                  Return Home
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
};

export default BookService;
