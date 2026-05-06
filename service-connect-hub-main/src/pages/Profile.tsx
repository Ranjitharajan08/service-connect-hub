import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import { User, Mail, Shield } from "lucide-react";

const Profile = () => {
  const { user, role } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("user_id", user.id)
        .single();
      if (data) {
        setFullName(data.full_name);
        setEmail(data.email);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("user_id", user.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Profile updated!");
    }
    setSaving(false);
  };

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Please log in to view your profile.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto max-w-lg px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" /> My Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <div className="h-10 animate-pulse rounded bg-muted" />
                <div className="h-10 animate-pulse rounded bg-muted" />
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" /> Full Name
                  </Label>
                  <Input
                    id="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" /> Email
                  </Label>
                  <Input value={email} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Shield className="h-3.5 w-3.5" /> Role
                  </Label>
                  <div>
                    <Badge variant="secondary" className="capitalize">{role}</Badge>
                  </div>
                </div>
                <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Profile;
