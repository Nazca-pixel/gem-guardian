-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create companion_animals table
CREATE TABLE public.companion_animals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Pippo',
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 10),
  fxp INTEGER NOT NULL DEFAULT 0,
  bxp INTEGER NOT NULL DEFAULT 0,
  mood TEXT NOT NULL DEFAULT 'happy' CHECK (mood IN ('happy', 'sad', 'excited')),
  consecutive_failed_months INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create savings_goals table
CREATE TABLE public.savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '🎯',
  target_amount DECIMAL(12,2) NOT NULL,
  current_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  deadline DATE,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transaction categories enum
CREATE TYPE public.transaction_category AS ENUM (
  'food', 'transport', 'entertainment', 'shopping', 'bills', 
  'health', 'education', 'savings', 'income', 'other'
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  category transaction_category NOT NULL DEFAULT 'other',
  emoji TEXT DEFAULT '💰',
  is_income BOOLEAN NOT NULL DEFAULT false,
  is_necessary BOOLEAN NOT NULL DEFAULT true,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create accessories table (master list)
CREATE TABLE public.accessories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  bxp_required INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_accessories (unlocked accessories per user)
CREATE TABLE public.user_accessories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  accessory_id UUID NOT NULL REFERENCES public.accessories(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_equipped BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(user_id, accessory_id)
);

-- Create badges table (master list)
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  description TEXT NOT NULL,
  badge_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_badges (earned badges per user)
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companion_animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accessories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_accessories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Companion animals policies
CREATE POLICY "Users can view own companion" ON public.companion_animals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own companion" ON public.companion_animals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own companion" ON public.companion_animals FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Savings goals policies
CREATE POLICY "Users can view own goals" ON public.savings_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON public.savings_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON public.savings_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON public.savings_goals FOR DELETE USING (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON public.transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON public.transactions FOR DELETE USING (auth.uid() = user_id);

-- Accessories are public readable
CREATE POLICY "Anyone can view accessories" ON public.accessories FOR SELECT USING (true);

-- User accessories policies
CREATE POLICY "Users can view own accessories" ON public.user_accessories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can unlock accessories" ON public.user_accessories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own accessories" ON public.user_accessories FOR UPDATE USING (auth.uid() = user_id);

-- Badges are public readable
CREATE POLICY "Anyone can view badges" ON public.badges FOR SELECT USING (true);

-- User badges policies
CREATE POLICY "Users can view own badges" ON public.user_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can earn badges" ON public.user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_companion_animals_updated_at BEFORE UPDATE ON public.companion_animals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_savings_goals_updated_at BEFORE UPDATE ON public.savings_goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile and companion on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', 'Nuovo Utente'));
  
  INSERT INTO public.companion_animals (user_id, name)
  VALUES (NEW.id, 'Pippo');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default accessories
INSERT INTO public.accessories (name, emoji, bxp_required, description) VALUES
  ('Fiocco', '🎀', 0, 'Un dolce fiocchetto'),
  ('Cappello', '🎩', 100, 'Un elegante cappello'),
  ('Fiore', '🌸', 200, 'Un fiore profumato'),
  ('Sciarpa', '🧣', 300, 'Una calda sciarpa'),
  ('Corona', '👑', 500, 'Una corona regale'),
  ('Occhiali', '🕶️', 400, 'Occhiali da sole cool'),
  ('Papillon', '🎀', 350, 'Un papillon elegante'),
  ('Maschera', '🎭', 1000, 'Una maschera misteriosa');

-- Insert default badges
INSERT INTO public.badges (name, emoji, description, badge_type) VALUES
  ('Prima Spesa', '🌟', 'Hai tracciato la tua prima spesa', 'tracking'),
  ('7 Giorni', '🔥', 'Una settimana di tracciamento consecutivo', 'streak'),
  ('Risparmiatore', '💎', 'Hai raggiunto il tuo primo obiettivo', 'savings'),
  ('Super Saver', '🚀', 'Hai risparmiato €500 in un mese', 'savings'),
  ('Maestro', '🏅', 'Raggiungi il livello 5', 'level'),
  ('Fantasma', '👻', 'Zero spese non necessarie per un mese', 'behavior'),
  ('Esperto', '🎓', 'Raggiungi il livello 10', 'level'),
  ('Costante', '📅', '30 giorni di tracciamento consecutivo', 'streak');