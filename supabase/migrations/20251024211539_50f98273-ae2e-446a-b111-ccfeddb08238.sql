-- Create enum for access key types
CREATE TYPE public.access_key_type AS ENUM (
  '24_hours',
  '72_hours',
  'weekly',
  'monthly',
  'unlimited'
);

-- Create access_keys table
CREATE TABLE public.access_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  type access_key_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_used BOOLEAN NOT NULL DEFAULT false,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on access_keys
ALTER TABLE public.access_keys ENABLE ROW LEVEL SECURITY;

-- Only allow reading of unused, non-expired keys (no user can see keys, only validate them server-side)
CREATE POLICY "No direct access to keys"
  ON public.access_keys
  FOR ALL
  USING (false);

-- Add nickname to profiles table
ALTER TABLE public.profiles
ADD COLUMN nickname TEXT;

-- Add access_key_id to profiles to track which key was used
ALTER TABLE public.profiles
ADD COLUMN access_key_id UUID REFERENCES public.access_keys(id) ON DELETE SET NULL;

-- Add account_expires_at to profiles for tracking access expiration
ALTER TABLE public.profiles
ADD COLUMN account_expires_at TIMESTAMP WITH TIME ZONE;

-- Create function to validate and use access key
CREATE OR REPLACE FUNCTION public.validate_access_key(
  p_key TEXT,
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key_record RECORD;
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Find the key
  SELECT * INTO v_key_record
  FROM public.access_keys
  WHERE key = p_key;
  
  -- Check if key exists
  IF v_key_record IS NULL THEN
    RETURN json_build_object('valid', false, 'error', 'Invalid access key');
  END IF;
  
  -- Check if already used
  IF v_key_record.is_used THEN
    RETURN json_build_object('valid', false, 'error', 'Access key already used');
  END IF;
  
  -- Check if expired (only for keys with expiration)
  IF v_key_record.expires_at IS NOT NULL AND v_key_record.expires_at < now() THEN
    RETURN json_build_object('valid', false, 'error', 'Access key expired');
  END IF;
  
  -- Calculate account expiration based on key type
  CASE v_key_record.type
    WHEN '24_hours' THEN
      v_expires_at := now() + interval '24 hours';
    WHEN '72_hours' THEN
      v_expires_at := now() + interval '72 hours';
    WHEN 'weekly' THEN
      v_expires_at := now() + interval '7 days';
    WHEN 'monthly' THEN
      v_expires_at := now() + interval '30 days';
    WHEN 'unlimited' THEN
      v_expires_at := NULL;
  END CASE;
  
  -- Mark key as used
  UPDATE public.access_keys
  SET is_used = true,
      used_by = p_user_id,
      used_at = now()
  WHERE id = v_key_record.id;
  
  -- Update profile with access key info
  UPDATE public.profiles
  SET access_key_id = v_key_record.id,
      account_expires_at = v_expires_at
  WHERE id = p_user_id;
  
  RETURN json_build_object(
    'valid', true, 
    'key_type', v_key_record.type,
    'expires_at', v_expires_at
  );
END;
$$;

-- Update the handle_new_user function to accept nickname
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nickname)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'nickname'
  );
  RETURN new;
END;
$$;

-- Create index for faster key lookups
CREATE INDEX idx_access_keys_key ON public.access_keys(key) WHERE NOT is_used;
CREATE INDEX idx_access_keys_used ON public.access_keys(is_used);

-- Create policy to allow users to read their own profile
CREATE POLICY "Users can view their own access info"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);