import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { DuoLink } from '@/types/database';

export function useDuoLinks() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['duo_links', user?.id],
    queryFn: async (): Promise<DuoLink[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('duo_links')
        .select('*')
        .or(`primary_user_id.eq.${user.id},partner_user_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(user),
  });
}

export function useInviteDuoPartner() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (inviteEmail: string) => {
      if (!user) throw new Error('Usuário não autenticado');
      const { data, error } = await supabase
        .from('duo_links')
        .insert({ primary_user_id: user.id, invite_email: inviteEmail, status: 'pending' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['duo_links', user?.id] });
    },
  });
}
