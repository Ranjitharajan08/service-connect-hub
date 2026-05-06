import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import { Check, X, Clock } from "lucide-react";

type BookingRow = {
  id: string;
  customer_id: string;
  service_type: string;
  date: string;
  time: string;
  address: string;
  notes: string | null;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  customer_name?: string;
};

const statusConfig = {
  pending: { label: "Pending", variant: "outline" as const, icon: Clock, className: "border-warning text-warning" },
  accepted: { label: "Accepted", variant: "outline" as const, icon: Check, className: "border-success text-success" },
  rejected: { label: "Rejected", variant: "outline" as const, icon: X, className: "border-destructive text-destructive" },
};

const ProviderDashboard = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [providerExists, setProviderExists] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user || role !== "provider") return;
    checkProvider();
  }, [user, role]);

  const checkProvider = async () => {
    const { data: prov } = await supabase
      .from("providers")
      .select("id")
      .eq("user_id", user!.id)
      .maybeSingle();

    if (!prov) {
      setProviderExists(false);
      navigate("/provider-setup");
      return;
    }
    setProviderExists(true);
    fetchBookings();
  };

  const fetchBookings = async () => {
    // Get provider's id first
    const { data: prov } = await supabase
      .from("providers")
      .select("id")
      .eq("user_id", user!.id)
      .single();
    
    if (!prov) return;

    const { data } = await supabase
      .from("bookings")
      .select("*")
      .eq("provider_id", prov.id)
      .order("created_at", { ascending: false });

    // Fetch customer names
    const bookingsData = data || [];
    const customerIds = [...new Set(bookingsData.map((b) => b.customer_id))];
    
    let profilesMap: Record<string, string> = {};
    if (customerIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", customerIds);
      profiles?.forEach((p) => { profilesMap[p.user_id] = p.full_name; });
    }

    const mapped = bookingsData.map((b) => ({
      id: b.id,
      customer_id: b.customer_id,
      service_type: b.service_type,
      date: b.date,
      time: b.time,
      address: b.address,
      notes: b.notes,
      status: b.status,
      created_at: b.created_at,
      customer_name: profilesMap[b.customer_id] || "Customer",
    }));
    setBookings(mapped);
    setLoading(false);
  };

  const updateStatus = async (bookingId: string, status: "accepted" | "rejected") => {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", bookingId);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Booking ${status}!`);
      fetchBookings();
    }
  };

  if (!user || role !== "provider") {
    return (
      <Layout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-muted-foreground">Access denied. Provider account required.</p>
        </div>
      </Layout>
    );
  }

  if (providerExists === false) return null;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <h1 className="mb-2 text-3xl font-bold">Provider Dashboard</h1>
        <p className="mb-8 text-muted-foreground">Manage your booking requests</p>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Card key={i} className="animate-pulse"><CardContent className="p-6"><div className="h-20 rounded bg-muted" /></CardContent></Card>
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Clock className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg text-muted-foreground">No booking requests yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => {
              const sc = statusConfig[b.status];
              const Icon = sc.icon;
              return (
                <Card key={b.id} className="shadow-card">
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">{b.customer_name}</h3>
                          <Badge variant={sc.variant} className={sc.className}>
                            <Icon className="mr-1 h-3 w-3" /> {sc.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{b.service_type} • {b.date} at {b.time}</p>
                        <p className="text-sm text-muted-foreground">{b.address}</p>
                        {b.notes && <p className="text-sm text-muted-foreground italic">"{b.notes}"</p>}
                      </div>
                      {b.status === "pending" && (
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-success text-success-foreground hover:bg-success/90" onClick={() => updateStatus(b.id, "accepted")}>
                            <Check className="mr-1 h-4 w-4" /> Accept
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => updateStatus(b.id, "rejected")}>
                            <X className="mr-1 h-4 w-4" /> Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProviderDashboard;
