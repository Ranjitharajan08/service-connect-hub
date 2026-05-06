import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/Layout";
import { Check, X, Clock, CalendarDays } from "lucide-react";

type BookingRow = {
  id: string;
  service_type: string;
  date: string;
  time: string;
  address: string;
  notes: string | null;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  provider_name?: string;
};

const statusConfig = {
  pending: { label: "Pending", icon: Clock, className: "border-warning text-warning" },
  accepted: { label: "Accepted", icon: Check, className: "border-success text-success" },
  rejected: { label: "Rejected", icon: X, className: "border-destructive text-destructive" },
};

const CustomerDashboard = () => {
  const { user, role } = useAuth();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || role !== "customer") return;
    fetchBookings();
  }, [user, role]);

  const fetchBookings = async () => {
    const { data } = await supabase
      .from("bookings")
      .select("*, providers(*)")
      .eq("customer_id", user!.id)
      .order("created_at", { ascending: false });

    const bookingsData = (data as any[]) || [];
    
    // Fetch provider profile names
    const providerUserIds = [...new Set(bookingsData.map((b) => b.providers?.user_id).filter(Boolean))];
    let profilesMap: Record<string, string> = {};
    if (providerUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", providerUserIds);
      profiles?.forEach((p) => { profilesMap[p.user_id] = p.full_name; });
    }

    const mapped = bookingsData.map((b) => ({
      id: b.id,
      service_type: b.service_type,
      date: b.date,
      time: b.time,
      address: b.address,
      notes: b.notes,
      status: b.status,
      created_at: b.created_at,
      provider_name: b.providers ? (profilesMap[b.providers.user_id] || "Provider") : "Provider",
    }));
    setBookings(mapped);
    setLoading(false);
  };

  // Poll for updates every 5 seconds
  useEffect(() => {
    if (!user || role !== "customer") return;
    const interval = setInterval(fetchBookings, 5000);
    return () => clearInterval(interval);
  }, [user, role]);

  if (!user || role !== "customer") {
    return (
      <Layout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-muted-foreground">Access denied. Customer account required.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <h1 className="mb-2 text-3xl font-bold">My Bookings</h1>
        <p className="mb-8 text-muted-foreground">Track the status of your service bookings</p>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Card key={i} className="animate-pulse"><CardContent className="p-6"><div className="h-20 rounded bg-muted" /></CardContent></Card>
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <CalendarDays className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg text-muted-foreground">No bookings yet</p>
              <p className="text-sm text-muted-foreground">Browse services to make your first booking</p>
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
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">{b.service_type}</h3>
                          <Badge variant="outline" className={sc.className}>
                            <Icon className="mr-1 h-3 w-3" /> {sc.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">Provider: {b.provider_name}</p>
                        <p className="text-sm text-muted-foreground">{b.date} at {b.time}</p>
                        <p className="text-sm text-muted-foreground">{b.address}</p>
                        {b.status === "rejected" && (
                          <p className="text-sm text-destructive font-medium">Your request was rejected by the provider.</p>
                        )}
                      </div>
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

export default CustomerDashboard;
