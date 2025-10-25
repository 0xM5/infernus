import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useImageUpload = (userId: string | undefined) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!userId) {
      toast({
        title: 'Error',
        description: 'You must be logged in to upload images.',
        variant: 'destructive',
      });
      return null;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('journal-images')
        .upload(fileName, file);

      if (error) throw error;

      // Get signed URL for private bucket (valid for 1 hour)
      const { data: urlData, error: urlError } = await supabase.storage
        .from('journal-images')
        .createSignedUrl(data.path, 3600);

      if (urlError) throw urlError;

      return urlData.signedUrl;
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { uploadImage, uploading };
};
