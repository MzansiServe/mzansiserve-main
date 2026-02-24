import { useState } from "react";
import {
    Plus,
    Trash2,
    Save,
    Info,
    Car,
    Hash,
    Calendar,
    Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Vehicle {
    car_make: string;
    car_model: string;
    car_year: number;
    registration_number: string;
    car_type: 'standard' | 'premium' | 'suv';
}

interface VehicleManagementProps {
    initialVehicles: Vehicle[];
}

export const VehicleManagement = ({ initialVehicles }: VehicleManagementProps) => {
    const { toast } = useToast();
    const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles || []);
    const [saving, setSaving] = useState(false);

    const addVehicle = () => {
        setVehicles([...vehicles, { car_make: "", car_model: "", car_year: new Date().getFullYear(), registration_number: "", car_type: 'standard' }]);
    };

    const removeVehicle = (index: number) => {
        setVehicles(vehicles.filter((_, i) => i !== index));
    };

    const updateVehicle = (index: number, field: keyof Vehicle, value: any) => {
        const newVehicles = [...vehicles];
        newVehicles[index] = { ...newVehicles[index], [field]: value };
        setVehicles(newVehicles);
    };

    const handleSave = async () => {
        // Validation
        if (vehicles.some(v => !v.car_make.trim() || !v.car_model.trim() || !v.registration_number.trim())) {
            toast({ title: "Validation Error", description: "All vehicles must have a make, model, and registration number.", variant: "destructive" });
            return;
        }

        setSaving(true);
        try {
            const res = await apiFetch('/api/profile', {
                method: 'PATCH',
                body: JSON.stringify({
                    driver_services: vehicles
                })
            });

            if (res.success) {
                toast({
                    title: "Update Submitted",
                    description: "Your vehicle changes have been submitted for admin approval."
                });
            }
        } catch (err: any) {
            toast({ title: "Error", description: err.message || "Failed to submit changes", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 px-6 py-5 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[#e3f2fd] text-[#1e88e5]">
                        <Car className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-[#121926]">My Vehicles</h2>
                        <p className="text-xs text-[#697586] font-medium mt-0.5">Manage your registered vehicles and ride types.</p>
                    </div>
                </div>
                <Button
                    onClick={addVehicle}
                    variant="outline"
                    size="sm"
                    className="rounded-xl font-bold gap-2"
                >
                    <Plus className="h-4 w-4" /> Add Vehicle
                </Button>
            </div>

            <div className="p-6 space-y-6">
                {vehicles.length > 0 ? (
                    <div className="space-y-4">
                        {vehicles.map((vehicle, index) => (
                            <div key={index} className="p-5 border border-gray-100 rounded-xl bg-slate-50/30 hover:border-blue-100 transition-colors">
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#697586]">Make & Model</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={vehicle.car_make}
                                                onChange={(e) => updateVehicle(index, 'car_make', e.target.value)}
                                                placeholder="Make (e.g., Toyota)"
                                                className="w-1/2 bg-white border border-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                            />
                                            <input
                                                type="text"
                                                value={vehicle.car_model}
                                                onChange={(e) => updateVehicle(index, 'car_model', e.target.value)}
                                                placeholder="Model (e.g., Corolla)"
                                                className="w-1/2 bg-white border border-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#697586]">Year & Registration</label>
                                        <div className="flex gap-2">
                                            <div className="relative w-1/3">
                                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#697586]" />
                                                <input
                                                    type="number"
                                                    value={vehicle.car_year}
                                                    onChange={(e) => updateVehicle(index, 'car_year', parseInt(e.target.value))}
                                                    className="w-full bg-white border border-gray-100 rounded-lg pl-8 pr-2 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                                />
                                            </div>
                                            <div className="relative w-2/3">
                                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#697586]" />
                                                <input
                                                    type="text"
                                                    value={vehicle.registration_number}
                                                    onChange={(e) => updateVehicle(index, 'registration_number', e.target.value)}
                                                    placeholder="Plate #"
                                                    className="w-full bg-white border border-gray-100 rounded-lg pl-8 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-[#697586]">Ride Category</label>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeVehicle(index)}
                                                className="h-6 w-6 text-[#697586] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                        <select
                                            value={vehicle.car_type}
                                            onChange={(e) => updateVehicle(index, 'car_type', e.target.value)}
                                            className="w-full bg-white border border-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="standard">Standard Ride</option>
                                            <option value="premium">Premium Ride</option>
                                            <option value="suv">SUV / Large</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-12 text-center">
                        <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Car className="h-8 w-8 text-slate-300" />
                        </div>
                        <h3 className="text-base font-bold text-[#121926]">No vehicles registered</h3>
                        <p className="text-sm text-[#697586] mt-1 italic">Click "Add Vehicle" to register your first car.</p>
                    </div>
                )}

                <div className="mt-8 p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex gap-3">
                    <Settings className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-800 leading-relaxed">
                        <strong>Category Note:</strong> Standard rides are for everyday transport. Premium rides require luxury sedans. SUV category is for vehicles seating 6 or more passengers.
                    </p>
                </div>
            </div>

            <div className="p-6 bg-slate-50/50 border-t border-gray-100 flex justify-end">
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-[#1e88e5] hover:bg-[#1565c0] rounded-xl px-10 font-bold shadow-lg shadow-blue-100 gap-2"
                >
                    {saving ? "Processing..." : "Submit for Approval"}
                    {!saving && <Save className="h-4 w-4" />}
                </Button>
            </div>
        </div>
    );
};
