import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (userId) {
      fetchProfiles();
    }
  }, [userId]);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('trading_profiles')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      setProfiles(data || []);
      
      // Set first profile as active if none selected
      if (data && data.length > 0 && !activeProfile) {
        setActiveProfile(data[0]);
      }
    } catch (error: any) {
      toast({
        title: 'Error loading profiles',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async (name: string) => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('trading_profiles')
        .insert([{ user_id: userId, name, commission: 0 }])
        .select()
        .single();

      if (error) throw error;

      setProfiles([...profiles, data]);
      toast({
        title: 'Profile created',
        description: `${name} has been created successfully.`,
      });
      
      return data;
    } catch (error: any) {
      toast({
        title: 'Error creating profile',
        description: error.message,
        variant: 'destructive',
      });
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
