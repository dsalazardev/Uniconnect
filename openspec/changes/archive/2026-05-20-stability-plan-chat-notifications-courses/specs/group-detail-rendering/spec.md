## ADDED Requirements

### Requirement: Defensive rendering for null owner
The GroupDetail component SHALL handle cases where the group owner is null or undefined without crashing.

#### Scenario: Group without owner
- **WHEN** the backend returns a group where `owner === null`
- **THEN** the GroupDetail renders without the owner section and does not throw an error

#### Scenario: Safe access to owner ID
- **WHEN** the GroupDetail passes `ownerId` to MemberList
- **THEN** it uses `groupInfo.owner?.id_user` with a fallback to `undefined` or `0`

### Requirement: Defensive rendering for null memberships
The GroupDetail and MemberList components SHALL handle cases where memberships is null or undefined.

#### Scenario: Group without memberships
- **WHEN** the backend returns `memberships === null`
- **THEN** the GroupDetail passes an empty array `[]` to MemberList

#### Scenario: MemberList with empty memberships
- **WHEN** MemberList receives an empty array
- **THEN** it renders "No hay miembros aún" instead of crashing
