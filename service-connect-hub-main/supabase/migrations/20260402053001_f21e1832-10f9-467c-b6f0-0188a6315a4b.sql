
-- Role enum
CREATE TYPE public.app_role AS ENUM ('customer', 'provider');

-- Booking status enum
CREATE TYPE public.booking_status AS ENUM ('pending', 'accepted', 'rejected');

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own role" ON public.user_roles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Providers table
CREATE TABLE public.providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  service_type TEXT NOT NULL UNIQUE,
  price NUMERIC NOT NULL DEFAULT 0,
  description TEXT NOT NULL DEFAULT '',
  experience TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view providers" ON public.providers FOR SELECT USING (true);
CREATE POLICY "Providers can create their own listing" ON public.providers
  FOR INSERT WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'provider'));
CREATE POLICY "Providers can update their own listing" ON public.providers
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Providers can delete their own listing" ON public.providers
  FOR DELETE USING (auth.uid() = user_id);

-- Bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE NOT NULL,
  service_type TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  notes TEXT DEFAULT '',
  status booking_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Providers can view their bookings" ON public.bookings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.providers WHERE providers.id = provider_id AND providers.user_id = auth.uid())
  );
CREATE POLICY "Customers can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = customer_id AND public.has_role(auth.uid(), 'customer'));
CREATE POLICY "Providers can update booking status" ON public.bookings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.providers WHERE providers.id = provider_id AND providers.user_id = auth.uid())
  );

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_providers_updated_at BEFORE UPDATE ON public.providers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, '')
  );
  -- Insert role from metadata
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data->>'role')::app_role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
