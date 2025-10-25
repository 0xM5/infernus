-- Update access key validation to accept 26 characters
CREATE OR REPLACE FUNCTION public.validate_access_key(p_key text, p_user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_key_record RECORD;
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Input validation
  IF p_key IS NULL OR trim(p_key) = '' THEN
    RETURN json_build_object('valid', false, 'error', 'Access key is required');
  END IF;
  
  IF char_length(p_key) != 26 THEN
    RETURN json_build_object('valid', false, 'error', 'Invalid access key format');
  END IF;
  
  IF p_key !~ '^[a-z0-9]+$' THEN
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
$function$