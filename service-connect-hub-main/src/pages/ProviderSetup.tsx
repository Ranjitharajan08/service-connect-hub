import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Layout from "@/components/Layout";
import { SERVICE_TYPES } from "@/lib/services";
import { toast } from "sonner";

const ProviderSetup = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [serviceType, setServiceType] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [experience, setExperience] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasProvider, setHasProvider] = useState(false);

  useEffect(() => {
    if (!user || role !== "provider") return;
    supabase.from("providers").select("id").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setHasProvider(true);
        navigate("/provider-dashboard");
      }
    });
  }, [user, role, navigate]);

  if (!user || role !== "provider") {
    return (
      <Layout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-muted-foreground">You must be logged in as a service provider.</p>
        </div>
      </Layout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Check if service type already taken
    const { data: existing } = await supabase.from("providers").select("id").eq("service_type", serviceType).maybeSingle();
    if (existing) {
      toast.error("A provider already exists for this service");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("providers").insert({
      user_id: user.id,
      service_type: serviceType,
      price: parseFloat(price),
      description,
      experience: experience || null,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Provider profile created!");
      navigate("/provider-dashboard");
    }
    setLoading(false);
  };

  if (hasProvider) return null;

  return (
    <Layout>
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-lg shadow-elevated">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Set Up Your Provider Profile</CardTitle>
            <CardDescription>Tell customers about your service</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Service Type</Label>
                <Select value={serviceType} onValueChange={setServiceType} required>
                  <SelectTrigger><SelectValue placeholder="Select a service" /></SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPES.map((s) => (
                      <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input id="price" type="number" min="1" step="0.01" required value={price} onChange={(e) => setPrice(e.target.value)} placeholder="50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description</Label>
                <Textarea id="desc" required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your service..." rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exp">Experience (optional)</Label>
                <Input id="exp" value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="e.g. 5 years" />
              </div>
              <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={loading || !serviceType}>
                {loading ? "Creating..." : "Create Provider Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ProviderSetup;
