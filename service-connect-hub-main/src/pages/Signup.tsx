import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Layout from "@/components/Layout";
import { toast } from "sonner";

const Signup = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"customer" | "provider">("customer");
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password, fullName, role);
      toast.success("Account created! You can now log in.");
      navigate("/login");
    } catch (err: any) {
      toast.error(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md shadow-elevated">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Create Account</CardTitle>
            <CardDescription>Join HumanDemand as a customer or service provider</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <Label>I want to</Label>
                <RadioGroup value={role} onValueChange={(v) => setRole(v as "customer" | "provider")} className="flex gap-4">
                  <div className="flex items-center gap-2 rounded-lg border px-4 py-3 flex-1 cursor-pointer hover:border-primary transition-colors">
                    <RadioGroupItem value="customer" id="customer" />
                    <Label htmlFor="customer" className="cursor-pointer font-medium">Hire Services</Label>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border px-4 py-3 flex-1 cursor-pointer hover:border-primary transition-colors">
                    <RadioGroupItem value="provider" id="provider" />
                    <Label htmlFor="provider" className="cursor-pointer font-medium">Provide Services</Label>
                  </div>
                </RadioGroup>
              </div>
              <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={loading}>
                {loading ? "Creating..." : "Create Account"}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary font-medium hover:underline">Sign In</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Signup;
