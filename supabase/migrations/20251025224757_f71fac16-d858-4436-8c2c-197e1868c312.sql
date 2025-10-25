-- Fix search_path for check_profile_limit function
CREATE OR REPLACE FUNCTION public.check_profile_limit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF (SELECT COUNT(*) FROM public.trading_profiles WHERE user_id = NEW.user_id) >= 3 THEN
    RAISE EXCEPTION 'Maximum 3 profiles allowed per user';
  END IF;
  RETURN NEW;
END;
$function$;