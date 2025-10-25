-- Create trading_profiles table (max 3 per user)
CREATE TABLE public.trading_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  commission NUMERIC DEFAULT 0,
  selected_question_profile TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_profile_name_per_user UNIQUE (user_id, name)
);

-- Add constraint to limit 3 profiles per user
CREATE OR REPLACE FUNCTION check_profile_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.trading_profiles WHERE user_id = NEW.user_id) >= 3 THEN
    RAISE EXCEPTION 'Maximum 3 profiles allowed per user';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_profile_limit
BEFORE INSERT ON public.trading_profiles
FOR EACH ROW
EXECUTE FUNCTION check_profile_limit();

-- Enable RLS
ALTER TABLE public.trading_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trading_profiles
CREATE POLICY "Users can view their own profiles"
ON public.trading_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profiles"
ON public.trading_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profiles"
ON public.trading_profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profiles"
ON public.trading_profiles FOR DELETE
USING (auth.uid() = user_id);

-- Create trades table
CREATE TABLE public.trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.trading_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  symbol TEXT NOT NULL,
  profit NUMERIC NOT NULL,
  side TEXT,
  quantity INTEGER,
  entry_price NUMERIC,
  exit_price NUMERIC,
  setup TEXT,
  mistake TEXT,
  rating INTEGER,
  target NUMERIC,
  stop_loss NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trades
CREATE POLICY "Users can view their own trades"
ON public.trades FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own trades"
ON public.trades FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trades"
ON public.trades FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trades"
ON public.trades FOR DELETE
USING (auth.uid() = user_id);

-- Create journal_entries table
CREATE TABLE public.journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_id UUID NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.trading_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL, -- 'custom_questions', 'standard_questions', 'free_form'
  content JSONB NOT NULL, -- Stores the journal data as JSON
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for journal_entries
CREATE POLICY "Users can view their own journal entries"
ON public.journal_entries FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own journal entries"
ON public.journal_entries FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journal entries"
ON public.journal_entries FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own journal entries"
ON public.journal_entries FOR DELETE
USING (auth.uid() = user_id);

-- Create custom_questions table
CREATE TABLE public.custom_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_name TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  questions TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_profile_name_questions UNIQUE (user_id, profile_name)
);

-- Enable RLS
ALTER TABLE public.custom_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for custom_questions
CREATE POLICY "Users can view their own custom questions"
ON public.custom_questions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own custom questions"
ON public.custom_questions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom questions"
ON public.custom_questions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom questions"
ON public.custom_questions FOR DELETE
USING (auth.uid() = user_id);

-- Create storage bucket for journal images
INSERT INTO storage.buckets (id, name, public)
VALUES ('journal-images', 'journal-images', false);

-- Storage policies for journal images
CREATE POLICY "Users can upload their own images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'journal-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'journal-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'journal-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Add update triggers
CREATE TRIGGER update_trading_profiles_updated_at
BEFORE UPDATE ON public.trading_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trades_updated_at
BEFORE UPDATE ON public.trades
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at
BEFORE UPDATE ON public.journal_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_custom_questions_updated_at
BEFORE UPDATE ON public.custom_questions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();