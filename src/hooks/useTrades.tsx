import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Trade {
  id?: string;
  profile_id: string;
  user_id: string;
  date: string;
  symbol: string;
  profit: number;
  side?: string;
  quantity?: number;
  entry_price?: number;
  exit_price?: number;
  setup?: string;
  mistake?: string;
  rating?: number;
  target?: number;
  stop_loss?: number;
}

export const useTrades = (profileId: string | undefined, userId: string | undefined) => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (profileId && userId) {
      fetchTrades();
    }
  }, [profileId, userId]);

  const fetchTrades = async () => {
    if (!profileId) return;

    try {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('profile_id', profileId)
        .order('date', { ascending: false });

      if (error) throw error;

      setTrades(data || []);
    } catch (error: any) {
      toast({
        title: 'Error loading trades',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveTrade = async (trade: Trade) => {
    if (!userId || !profileId) return;

    try {
      if (trade.id) {
        // Update existing trade
        const { error } = await supabase
          .from('trades')
          .update(trade)
          .eq('id', trade.id);

        if (error) throw error;

        setTrades(trades.map(t => t.id === trade.id ? trade : t));
      } else {
        // Insert new trade
        const { data, error } = await supabase
          .from('trades')
          .insert([{ ...trade, user_id: userId, profile_id: profileId }])
          .select()
          .single();

        if (error) throw error;

        setTrades([data, ...trades]);
      }
    } catch (error: any) {
      toast({
        title: 'Error saving trade',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const bulkImportTrades = async (newTrades: Omit<Trade, 'id'>[]) => {
    if (!userId || !profileId) return;

    try {
      // Filter out duplicates by checking existing trades (same date + symbol)
      const uniqueTrades = newTrades.filter(newTrade => {
        return !trades.some(existingTrade => 
          existingTrade.date === newTrade.date && 
          existingTrade.symbol === newTrade.symbol
        );
      });

      if (uniqueTrades.length === 0) {
        toast({
          title: 'No new trades',
          description: 'All trades already exist in the database.',
        });
        return [];
      }

      const tradesWithIds = uniqueTrades.map(trade => ({
        ...trade,
        user_id: userId,
        profile_id: profileId,
      }));

      const { data, error } = await supabase
        .from('trades')
        .insert(tradesWithIds)
        .select();

      if (error) throw error;

      setTrades([...trades, ...(data || [])]);
      
      const skippedCount = newTrades.length - uniqueTrades.length;
      toast({
        title: 'Trades imported',
        description: `${data?.length || 0} trades imported successfully.${skippedCount > 0 ? ` ${skippedCount} duplicate(s) skipped.` : ''}`,
      });

      return data;
    } catch (error: any) {
      toast({
        title: 'Error importing trades',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteTrade = async (tradeId: string) => {
    try {
      const { error } = await supabase
        .from('trades')
        .delete()
        .eq('id', tradeId);

      if (error) throw error;

      setTrades(trades.filter(t => t.id !== tradeId));
    } catch (error: any) {
      toast({
        title: 'Error deleting trade',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return {
    trades,
    loading,
    saveTrade,
    bulkImportTrades,
    deleteTrade,
    refetch: fetchTrades,
  };
};
