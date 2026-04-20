import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { getInvitations } from '@/api/generated/invitations/invitations';
import { TypeRootStackParamList } from '@/processes/navigation/interface/navigation.interface';
import { invitationsIncomingQueryKey } from '../lib/invitations.keys';

const api = getInvitations();

export function useIncomingInvitationsBanner() {
  const queryClient = useQueryClient();
  const navigation = useNavigation<NavigationProp<TypeRootStackParamList>>();

  const { data: incoming, isLoading } = useQuery({
    queryKey: invitationsIncomingQueryKey,
    queryFn: () => api.invitationsIncoming(),
    staleTime: 0,
    refetchInterval: 60_000,
  });

  const acceptMutation = useMutation({
    mutationFn: (id: string) => api.invitationsAccept(id),
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: invitationsIncomingQueryKey });
      void queryClient.invalidateQueries({ queryKey: ['chats', 'user'] });
      const chatId = res.chat?.id;
      if (chatId) {
        navigation.navigate('Chat', { chatId });
      }
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => api.invitationsReject(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: invitationsIncomingQueryKey });
    },
  });

  const shouldShow = !isLoading && Boolean(incoming?.length);

  return {
    shouldShow,
    incoming: incoming ?? [],
    accept: acceptMutation.mutate,
    reject: rejectMutation.mutate,
    isAcceptPending: acceptMutation.isPending,
    isRejectPending: rejectMutation.isPending,
  };
}
