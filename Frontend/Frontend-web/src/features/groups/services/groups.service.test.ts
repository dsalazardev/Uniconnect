import { describe, it, expect } from 'vitest';
import { groupsService } from '.';
import { GroupsService } from '@uniconnect/shared';

describe('GroupsService', () => {
  it('should be correctly instantiated', () => {
    expect(groupsService).toBeInstanceOf(GroupsService);
  });

  it('should have core CRUD methods', () => {
    expect(groupsService.createGroup).toBeDefined();
    expect(groupsService.getCreatedGroups).toBeDefined();
    expect(groupsService.getMemberGroups).toBeDefined();
    expect(groupsService.getGroupDetail).toBeDefined();
    expect(groupsService.deleteGroup).toBeDefined();
  });
});
