import React from 'react';
import { ScrollView, TouchableOpacity, Text, View } from 'react-native';
import { observer } from 'mobx-react-lite';
import { groupAdminStore } from '../../store/GroupAdminStore';
import { adminStyles as s } from './styles';

export const GroupSelector = observer(() => {
  // Ocultar si solo hay un grupo (o ninguno) con solicitudes
  if (groupAdminStore.groupsWithRequests.length <= 1) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={s.selectorScroll}
      contentContainerStyle={s.selectorContent}
    >
      {groupAdminStore.groupsWithRequests.map((g) => {
        const isActive = groupAdminStore.activeGroupId === g.id_group;
        return (
          <TouchableOpacity
            key={g.id_group}
            style={[s.selectorChip, isActive && s.selectorChipActive]}
            onPress={() => groupAdminStore.setActiveGroup(g.id_group)}
          >
            <Text
              style={[s.selectorChipText, isActive && s.selectorChipTextActive]}
              numberOfLines={1}
            >
              {g.name || `Grupo ${g.id_group}`}
            </Text>
            {g.joinRequests.length > 0 && (
              <View style={s.badge}>
                <Text style={s.badgeText}>{g.joinRequests.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
});
