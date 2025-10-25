-- ============================================
-- Fix 1: Add Admin Role System for Access Key Generation
-- ============================================

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- ============================================
-- Fix 2: Secure Storage Bucket
-- ============================================

-- Make journal-images bucket private
UPDATE storage.buckets 
SET public = false 
WHERE name = 'journal-images';

-- Allow users to upload to their own folder
CREATE POLICY "Users can upload own images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'journal-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view only their own images
CREATE POLICY "Users can view own images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'journal-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update only their own images
CREATE POLICY "Users can update own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'journal-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete only their own images
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'journal-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- Fix 3: Add Input Validation Constraints
-- ============================================

-- Add length constraints to profiles.nickname
ALTER TABLE public.profiles 
ADD CONSTRAINT nickname_length_check 
CHECK (char_length(nickname) <= 50);

ALTER TABLE public.profiles 
ADD CONSTRAINT nickname_not_empty_check 
CHECK (nickname IS NULL OR trim(nickname) != '');

-- Add length constraints to trades fields
ALTER TABLE public.trades 
ADD CONSTRAINT setup_length_check 
CHECK (setup IS NULL OR char_length(setup) <= 500);

ALTER TABLE public.trades 
ADD CONSTRAINT mistake_length_check 
CHECK (mistake IS NULL OR char_length(mistake) <= 500);

-- Update validate_access_key function with input validation
CREATE OR REPLACE FUNCTION public.validate_access_key(p_key text, p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_key_record RECORD;
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Input validation
  IF p_key IS NULL OR trim(p_key) = '' THEN
    RETURN json_build_object('valid', false, 'error', 'Access key is required');
  END IF;
  
  IF char_length(p_key) != 16 THEN
    RETURN json_build_object('valid', false, 'error', 'Invalid access key format');
  END IF;
  
  IF p_key !~ '^[A-Z0-9]+$' THEN
    RETURN json_build_object('valid', false, 'error', 'Invalid access key format');
  END IF;
  
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
$function$;