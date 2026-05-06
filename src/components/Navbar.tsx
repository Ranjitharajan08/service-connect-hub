import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, Menu, X, UserCircle, MessageCircle } from "lucide-react";
import { useState } from "react";

const Navbar = () => {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const dashboardPath = role === "provider" ? "/provider-dashboard" : "/customer-dashboard";

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
            <span className="text-lg font-bold text-primary-foreground">H</span>
          </div>
          <span className="text-xl font-bold text-foreground">HumanDemand</span>
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-6 md:flex">
          <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Home</Link>
          <Link to="/services" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Services</Link>
          {user ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate(dashboardPath)}>
                <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate("/chat")}>
                <MessageCircle className="mr-2 h-4 w-4" /> Messages
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate("/profile")}>
                <UserCircle className="mr-2 h-4 w-4" /> Profile
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>Login</Button>
              <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => navigate("/signup")}>Sign Up</Button>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t bg-card p-4 md:hidden">
          <div className="flex flex-col gap-3">
            <Link to="/" className="text-sm font-medium" onClick={() => setMobileOpen(false)}>Home</Link>
            <Link to="/services" className="text-sm font-medium" onClick={() => setMobileOpen(false)}>Services</Link>
            {user ? (
              <>
                <Button variant="ghost" size="sm" className="justify-start" onClick={() => { navigate(dashboardPath); setMobileOpen(false); }}>
                  <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                </Button>
                <Button variant="ghost" size="sm" className="justify-start" onClick={() => { navigate("/chat"); setMobileOpen(false); }}>
                  <MessageCircle className="mr-2 h-4 w-4" /> Messages
                </Button>
                <Button variant="ghost" size="sm" className="justify-start" onClick={() => { navigate("/profile"); setMobileOpen(false); }}>
                  <UserCircle className="mr-2 h-4 w-4" /> Profile
                </Button>
                <Button variant="outline" size="sm" className="justify-start" onClick={() => { handleSignOut(); setMobileOpen(false); }}>
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="justify-start" onClick={() => { navigate("/login"); setMobileOpen(false); }}>Login</Button>
                <Button size="sm" className="gradient-primary text-primary-foreground justify-start" onClick={() => { navigate("/signup"); setMobileOpen(false); }}>Sign Up</Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
