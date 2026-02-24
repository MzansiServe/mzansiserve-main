import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, Check, UploadCloud, X, FileText, Image as ImageIcon, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import logo from "@/assets/logo.jpeg";

const Register = () => {
  const [form, setForm] = useState({
    name: "", surname: "", email: "", phone: "", password: "", confirmPassword: "",
    gender: "", nationality: "South Africa", id_number: "", role: "client",
    nokName: "", nokPhone: "", nokEmail: "",
    highestQualification: "", professionalBody: "", agent_id: ""
  });

  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    profile_photo: null,
    id_document: null,
    proof_of_residence: null,
    drivers_license: null,
    cv_resume: null,
    qualification_documents: null,
  });
  const [previews, setPreviews] = useState<{ [key: string]: string | null }>({});

  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (isSubmitted && paymentUrl) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            window.location.href = paymentUrl;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isSubmitted, paymentUrl]);

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const validateFile = (file: File) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/jpg',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (file.size > maxSize) return "File too large. Max 5MB allowed.";
    if (!allowedTypes.includes(file.type)) return "Unsupported file type.";
    return null;
  };

  const updateFile = (field: string, file: File | null) => {
    if (file) {
      const error = validateFile(file);
      if (error) {
        toast({ title: "Upload Error", description: error, variant: "destructive" });
        return;
      }

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setPreviews(prev => ({ ...prev, [field]: url }));
      } else {
        setPreviews(prev => ({ ...prev, [field]: null }));
      }
    } else {
      // Cleanup previous preview if any
      if (previews[field]) URL.revokeObjectURL(previews[field]!);
      setPreviews(prev => ({ ...prev, [field]: null }));
    }
    setFiles((f) => ({ ...f, [field]: file }));
  };

  useEffect(() => {
    return () => {
      // Cleanup URLs on unmount
      Object.values(previews).forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [previews]);

  const passwordStrength = (() => {
    const p = form.password;
    if (!p) return { score: 0, label: "" };
    let score = 0;
    if (p.length >= 6) score++;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    const labels = ["", "Weak", "Fair", "Good", "Strong", "Excellent"];
    const colors = ["", "bg-destructive", "bg-sa-gold", "bg-sa-gold", "bg-primary", "bg-primary"];
    return { score, label: labels[score], color: colors[score] };
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Basic Validation
    if (!form.name.trim() || !form.surname.trim()) { setError("Name and surname are required"); return; }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError("Valid email required"); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (form.password !== form.confirmPassword) { setError("Passwords do not match"); return; }

    const phoneRegex = /^[\d\s+]+$/;
    if (!form.phone.trim()) { setError("Phone number is required"); return; }
    if (!phoneRegex.test(form.phone)) { setError("Phone number must contain only numbers, spaces, or +"); return; }

    if (!form.id_number.trim()) { setError("ID/Passport number is required"); return; }

    if (!form.nokName.trim()) { setError("Next of Kin full name is required"); return; }
    if (!form.nokPhone.trim() && !form.nokEmail.trim()) { setError("Next of Kin contact number or email is required"); return; }
    if (form.nokPhone.trim() && !phoneRegex.test(form.nokPhone)) { setError("Next of Kin phone must contain only numbers, spaces, or +"); return; }

    if (!agreed) { setError("You must agree to the Terms of Service"); return; }

    // File Validation
    if (!files.profile_photo) { setError("Profile photo is required"); return; }
    if (!files.id_document) { setError("ID document is required"); return; }

    // Role specific dependencies
    if (form.role === 'driver' && (!files.proof_of_residence || !files.drivers_license)) {
      setError("Driver requires Proof of Residence and Driver's License"); return;
    }
    if ((form.role === 'professional' || form.role === 'service-provider') && !files.proof_of_residence) {
      setError("Professionals and Service Providers require Proof of Residence"); return;
    }
    if (form.role === 'professional' && (!form.highestQualification || !files.cv_resume || !files.qualification_documents)) {
      setError("Professionals require Highest Qualification, CV, and Qualification Documents"); return;
    }

    setLoading(true);
    try {
      const formData = new FormData();

      const registration_data = {
        email: form.email,
        password: form.password,
        password_confirm: form.confirmPassword,
        role: form.role,
        full_name: form.name,
        surname: form.surname,
        phone: form.phone,
        gender: form.gender,
        nationality: form.nationality,
        id_number: form.id_number,
        next_of_kin: {
          full_name: form.nokName,
          contact_number: form.nokPhone,
          contact_email: form.nokEmail
        },
        highest_qualification: form.highestQualification,
        professional_body: form.professionalBody,
        agent_id: form.agent_id
      };

      formData.append('registration_data', JSON.stringify(registration_data));

      if (files.profile_photo) formData.append('profile_photo', files.profile_photo);
      if (files.id_document) formData.append('id_document', files.id_document);
      if (files.proof_of_residence) formData.append('proof_of_residence', files.proof_of_residence);
      if (files.drivers_license) formData.append('drivers_license', files.drivers_license);
      if (files.cv_resume) formData.append('cv_resume', files.cv_resume);
      if (files.qualification_documents) formData.append('qualification_documents', files.qualification_documents);

      const result = await register(formData) as { success: boolean; error?: string; redirect_url?: string };

      if (result.success) {
        toast({ title: "Account Created!", description: "Please proceed to finalize your registration." });
        if (result.redirect_url) {
          setPaymentUrl(result.redirect_url);
        }
        setIsSubmitted(true);
      } else {
        setError(result.error || "Registration failed");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const FileUploadArea = ({ label, field, accept, required = false }: { label: string, field: string, accept: string, required?: boolean }) => {
    const file = files[field];
    const preview = previews[field];
    const isImage = file?.type.startsWith('image/');

    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center justify-between">
          <span>{label} {required && <span className="text-destructive">*</span>}</span>
          {file && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); updateFile(field, null); }}
              className="text-xs text-destructive hover:underline flex items-center gap-1"
            >
              <X size={12} /> Remove
            </button>
          )}
        </Label>

        <div className="relative">
          {!file ? (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl bg-card hover:bg-muted/50 transition-colors cursor-pointer group">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <div className="p-3 bg-primary/10 rounded-full text-primary mb-3 group-hover:scale-110 transition-transform">
                  <UploadCloud size={24} />
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG or PDF (MAX. 5MB)</p>
              </div>
              <input
                type="file"
                accept={accept}
                className="hidden"
                onChange={e => updateFile(field, e.target.files?.[0] || null)}
              />
            </label>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative overflow-hidden rounded-xl border border-border bg-card p-4 flex items-center gap-4"
            >
              {isImage && preview ? (
                <div className="h-20 w-20 rounded-lg overflow-hidden border border-border bg-muted shrink-0">
                  <img src={preview} alt="Preview" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="h-20 w-20 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <FileText size={32} />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                <div className="mt-2 flex items-center gap-1 text-xs text-green-500 font-medium">
                  <Check size={14} /> Ready to upload
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    );
  };

  if (isSubmitted) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="w-full max-w-lg text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-3xl border border-border bg-card/50 backdrop-blur-xl p-10 sm:p-14 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-sa-gold" />

              <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary animate-bounce-subtle shadow-[0_0_40px_rgba(94,53,177,0.2)]">
                <Check className="h-12 w-12" />
              </div>

              <h1 className="mb-3 text-4xl font-extrabold tracking-tight">
                {paymentUrl ? "Account Ready!" : "Registration Successful!"}
              </h1>

              <div className="mb-8 space-y-4 px-2">
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {paymentUrl
                    ? "Your MzansiServe account has been created successfully. Your details are securely saved in our system."
                    : "Congratulations! Your account has been created successfully. Our team will review your documents shortly."}
                </p>

                {paymentUrl && (
                  <div className="rounded-2xl bg-muted/50 p-6 border border-border/50">
                    <p className="font-semibold text-foreground mb-2 leading-none">Final Step: Activation Payment</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Redirecting to secure Yoco payment gateway in <span className="text-primary font-bold text-base">{countdown}s</span>...
                    </p>
                    <div className="mt-4 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: "100%" }}
                        animate={{ width: "0%" }}
                        transition={{ duration: 5, ease: "linear" }}
                        className="h-full bg-primary"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4 pt-4">
                {paymentUrl ? (
                  <Button asChild className="h-14 w-full bg-gradient-purple text-lg font-bold text-white shadow-glow-purple hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 border-none outline-none ring-0">
                    <a href={paymentUrl}>
                      Proceed to Payment Now <ArrowRight className="ml-2 h-5 w-5" />
                    </a>
                  </Button>
                ) : (
                  <Button asChild className="h-14 w-full bg-gradient-purple text-lg font-bold text-white shadow-glow-purple">
                    <Link to="/login">Login to Your Account</Link>
                  </Button>
                )}

                <Button asChild variant="ghost" className="w-full h-12">
                  <Link to="/">Back to Homepage</Link>
                </Button>
              </div>

              <p className="mt-8 text-xs text-muted-foreground italic">
                Your registration data is safely stored. If you encounter any issues during payment, your account can be resumed by logging in.
              </p>
            </motion.div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <div className="flex min-h-screen items-center justify-center px-6 pt-32 pb-20">
        <div className="w-full max-w-[800px]">
          <div className="rounded-[32px] border border-slate-200 bg-white p-10 sm:p-16 shadow-2xl transition-all duration-500">
            <div className="mb-12 text-center">
              <h1 className="text-4xl font-bold text-[#222222] tracking-tighter">Create your account</h1>
              <p className="mt-3 text-lg text-[#717171] font-medium">Join the MzansiServe community today</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-12">
              <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Register as</Label>
                  <select id="role" value={form.role} onChange={e => update('role', e.target.value)}
                    className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-[#222222] focus:border-black transition-all outline-none">
                    <option value="client">Client</option>
                    <option value="driver">Driver</option>
                    <option value="professional">Professional</option>
                    <option value="service-provider">Service Provider</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input id="email" type="email" placeholder="you@example.co.za" value={form.email} onChange={(e) => update("email", e.target.value)} className="pl-11 h-12 rounded-xl border-slate-200 bg-white font-bold text-[#222222] focus-visible:ring-0 focus-visible:border-black transition-all" autoComplete="email" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder="Min 8 characters" value={form.password} onChange={(e) => update("password", e.target.value)} className="pl-11 pr-12 h-12 rounded-xl border-slate-200 bg-white font-bold text-[#222222] focus-visible:ring-0 focus-visible:border-black transition-all" autoComplete="new-password" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#222222]">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input id="confirm-password" type="password" placeholder="Re-enter password" value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} className="pl-11 h-12 rounded-xl border-slate-200 bg-white font-bold text-[#222222] focus-visible:ring-0 focus-visible:border-black transition-all" autoComplete="new-password" />
                  </div>
                </div>
              </div>

              <div className="pt-10 border-t border-slate-100">
                <h3 className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-8">Personal Information</h3>
                <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">First Name</Label>
                    <Input id="name" placeholder="Thabo" value={form.name} onChange={(e) => update("name", e.target.value)} className="h-12 rounded-xl border-slate-200 font-bold text-[#222222]" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="surname" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Surname</Label>
                    <Input id="surname" placeholder="Mokoena" value={form.surname} onChange={(e) => update("surname", e.target.value)} className="h-12 rounded-xl border-slate-200 font-bold text-[#222222]" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Phone</Label>
                    <Input id="phone" type="tel" placeholder="081 000 1111" value={form.phone} onChange={(e) => update("phone", e.target.value)} className="h-12 rounded-xl border-slate-200 font-bold text-[#222222]" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Gender</Label>
                    <select id="gender" value={form.gender} onChange={e => update('gender', e.target.value)}
                      className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-[#222222] focus:border-black transition-all outline-none">
                      <option value="">Select...</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nationality" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Nationality</Label>
                    <select id="nationality" value={form.nationality} onChange={e => update('nationality', e.target.value)}
                      className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-[#222222] focus:border-black transition-all outline-none">
                      <option value="South Africa">South Africa</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="id_number" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">{form.nationality === "South Africa" ? "ID Number" : "Passport Number"}</Label>
                    <Input id="id_number" placeholder="Enter ID/Passport" value={form.id_number} onChange={(e) => update("id_number", e.target.value)} className="h-12 rounded-xl border-slate-200 font-bold text-[#222222]" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="agent_id" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                      Agent / Affiliate Code
                    </Label>
                    <Input id="agent_id" placeholder="e.g. AGT001" value={form.agent_id} onChange={(e) => update("agent_id", e.target.value)} className="h-12 rounded-xl border-slate-200 font-mono uppercase font-bold tracking-widest text-primary" />
                  </div>
                </div>
              </div>

              <div className="pt-10 border-t border-slate-100">
                <h3 className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-8">Next of Kin</h3>
                <div className="grid gap-x-8 gap-y-10 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="nokName" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</Label>
                    <Input id="nokName" value={form.nokName} onChange={(e) => update("nokName", e.target.value)} className="h-12 rounded-xl border-slate-200 font-bold text-[#222222]" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nokPhone" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Phone</Label>
                    <Input id="nokPhone" type="tel" value={form.nokPhone} onChange={(e) => update("nokPhone", e.target.value)} className="h-12 rounded-xl border-slate-200 font-bold text-[#222222]" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nokEmail" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email</Label>
                    <Input id="nokEmail" type="email" value={form.nokEmail} onChange={(e) => update("nokEmail", e.target.value)} className="h-12 rounded-xl border-slate-200 font-bold text-[#222222]" />
                  </div>
                </div>
              </div>

              {form.role === 'professional' && (
                <div className="pt-10 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-500">
                  <h3 className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-8">Professional Information</h3>
                  <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="hq" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Highest Qualification</Label>
                      <Input id="hq" value={form.highestQualification} onChange={(e) => update("highestQualification", e.target.value)} className="h-12 rounded-xl border-slate-200 font-bold text-[#222222]" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pb" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Professional Body</Label>
                      <Input id="pb" value={form.professionalBody} onChange={(e) => update("professionalBody", e.target.value)} className="h-12 rounded-xl border-slate-200 font-bold text-[#222222]" />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-10 border-t border-slate-100">
                <h3 className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-10 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  Verification Documents
                </h3>
                <div className="grid gap-x-10 gap-y-12 sm:grid-cols-2">
                  <FileUploadArea
                    label="Profile Photo"
                    field="profile_photo"
                    accept="image/*"
                    required
                  />
                  <FileUploadArea
                    label="ID Document / Passport"
                    field="id_document"
                    accept=".pdf,.jpg,.jpeg,.png"
                    required
                  />

                  {(form.role === 'driver' || form.role === 'professional' || form.role === 'service-provider') && (
                    <FileUploadArea
                      label="Proof of Residence"
                      field="proof_of_residence"
                      accept=".pdf,.jpg,.jpeg,.png"
                      required
                    />
                  )}

                  {form.role === 'driver' && (
                    <FileUploadArea
                      label="Driver's License"
                      field="drivers_license"
                      accept=".pdf,.jpg,.jpeg,.png"
                      required
                    />
                  )}

                  {form.role === 'professional' && (
                    <>
                      <FileUploadArea
                        label="CV / Resume"
                        field="cv_resume"
                        accept=".pdf,.doc,.docx"
                        required
                      />
                      <FileUploadArea
                        label="Qualification Documents"
                        field="qualification_documents"
                        accept=".pdf,.jpg,.jpeg,.png"
                        required
                      />
                    </>
                  )}
                </div>
              </div>

              <div className="pt-12 border-t border-slate-100">
                <div className="flex items-start gap-3 pt-1">
                  <Checkbox id="terms" checked={agreed} onCheckedChange={(c) => setAgreed(c === true)} className="mt-1 border-slate-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                  <Label htmlFor="terms" className="text-sm font-medium text-[#717171] leading-relaxed">
                    I agree to the <a href="#" className="text-[#222222] font-bold underline underline-offset-4 hover:text-primary transition-colors">Terms of Service</a> and <a href="#" className="text-[#222222] font-bold underline underline-offset-4 hover:text-primary transition-colors">Privacy Policy</a>
                  </Label>
                </div>

                {error && <p className="mt-8 rounded-2xl bg-rose-50 border border-rose-100 p-5 text-sm font-bold text-rose-600 animate-in fade-in slide-in-from-top-1">{error}</p>}

                <Button type="submit" className="mt-8 w-full h-16 rounded-2xl bg-primary text-lg font-bold text-white shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all" disabled={loading}>
                  {loading ? "Processing..." : "Pay & Create Account"}
                  {!loading && <ArrowRight className="ml-2 h-5 w-5" />}
                </Button>
              </div>
            </form>

            <p className="mt-12 text-center text-base font-medium text-[#717171]">
              Already have an account?{" "}
              <Link to="/login" className="font-bold text-[#222222] hover:underline underline-offset-4">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Register;
