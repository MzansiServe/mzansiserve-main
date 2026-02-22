import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, Check, UploadCloud } from "lucide-react";
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
    highestQualification: "", professionalBody: ""
  });

  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    profile_photo: null,
    id_document: null,
    proof_of_residence: null,
    drivers_license: null,
    cv_resume: null,
    qualification_documents: null,
  });

  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));
  const updateFile = (field: string, file: File | null) => setFiles((f) => ({ ...f, [field]: file }));

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
    if (!form.email.trim() || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(form.email)) { setError("Valid email required"); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (form.password !== form.confirmPassword) { setError("Passwords do not match"); return; }
    if (!agreed) { setError("You must agree to the Terms of Service"); return; }
    if (!form.id_number.trim()) { setError("ID/Passport number is required"); return; }

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
        professional_body: form.professionalBody
      };

      formData.append('registration_data', JSON.stringify(registration_data));

      if (files.profile_photo) formData.append('profile_photo', files.profile_photo);
      if (files.id_document) formData.append('id_document', files.id_document);
      if (files.proof_of_residence) formData.append('proof_of_residence', files.proof_of_residence);
      if (files.drivers_license) formData.append('drivers_license', files.drivers_license);
      if (files.cv_resume) formData.append('cv_resume', files.cv_resume);
      if (files.qualification_documents) formData.append('qualification_documents', files.qualification_documents);

      const result = await register(formData);

      if (result.success) {
        toast({ title: "Account created!", description: "Welcome to MzansiServe." });
        navigate("/");
      } else {
        setError(result.error || "Registration failed");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="flex min-h-screen items-center justify-center px-4 pt-24 pb-12">
        <div className="w-full max-w-2xl">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-lg">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-auto items-center justify-center overflow-hidden rounded-xl">
                <img src={logo} alt="MzansiServe" className="h-full w-auto object-contain" />
              </div>
              <h1 className="text-2xl font-bold">Create Your Account</h1>
              <p className="mt-1 text-sm text-muted-foreground">Join thousands of South Africans on MzansiServe</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="role">Register as <span className="text-destructive">*</span></Label>
                  <select id="role" value={form.role} onChange={e => update('role', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <option value="client">Client</option>
                    <option value="driver">Driver</option>
                    <option value="professional">Professional</option>
                    <option value="service-provider">Service Provider</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="you@example.co.za" value={form.email} onChange={(e) => update("email", e.target.value)} className="pl-10" autoComplete="email" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder="Min 8 characters" value={form.password} onChange={(e) => update("password", e.target.value)} className="pl-10 pr-10" autoComplete="new-password" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="confirm-password" type="password" placeholder="Re-enter password" value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} className="pl-10" autoComplete="new-password" />
                  </div>
                </div>

              </div>

              <div className="pt-4 border-t border-border">
                <h3 className="font-semibold mb-4 text-foreground">Personal Information</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">First Name <span className="text-destructive">*</span></Label>
                    <Input id="name" placeholder="Thabo" value={form.name} onChange={(e) => update("name", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="surname">Surname <span className="text-destructive">*</span></Label>
                    <Input id="surname" placeholder="Mokoena" value={form.surname} onChange={(e) => update("surname", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone <span className="text-destructive">*</span></Label>
                    <Input id="phone" type="tel" placeholder="081 000 1111" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <select id="gender" value={form.gender} onChange={e => update('gender', e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <option value="">Select...</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nationality">Nationality <span className="text-destructive">*</span></Label>
                    <select id="nationality" value={form.nationality} onChange={e => update('nationality', e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <option value="South Africa">South Africa</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="id_number">{form.nationality === "South Africa" ? "ID Number" : "Passport Number"} <span className="text-destructive">*</span></Label>
                    <Input id="id_number" placeholder="Enter ID/Passport" value={form.id_number} onChange={(e) => update("id_number", e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <h3 className="font-semibold mb-4 text-foreground">Next of Kin</h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="nokName">Full Name <span className="text-destructive">*</span></Label>
                    <Input id="nokName" value={form.nokName} onChange={(e) => update("nokName", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nokPhone">Phone <span className="text-destructive">*</span></Label>
                    <Input id="nokPhone" type="tel" value={form.nokPhone} onChange={(e) => update("nokPhone", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nokEmail">Email</Label>
                    <Input id="nokEmail" type="email" value={form.nokEmail} onChange={(e) => update("nokEmail", e.target.value)} />
                  </div>
                </div>
              </div>

              {form.role === 'professional' && (
                <div className="pt-4 border-t border-border animate-fade-in">
                  <h3 className="font-semibold mb-4 text-foreground">Professional Information</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="hq">Highest Qualification <span className="text-destructive">*</span></Label>
                      <Input id="hq" value={form.highestQualification} onChange={(e) => update("highestQualification", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pb">Professional Body</Label>
                      <Input id="pb" value={form.professionalBody} onChange={(e) => update("professionalBody", e.target.value)} />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-border">
                <h3 className="font-semibold mb-4 text-foreground">Verification Documents</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label>Profile Photo <span className="text-destructive">*</span></Label>
                    <Input type="file" accept="image/*" onChange={e => updateFile('profile_photo', e.target.files?.[0] || null)} />
                  </div>
                  <div className="space-y-1">
                    <Label>ID Document / Passport <span className="text-destructive">*</span></Label>
                    <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => updateFile('id_document', e.target.files?.[0] || null)} />
                  </div>

                  {(form.role === 'driver' || form.role === 'professional' || form.role === 'service-provider') && (
                    <div className="space-y-1 animate-fade-in">
                      <Label>Proof of Residence <span className="text-destructive">*</span></Label>
                      <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => updateFile('proof_of_residence', e.target.files?.[0] || null)} />
                    </div>
                  )}

                  {form.role === 'driver' && (
                    <div className="space-y-1 animate-fade-in">
                      <Label>Driver's License <span className="text-destructive">*</span></Label>
                      <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => updateFile('drivers_license', e.target.files?.[0] || null)} />
                    </div>
                  )}

                  {form.role === 'professional' && (
                    <>
                      <div className="space-y-1 animate-fade-in">
                        <Label>CV / Resume <span className="text-destructive">*</span></Label>
                        <Input type="file" accept=".pdf,.doc,.docx" onChange={e => updateFile('cv_resume', e.target.files?.[0] || null)} />
                      </div>
                      <div className="space-y-1 animate-fade-in">
                        <Label>Qualification Documents <span className="text-destructive">*</span></Label>
                        <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => updateFile('qualification_documents', e.target.files?.[0] || null)} />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex items-start gap-2 pt-1">
                  <Checkbox id="terms" checked={agreed} onCheckedChange={(c) => setAgreed(c === true)} className="mt-0.5" />
                  <Label htmlFor="terms" className="text-sm font-normal text-muted-foreground leading-snug">
                    I agree to the <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                  </Label>
                </div>

                {error && <p className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

                <Button type="submit" className="mt-4 w-full bg-gradient-purple py-6 text-base font-semibold text-primary-foreground shadow-glow-purple hover:opacity-90" disabled={loading}>
                  {loading ? "Registering..." : "Pay and Signup"}
                  {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </div>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Register;
