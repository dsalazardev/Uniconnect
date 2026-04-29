import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { observer } from 'mobx-react-lite';
import { Ionicons } from '@expo/vector-icons';
import { groupAdminStore } from '../../store/GroupAdminStore';
import { GroupJoinRequest } from '../../types';
import { adminStyles as s } from './styles';

interface RequestRowProps {
  request: GroupJoinRequest;
  groupId: number;
}

export const RequestRow = observer(({ request, groupId }: RequestRowProps) => {
  const isProcessing = groupAdminStore.isLoading;

  return (
    <View style={s.requestCard}>
      <View style={s.rowLeft}>
        {request.requester.picture ? (
          <Image source={{ uri: request.requester.picture }} style={s.avatar} />
        ) : (
          <View style={[s.avatar, s.avatarPlaceholder]}>
            <Ionicons name="person" size={22} color="#D9B97E" />
          </View>
        )}

        <View style={s.rowInfo}>
          <Text style={s.rowName}>{request.requester.full_name}</Text>
          {request.requester.program && (
            <Text style={s.rowSub}>{request.requester.program.name}</Text>
          )}
          <Text style={s.rowEmail}>{request.requester.email}</Text>
        </View>
      </View>

      <View style={s.rowActions}>
        <TouchableOpacity
          style={[s.iconBtn, s.acceptBtn]}
          onPress={() => groupAdminStore.acceptRequest(request.id_request, groupId)}
          disabled={isProcessing}
          accessibilityLabel="Aceptar solicitud"
        >
          <Ionicons name="checkmark" size={18} color="#22C55E" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.iconBtn, s.rejectBtn]}
          onPress={() => groupAdminStore.rejectRequest(request.id_request, groupId)}
          disabled={isProcessing}
          accessibilityLabel="Rechazar solicitud"
        >
          <Ionicons name="close" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
});
