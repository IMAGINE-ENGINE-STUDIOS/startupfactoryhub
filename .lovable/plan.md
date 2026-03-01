

## Plan: Unify Mentees into Meetings Tab (Mentor + Advisor Dashboards)

### Changes

**1. MentorDashboard.tsx**
- Remove the "Mentees" `TabsTrigger` (line 134-137)
- Move all content from the `mentees` `TabsContent` (lines 194-233) into the `meetings` `TabsContent` (lines 165-167), placing it below `<LiveRooms />`
- Delete the now-empty `mentees` `TabsContent`

**2. AdvisorDashboard.tsx**
- Remove the "Mentees" `TabsTrigger` (line 289-292)
- Move all content from the `mentees` `TabsContent` (lines 349-483) into the `meetings` `TabsContent` (lines 320-322), placing it below `<LiveRooms />`
- Delete the now-empty `mentees` `TabsContent`

### Result
Both dashboards will have a single "Meetings" tab containing: Live Rooms at the top, followed by MenteeSessions, MentorshipRequests, ActiveMenteesCards, MentorOffersBoard, MentorSessionHistory, and Past Mentees — all in one unified view.

