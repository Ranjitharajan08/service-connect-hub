import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  provider: Tables<"providers">;
  open: boolean;
  onClose: () => void;
}

const BookingDialog = ({ provider, open, onClose }: Props) => {
  const { user } = useAuth();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const { error } = await supabase.from("bookings").insert({
      customer_id: user.id,
      provider_id: provider.id,
      service_type: provider.service_type,
      date,
      time,
      address,
      notes: notes || null,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Booking request sent!");
      onClose();
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Book {provider.service_type} Service</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bdate">Date</Label>
            <Input id="bdate" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="btime">Time</Label>
            <Input id="btime" type="time" required value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="baddr">Address</Label>
            <Input id="baddr" required value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bnotes">Notes (optional)</Label>
            <Textarea id="bnotes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special instructions..." rows={2} />
          </div>
          <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={loading}>
            {loading ? "Booking..." : "Confirm Booking"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BookingDialog;
