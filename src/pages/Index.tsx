import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Layout from "@/components/Layout";
import heroBg from "@/assets/hero-bg.jpg";
import { SERVICE_TYPES } from "@/lib/services";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/services?q=${encodeURIComponent(search)}`);
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden gradient-hero py-20 md:py-32">
        <div className="absolute inset-0 opacity-10">
          <img src={heroBg} alt="" className="h-full w-full object-cover" width={1920} height={800} />
        </div>
        <div className="container relative mx-auto px-4 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-primary-foreground md:text-6xl">
            Expert Help for Every Task
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-primary-foreground/80">
            Find trusted professionals for cleaning, repairs, moving, and more.
          </p>
          <form onSubmit={handleSearch} className="mx-auto flex max-w-lg gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search for a service..."
                className="pl-10 bg-card text-foreground"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button type="submit" className="gradient-primary text-primary-foreground">Search</Button>
          </form>
        </div>
      </section>

      {/* Popular Services */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="mb-2 text-center text-3xl font-bold">Popular Services</h2>
          <p className="mb-12 text-center text-muted-foreground">Browse our most requested services</p>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
            {SERVICE_TYPES.map((s) => (
              <Link
                key={s.key}
                to={`/services?q=${encodeURIComponent(s.key)}`}
                className="group flex flex-col items-center rounded-xl border bg-card p-6 shadow-card transition-all hover:shadow-elevated hover:-translate-y-1"
              >
                <img src={s.image} alt={s.label} className="mb-4 h-20 w-20 object-contain" loading="lazy" width={512} height={512} />
                <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{s.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="gradient-primary py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold text-primary-foreground">Ready to get started?</h2>
          <p className="mb-8 text-primary-foreground/80">Join HumanDemand today as a customer or service provider.</p>
          <Button size="lg" variant="secondary" onClick={() => navigate("/signup")}>
            Create an Account
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
