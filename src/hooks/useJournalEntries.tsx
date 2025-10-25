import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { debounce } from 'lodash-es';

export interface JournalEntry {
  id?: string;
  trade_id: string;
  profile_id: string;
  user_id: string;
  entry_type: 'custom_questions' | 'standard_questions' | 'free_form' | 'scratchpad';
  content: any;
}

export const useJournalEntries = (
  tradeId: string | undefined,
  profileId: string | undefined,
  userId: string | undefined,
  preferredType?: JournalEntry['entry_type']
) => {
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (tradeId && profileId && userId) {
      fetchEntry();
    }
  }, [tradeId, profileId, userId, preferredType]);

  const fetchEntry = async () => {
    if (!tradeId || !profileId) return;

    try {
      let query = supabase
        .from('journal_entries')
        .select('*')
        .eq('trade_id', tradeId)
        .eq('profile_id', profileId);

      // If a preferred type is provided, try to load that first
      if (preferredType) {
        const { data: preferred, error: preferredErr } = await query
          .eq('entry_type', preferredType)
          .order('updated_at', { ascending: false })
          .limit(10)
          .returns<JournalEntry[] | null>();

        if (preferredErr && preferredErr.code !== 'PGRST116') throw preferredErr;

        const chosen = (preferred || []).find((e) => {
          // Prefer non-empty HTML for free_form/scratchpad
          if (e.entry_type === 'free_form' || e.entry_type === 'scratchpad') {
            const html = e.content?.html ?? '';
            return typeof html === 'string' && html.replace(/<[^>]*>/g, '').trim().length > 0;
          }
          return true;
        }) || (preferred && preferred[0]) || null;

        if (chosen) {
          setEntry(chosen);
          return;
        }

        // Backward compatibility: if preferred is free_form, try legacy 'scratchpad'
        if (preferredType === 'free_form') {
          const { data: legacy, error: legacyErr } = await supabase
            .from('journal_entries')
            .select('*')
            .eq('trade_id', tradeId)
            .eq('profile_id', profileId)
            .eq('entry_type', 'scratchpad')
            .order('updated_at', { ascending: false })
            .limit(10)
            .returns<JournalEntry[] | null>();

          if (legacyErr && legacyErr.code !== 'PGRST116') throw legacyErr;

          const legacyChosen = (legacy || [])[0] || null;
          if (legacyChosen) {
            setEntry(legacyChosen);
            return;
          }
        }
      }

      // Fallback: latest by updated_at
      const { data: latest, error: latestErr } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('trade_id', tradeId)
        .eq('profile_id', profileId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestErr && latestErr.code !== 'PGRST116') throw latestErr;
      setEntry(latest as JournalEntry | null);
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
