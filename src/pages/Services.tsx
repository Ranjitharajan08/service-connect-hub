import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/Layout";
import { getServiceImage } from "@/lib/services";
import { toast } from "sonner";
import BookingDialog from "@/components/BookingDialog";
import type { Tables } from "@/integrations/supabase/types";

type ProviderWithName = Tables<"providers"> & { provider_name: string };

const Services = () => {
  const [providers, setProviders] = useState<ProviderWithName[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [bookingProvider, setBookingProvider] = useState<Tables<"providers"> | null>(null);

  useEffect(() => {
    const fetchProviders = async () => {
      let q = supabase.from("providers").select("*");
      if (query) {
        q = q.ilike("service_type", `%${query}%`);
      }
      const { data } = await q;
      const providersList = data || [];
      
      // Fetch profile names
      const userIds = providersList.map((p) => p.user_id);
      let profilesMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);
        profiles?.forEach((p) => { profilesMap[p.user_id] = p.full_name; });
      }
      
      setProviders(providersList.map((p) => ({ ...p, provider_name: profilesMap[p.user_id] || "Provider" })));
      setLoading(false);
    };
    fetchProviders();
  }, [query]);

  const handleHire = (provider: Tables<"providers">) => {
    if (!user) {
      toast.error("Please log in to book a service");
      navigate("/login");
      return;
    }
    if (role !== "customer") {
      toast.error("Only customers can book services");
      return;
    }
    setBookingProvider(provider);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <h1 className="mb-2 text-3xl font-bold">Available Services</h1>
        <p className="mb-8 text-muted-foreground">
          {query ? `Showing results for "${query}"` : "Browse all available service providers"}
        </p>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6"><div className="h-40 rounded-lg bg-muted" /></CardContent>
              </Card>
            ))}
          </div>
        ) : providers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-lg text-muted-foreground">No providers found{query ? ` for "${query}"` : ""}.</p>
            <p className="text-sm text-muted-foreground">Check back later or try a different search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {providers.map((p) => (
              <Card key={p.id} className="overflow-hidden shadow-card hover:shadow-elevated transition-all">
                <div className="flex items-center justify-center bg-muted/50 p-6">
                  <img src={getServiceImage(p.service_type)} alt={p.service_type} className="h-24 w-24 object-contain" loading="lazy" width={512} height={512} />
                </div>
                <CardContent className="p-6">
                  <div className="mb-3 flex items-center justify-between">
                    <Badge variant="secondary">{p.service_type}</Badge>
                    <span className="text-lg font-bold text-primary">${p.price}</span>
                  </div>
                  <h3 className="mb-1 text-lg font-semibold">{p.provider_name}</h3>
                  <p className="mb-4 text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                  {p.experience && <p className="mb-4 text-xs text-muted-foreground">Experience: {p.experience}</p>}
                  {role !== "provider" && (
                    <Button className="w-full gradient-primary text-primary-foreground" onClick={() => handleHire(p)}>
                      Hire
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {bookingProvider && (
        <BookingDialog
          provider={bookingProvider}
          open={!!bookingProvider}
          onClose={() => setBookingProvider(null)}
        />
      )}
    </Layout>
  );
};

export default Services;
