# Role-Based Platform Testing Guide

## Overview
This guide provides comprehensive testing procedures for the role-based startup platform after migrating from profile-based to user_roles-based authentication.

## Table of Contents
1. [Pre-Testing Setup](#pre-testing-setup)
2. [Role-Based Access Testing](#role-based-access-testing)
3. [Dashboard Testing](#dashboard-testing)
4. [Feature Testing](#feature-testing)
5. [Integration Testing](#integration-testing)
6. [Performance Testing](#performance-testing)

---

## Pre-Testing Setup

### Required Test Users
Create test accounts for each role:
- ✅ Startup (startup@test.com)
- ✅ Advisor (advisor@test.com)
- ✅ Investor (investor@test.com)
- ✅ Student (student@test.com)
- ✅ Mentor (mentor@test.com)

### Database Verification
```sql
-- Verify user_roles table
SELECT * FROM user_roles;

-- Check profiles table (should NOT have role column)
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'profiles';

-- Verify RLS policies
SELECT * FROM pg_policies WHERE tablename = 'user_roles';
```

---

## Role-Based Access Testing

### Test Case 1: User Registration
**Steps:**
1. Navigate to `/auth`
2. Register new user with each role type
3. Verify user_roles entry created

**Expected Results:**
- ✅ User created in auth.users
- ✅ Profile created in profiles table
- ✅ Role entry created in user_roles table
- ✅ Redirect to appropriate dashboard

### Test Case 2: Role Retrieval
**Steps:**
1. Log in as each role type
2. Check useUserRole() hook returns correct role
3. Verify useProfileWithRole() returns profile + role

**Expected Results:**
- ✅ Role fetched from user_roles via get_user_role() function
- ✅ No errors in console
- ✅ Role matches registration selection

### Test Case 3: Dashboard Routing
**Steps:**
1. Log in as each role
2. Navigate to `/dashboard`
3. Verify correct dashboard displays

**Expected Results:**
- ✅ Startup → StartupProfile
- ✅ Advisor → AdvisorDashboard
- ✅ Investor → InvestorDashboard
- ✅ Student → StudentDashboard
- ✅ Mentor → MentorDashboard

---

## Dashboard Testing

### Student Dashboard

#### Features to Test:
1. **Educational Resources**
   - ✅ Courses load from database
   - ✅ Enrollment works
   - ✅ Progress tracking updates
   - ✅ Certificate generation

2. **Leaderboard**
   - ✅ Points displayed correctly
   - ✅ Ranking updates
   - ✅ User position highlighted

3. **Study Groups**
   - ✅ Groups load from database
   - ✅ Join/leave functionality
   - ✅ Member count updates

4. **AI Roadmap**
   - ✅ Personalized recommendations
   - ✅ Skill tracking
   - ✅ Progress visualization

**Test Data Requirements:**
```sql
-- Create test course
INSERT INTO courses (title, description, category, instructor_id)
VALUES ('Test Course', 'Description', 'tech', '<instructor_user_id>');

-- Create leaderboard entry
INSERT INTO leaderboard_entries (user_id, points)
VALUES ('<student_user_id>', 100);
```

### Mentor Dashboard

#### Features to Test:
1. **Mentorship Requests**
   - ✅ Pending requests display
   - ✅ Accept/decline functionality
   - ✅ Request status updates

2. **Availability Calendar**
   - ✅ Time slots management
   - ✅ Booking system
   - ✅ Conflict prevention

3. **Sessions Management**
   - ✅ Upcoming sessions display
   - ✅ Session notes
   - ✅ Completion tracking

4. **Endorsements**
   - ✅ Display received endorsements
   - ✅ Skill-based grouping
   - ✅ Endorser information

**Test Data Requirements:**
```sql
-- Create mentorship request
INSERT INTO mentorship_relationships (mentor_id, mentee_id, status)
VALUES ('<mentor_user_id>', '<student_user_id>', 'pending');

-- Create mentoring session
INSERT INTO mentoring_sessions (mentor_id, mentee_id, scheduled_at, topic)
VALUES ('<mentor_user_id>', '<student_user_id>', NOW() + INTERVAL '1 day', 'Test Session');
```

### Advisor Dashboard

#### Features to Test:
1. **Matching System**
   - ✅ Startup recommendations
   - ✅ Filter by industry
   - ✅ Filter by stage
   - ✅ Connection requests

2. **AI Insights**
   - ✅ Startup analysis
   - ✅ Market trends
   - ✅ Opportunity alerts

**Test Data Requirements:**
```sql
-- Create test company
INSERT INTO companies (name, description, industry, stage, user_id)
VALUES ('Test Startup', 'Description', 'tech', 'seed', '<startup_user_id>');
```

### Investor Dashboard

#### Features to Test:
1. **Investment Tracking**
   - ✅ Portfolio display
   - ✅ Investment history
   - ✅ ROI calculations

2. **Startup Discovery**
   - ✅ Browse startups
   - ✅ Filter by criteria
   - ✅ Save interests

3. **Investment Interests**
   - ✅ Express interest
   - ✅ Track conversations
   - ✅ Deal flow management

**Test Data Requirements:**
```sql
-- Create investment
INSERT INTO investments (investor_id, company_id, amount, equity_percentage)
VALUES ('<investor_user_id>', '<company_id>', 100000, 5.0);

-- Create investment interest
INSERT INTO investment_interests (investor_id, company_id, status)
VALUES ('<investor_user_id>', '<company_id>', 'interested');
```

### Startup Profile

#### Features to Test:
1. **Company Information**
   - ✅ Profile display
   - ✅ Edit company details
   - ✅ Logo upload
   - ✅ Banner management

2. **Feed Posts**
   - ✅ Create updates
   - ✅ Milestone posts
   - ✅ Internship listings
   - ✅ Post engagement

3. **Team Management**
   - ✅ Display team size
   - ✅ Funding information
   - ✅ Stage indicators

---

## Feature Testing

### Social Feed

#### Test Cases:
1. **Post Creation**
   - ✅ Text posts
   - ✅ Media uploads
   - ✅ Tags/hashtags
   - ✅ Post types (update, milestone, announcement)

2. **Engagement**
   - ✅ Like/unlike posts
   - ✅ Comment on posts
   - ✅ Reply to comments
   - ✅ Share posts
   - ✅ Bookmark posts

3. **Real-time Updates**
   - ✅ New posts appear automatically
   - ✅ Like counts update
   - ✅ Comment counts update

**Test Procedure:**
```javascript
// 1. Create post as User A
// 2. Open feed as User B (different browser/incognito)
// 3. Verify post appears without refresh
// 4. Like post as User B
// 5. Verify like count updates for User A without refresh
```

### Messaging System

#### Test Cases:
1. **Conversation Management**
   - ✅ Start new conversation
   - ✅ Search users
   - ✅ Conversation list displays
   - ✅ Unread count accurate

2. **Messaging**
   - ✅ Send message
   - ✅ Receive message
   - ✅ Real-time delivery
   - ✅ Read receipts
   - ✅ Message history

3. **Real-time Sync**
   - ✅ Messages appear instantly
   - ✅ Typing indicators (if implemented)
   - ✅ Online status (if implemented)

**Test Procedure:**
```javascript
// 1. Log in as User A
// 2. Log in as User B (different browser)
// 3. User A sends message to User B
// 4. Verify User B receives message without refresh
// 5. User B replies
// 6. Verify User A receives reply without refresh
```

### Events System

#### Test Cases:
1. **Event Creation**
   - ✅ Create public event
   - ✅ Create private event
   - ✅ Set date/time
   - ✅ Set location
   - ✅ Upload banner
   - ✅ Set max attendees

2. **Event Discovery**
   - ✅ Browse events
   - ✅ Calendar view
   - ✅ Filter by date
   - ✅ Search events

3. **Event Participation**
   - ✅ RSVP to event
   - ✅ Cancel RSVP
   - ✅ Attendee list displays
   - ✅ Capacity limits enforced

4. **Real-time Updates**
   - ✅ New events appear
   - ✅ Attendee count updates
   - ✅ Event modifications sync

### AI Features

#### Test Cases:
1. **AI Chatbot**
   - ✅ Start conversation
   - ✅ Receive responses
   - ✅ Context maintained
   - ✅ Error handling

2. **AI Translator**
   - ✅ Translate messages
   - ✅ Multiple languages
   - ✅ Translation accuracy
   - ✅ Caching works

3. **AI Summaries**
   - ✅ Generate summary
   - ✅ Key points extraction
   - ✅ Summary quality
   - ✅ Cache existing summaries

4. **AI Insights**
   - ✅ Sentiment analysis
   - ✅ Content recommendations
   - ✅ Trend detection

**Test Edge Functions:**
```bash
# Test AI chatbot
curl -X POST https://zqiihhmdsdgwdcwmryym.supabase.co/functions/v1/ai-chatbot \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, how can you help?"}'

# Test AI translator
curl -X POST https://zqiihhmdsdgwdcwmryym.supabase.co/functions/v1/ai-translator \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world", "targetLanguage": "es"}'
```

---

## Integration Testing

### Role-Based Permissions

#### Test Matrix:

| Feature | Startup | Advisor | Investor | Student | Mentor |
|---------|---------|---------|----------|---------|--------|
| Create Company | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create Investment | ❌ | ❌ | ✅ | ❌ | ❌ |
| Create Course | ❌ | ✅ | ❌ | ❌ | ✅ |
| Enroll in Course | ❌ | ❌ | ❌ | ✅ | ❌ |
| Request Mentorship | ❌ | ❌ | ❌ | ✅ | ❌ |
| Accept Mentorship | ❌ | ❌ | ❌ | ❌ | ✅ |
| Create Event | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Post | ✅ | ✅ | ✅ | ✅ | ✅ |

### Cross-Role Interactions

#### Test Case: Student-Mentor Flow
1. Student requests mentorship
2. Mentor receives notification
3. Mentor accepts request
4. Session created
5. Both can view session details
6. Session completion updates stats

#### Test Case: Startup-Investor Flow
1. Investor expresses interest
2. Startup receives notification
3. Message conversation started
4. Investment tracked
5. Portfolio updated

#### Test Case: Student-Course Flow
1. Student enrolls in course
2. Progress tracking begins
3. Module completion recorded
4. Certificate generated upon completion
5. Leaderboard updated

---

## Performance Testing

### Database Query Optimization

#### Test Queries:
```sql
-- Test profile with role fetch performance
EXPLAIN ANALYZE
SELECT p.*, 
  (SELECT role FROM user_roles WHERE user_id = p.user_id LIMIT 1) as role
FROM profiles p
WHERE p.user_id = '<user_id>';

-- Test feed posts with profile joins
EXPLAIN ANALYZE
SELECT fp.*, p.full_name, p.avatar_url
FROM feed_posts fp
JOIN profiles p ON fp.user_id = p.user_id
ORDER BY fp.created_at DESC
LIMIT 50;

-- Test message conversations
EXPLAIN ANALYZE
SELECT c.*, 
  p1.full_name as user1_name,
  p2.full_name as user2_name
FROM conversations c
JOIN profiles p1 ON c.user1_id = p1.user_id
JOIN profiles p2 ON c.user2_id = p2.user_id
WHERE c.user1_id = '<user_id>' OR c.user2_id = '<user_id>'
ORDER BY c.last_message_at DESC;
```

### Expected Performance Benchmarks:
- ✅ Page load < 2 seconds
- ✅ Dashboard render < 1 second
- ✅ Real-time updates < 500ms
- ✅ Database queries < 100ms
- ✅ AI responses < 5 seconds

### Load Testing Scenarios:
1. **100 concurrent users browsing feed**
2. **50 concurrent users sending messages**
3. **25 users creating posts simultaneously**
4. **Real-time updates to 200+ connected clients**

---

## Security Testing

### RLS Policy Verification

#### Test Cases:
1. **User Roles Access**
   - ✅ Users can only read their own role
   - ✅ Users cannot modify roles
   - ✅ get_user_role() function works correctly

2. **Profile Access**
   - ✅ Users can only edit their own profile
   - ✅ All profiles viewable (public data)
   - ✅ Sensitive data protected

3. **Post Access**
   - ✅ Users can only edit/delete own posts
   - ✅ All users can view public posts
   - ✅ Like/comment permissions work

4. **Message Privacy**
   - ✅ Users can only view their own messages
   - ✅ Cannot access other users' conversations
   - ✅ Real-time updates respect permissions

#### Security Test Procedure:
```javascript
// 1. Log in as User A
// 2. Get User A's auth token
// 3. Try to access User B's data using User A's token
// 4. Verify 403/401 error or empty results
// 5. Try to modify User B's data
// 6. Verify operation fails
```

---

## Regression Testing Checklist

After any code changes, verify:

### Core Functionality
- [ ] User registration works for all roles
- [ ] Login/logout functions correctly
- [ ] Dashboard routing is accurate
- [ ] Role fetching is reliable
- [ ] Profile updates save correctly

### Features
- [ ] Posts can be created and displayed
- [ ] Messages send and receive
- [ ] Events can be created and attended
- [ ] Courses can be enrolled in
- [ ] Mentorship requests work
- [ ] Investments can be tracked

### Real-time Features
- [ ] Feed updates automatically
- [ ] Messages appear instantly
- [ ] Event updates sync
- [ ] Notifications work

### AI Features
- [ ] Chatbot responds
- [ ] Translations work
- [ ] Summaries generate
- [ ] Insights display

---

## Bug Reporting Template

```markdown
### Bug Title
[Clear, concise title]

### Role
Which user role experienced the issue?

### Steps to Reproduce
1. 
2. 
3. 

### Expected Behavior
What should happen?

### Actual Behavior
What actually happened?

### Screenshots/Errors
[Attach relevant images or console errors]

### Environment
- Browser: 
- Device: 
- User ID: 

### Severity
- [ ] Critical (blocks major functionality)
- [ ] High (major feature broken)
- [ ] Medium (feature partially works)
- [ ] Low (minor issue/cosmetic)
```

---

## Test Sign-off

After completing all tests:

### Tested By: ________________
### Date: ________________
### Version: ________________

### Results:
- [ ] All critical tests passed
- [ ] Performance benchmarks met
- [ ] Security tests passed
- [ ] Real-time features working
- [ ] AI features functional
- [ ] Ready for production

### Known Issues:
1. 
2. 
3. 

### Recommendations:
1. 
2. 
3. 
