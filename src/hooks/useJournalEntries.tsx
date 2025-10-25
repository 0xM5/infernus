import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { debounce } from 'lodash-es';

export interface JournalEntry {
  id?: string;
  trade_id: string;
  profile_id: string;
  user_id: string;
  entry_type: 'custom_questions' | 'standard_questions' | 'free_form';
  content: any;
}

export const useJournalEntries = (tradeId: string | undefined, profileId: string | undefined, userId: string | undefined) => {
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (tradeId && profileId && userId) {
      fetchEntry();
    }
  }, [tradeId, profileId, userId]);

  const fetchEntry = async () => {
    if (!tradeId || !profileId) return;

    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('trade_id', tradeId)
        .eq('profile_id', profileId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      setEntry(data as JournalEntry | null);
    } catch (error: any) {
      console.error('Error loading journal entry:', error);
    } finally {
      setLoading(false);
    }
  };

  // Debounced save function for auto-sync
  const debouncedSave = useCallback(
    debounce(async (entryData: JournalEntry) => {
      if (!userId || !profileId || !tradeId) return;

      setSaving(true);
      try {
        if (entryData.id) {
          // Update existing entry
          const { error } = await supabase
            .from('journal_entries')
            .update({ content: entryData.content, entry_type: entryData.entry_type })
            .eq('id', entryData.id);

          if (error) throw error;
        } else {
          // Insert new entry
          const { data, error } = await supabase
            .from('journal_entries')
            .insert([{
              trade_id: tradeId,
              profile_id: profileId,
              user_id: userId,
              entry_type: entryData.entry_type,
              content: entryData.content,
            }])
            .select()
            .single();

          if (error) throw error;
          
          setEntry(data as JournalEntry);
        }
      } catch (error: any) {
        console.error('Error saving journal entry:', error);
        toast({
          title: 'Error saving',
          description: 'Failed to auto-save journal entry.',
          variant: 'destructive',
        });
      } finally {
        setSaving(false);
      }
    }, 1000),
    [userId, profileId, tradeId]
  );

  // Ensure pending autosave runs on page unload/unmount
  useEffect(() => {
    const flush = () => {
      try { (debouncedSave as any).flush?.(); } catch {}
    };
    window.addEventListener('beforeunload', flush);
    return () => {
      flush();
      window.removeEventListener('beforeunload', flush);
    };
  }, [debouncedSave]);
  
  const updateEntry = (content: any, entryType: JournalEntry['entry_type']) => {
    const updatedEntry = {
      ...entry,
      trade_id: tradeId!,
      profile_id: profileId!,
      user_id: userId!,
      entry_type: entryType,
      content,
    } as JournalEntry;

    setEntry(updatedEntry);
    debouncedSave(updatedEntry);
  };

  return {
    entry,
    loading,
    saving,
    updateEntry,
    refetch: fetchEntry,
  };
};
