## ADDED Requirements

### Requirement: Icon component library
The web SHALL use `lucide-react` as its icon library, replacing emoji Unicode characters in UI components.

#### Scenario: Icon renders in EventCard
- **WHEN** `EventCard.tsx` is rendered
- **THEN** the date icon SHALL use `Calendar` from `lucide-react` instead of `📅`
- **THEN** the time icon SHALL use `Clock` from `lucide-react` instead of `🕐`
- **THEN** the location icon SHALL use `MapPin` from `lucide-react` instead of `📍`

#### Scenario: Icon renders in EventDetail
- **WHEN** `EventDetail.tsx` is rendered
- **THEN** the description icon SHALL use `FileText` from `lucide-react` instead of `📄`
- **THEN** the date icon SHALL use `Calendar` from `lucide-react` instead of `📅`

#### Scenario: Icon renders in MessageList empty state
- **WHEN** `MessageList.tsx` shows the empty state
- **THEN** it SHALL use `MessageCircle` from `lucide-react` instead of `💬`

### Requirement: lucide-react dependency declared
The `lucide-react` package SHALL be listed in `web/package.json` dependencies.

#### Scenario: Package installs successfully
- **WHEN** `npm install` is run
- **THEN** `lucide-react` SHALL be resolvable at runtime
