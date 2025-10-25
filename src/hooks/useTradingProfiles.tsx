import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TradingProfile {
  id: string;
  name: string;
  commission: number;
  selected_question_profile: string | null;
}

export const useTradingProfiles = (userId: string | undefined) => {
  const [profiles, setProfiles] = useState<TradingProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<TradingProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const fetchControllerRef = useRef<AbortController | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const creatingProfileRef = useRef(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (userId) {
      // Cancel any pending requests
      if (fetchControllerRef.current) {
        fetchControllerRef.current.abort();
      }
      
      // Debounce to prevent multiple rapid requests
      timeoutId = setTimeout(() => {
        fetchProfiles();
      }, 100);
    } else {
      setLoading(false);
    }

    return () => {
      clearTimeout(timeoutId);
      if (fetchControllerRef.current) {
        fetchControllerRef.current.abort();
      }
    };
  }, [userId]);

  const fetchProfiles = async () => {
    try {
      // Create new abort controller for this request
      fetchControllerRef.current = new AbortController();
      
      const { data, error } = await supabase
        .from('trading_profiles')
        .select('*')
        .order('created_at', { ascending: true })
        .abortSignal(fetchControllerRef.current.signal);

      if (error) throw error;

      setProfiles(data || []);
      
      // Set first profile as active if none selected
      if (data && data.length > 0 && !activeProfile) {
        setActiveProfile(data[0]);
      }
      
      // Reset retry count on success
      retryCountRef.current = 0;
    } catch (error: any) {
      // Don't show error if request was aborted (normal behavior)
      if (error.name === 'AbortError') {
        return;
      }
      
      // Retry logic for network errors
      if (error.message?.includes('Failed to fetch') && retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        console.log(`Retrying profile fetch (attempt ${retryCountRef.current}/${maxRetries})...`);
        setTimeout(() => fetchProfiles(), 1000 * retryCountRef.current);
        return;
      }
      
      console.error('Error loading profiles:', error);
      toast({
        title: 'Error loading profiles',
        description: error.message || 'Please check your connection and try again',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async (name: string) => {
    if (!userId || creatingProfileRef.current) return;

    creatingProfileRef.current = true;
    try {
      const { data, error } = await supabase
        .from('trading_profiles')
        .insert([{ user_id: userId, name, commission: 0 }])
        .select()
        .single();

      if (error) {
        // If duplicate, silently fetch existing profiles instead of showing error
        if (error.code === '23505') {
          console.log('Profile already exists, fetching profiles...');
          await fetchProfiles();
          return;
        }
        throw error;
      }

      setProfiles([...profiles, data]);
      
      // Set as active if it's the first profile
      if (profiles.length === 0) {
        setActiveProfile(data);
      }
      
      toast({
        title: 'Profile created',
        description: `${name} has been created successfully.`,
      });
      
      return data;
    } catch (error: any) {
      console.error('Error creating profile:', error);
      toast({
        title: 'Error creating profile',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      creatingProfileRef.current = false;
    }
  };

  const updateProfile = async (id: string, updates: Partial<TradingProfile>) => {
    try {
      const { error } = await supabase
        .from('trading_profiles')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setProfiles(profiles.map(p => p.id === id ? { ...p, ...updates } : p));
      
      if (activeProfile?.id === id) {
        setActiveProfile({ ...activeProfile, ...updates });
      }
    } catch (error: any) {
      toast({
        title: 'Error updating profile',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const deleteProfile = async (id: string) => {
    try {
      const { error } = await supabase
        .from('trading_profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      const newProfiles = profiles.filter(p => p.id !== id);
      setProfiles(newProfiles);
      
      if (activeProfile?.id === id) {
        setActiveProfile(newProfiles[0] || null);
      }

      toast({
        title: 'Profile deleted',
        description: 'Profile has been deleted successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error deleting profile',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return {
    profiles,
    activeProfile,
    setActiveProfile,
    loading,
    createProfile,
    updateProfile,
    deleteProfile,
    refetch: fetchProfiles,
  };
};
