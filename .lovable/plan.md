
# Fix Profile Real-Time Sync and Data Persistence Issues

## Problem Summary
The investor profile (and other role-specific profiles) have several data persistence and sync issues:
1. **Avatar doesn't save visually** - Image uploads succeed in database but UI doesn't update
2. **Profile info doesn't persist** - Changes save to database but don't reflect in UI
3. **Edit mode clears data** - Clicking "Edit Profile" shows empty fields instead of current values
4. **No real-time sync** - Profile changes don't update across the app without refresh

## Root Causes

### Issue 1: Missing Real-Time Subscriptions
- `InvestorProfileView` only fetches `investor_profiles` data once on mount
- No Supabase real-time channel subscription for `investor_profiles` table
- Same issue exists for `accelerator_profiles`, `mentor_profiles`, `student_profiles`

### Issue 2: Avatar Upload Not Refreshing Parent State
- `AvatarUpload` component updates database correctly
- But `InvestorProfileView` doesn't have an `onUploadComplete` callback to refresh its state
- The profile from `useProfileWithRole` should update via real-time, but may have timing issues

### Issue 3: Edit Mode State Initialization
- When `startEditing()` is called, it reads from current state
- If data fetch hasn't completed or state is stale, fields appear empty
- Need to ensure data is loaded before allowing edit mode

## Solution Plan

### Phase 1: Fix InvestorProfileView (Primary Fix)

**1.1 Add Real-Time Subscription for investor_profiles**
```typescript
// Add useEffect for real-time investor profile updates
useEffect(() => {
  if (!profile?.user_id) return;
  
  const channel = supabase
    .channel(`investor-profile-${profile.user_id}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'investor_profiles',
      filter: `user_id=eq.${profile.user_id}`
    }, (payload) => {
      if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
        setInvestorProfile(payload.new);
      }
    })
    .subscribe();
    
  return () => {
    supabase.removeChannel(channel);
  };
}, [profile?.user_id]);
```

**1.2 Add onUploadComplete Callback to AvatarUpload**
```typescript
<AvatarUpload
  currentAvatarUrl={profile?.avatar_url}
  size="lg"
  userRole="investor"
  showGradientBorder
  onUploadComplete={(url) => {
    // Force profile refresh - the real-time subscription should handle this
    // but we add explicit handling for immediate feedback
  }}
/>
```

**1.3 Improve Data Loading Check Before Editing**
```typescript
const startEditing = () => {
  // Ensure data is loaded before allowing edit
  if (!profile) {
    toast({ title: 'Profile not loaded yet', variant: 'destructive' });
    return;
  }
  // ... existing initialization code
};
```

### Phase 2: Fix Other Profile Views

**2.1 AcceleratorProfileView**
- Add real-time subscription for `accelerator_profiles`
- Add `onUploadComplete` callback to AvatarUpload

**2.2 AdvisorProfileView**  
- Add real-time subscription for `mentor_profiles`
- Add `onUploadComplete` callback to AvatarUpload

**2.3 StudentProfileView**
- Add real-time subscription for `student_profiles`
- Ensure proper state sync after save

### Phase 3: Ensure Database Tables in Real-Time Publication

**Critical Requirement**: Tables must be added to `supabase_realtime` publication:
```sql
-- Ensure tables are in the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE investor_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE accelerator_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE mentor_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE student_profiles;

-- Set REPLICA IDENTITY for these tables
ALTER TABLE investor_profiles REPLICA IDENTITY FULL;
ALTER TABLE accelerator_profiles REPLICA IDENTITY FULL;
ALTER TABLE mentor_profiles REPLICA IDENTITY FULL;
ALTER TABLE student_profiles REPLICA IDENTITY FULL;
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/InvestorProfileView.tsx` | Add real-time subscription, fix AvatarUpload callback, improve edit initialization |
| `src/components/AcceleratorProfileView.tsx` | Add real-time subscription, fix AvatarUpload callback |
| `src/components/AdvisorProfileView.tsx` | Add real-time subscription, fix AvatarUpload callback |
| `src/components/StudentProfileView.tsx` | Add real-time subscription if missing |
| New migration file | Add tables to supabase_realtime publication |

## Technical Details

### Real-Time Subscription Pattern
Each profile view will follow this pattern:
```typescript
// Subscribe to role-specific profile changes
useEffect(() => {
  if (!profile?.user_id) return;
  
  const channel = supabase
    .channel(`${roleType}-profile-${profile.user_id}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: `${roleType}_profiles`,
      filter: `user_id=eq.${profile.user_id}`
    }, (payload) => {
      if (payload.eventType !== 'DELETE') {
        setRoleProfile(payload.new);
      }
    })
    .subscribe();
    
  return () => supabase.removeChannel(channel);
}, [profile?.user_id]);
```

### Avatar Sync Pattern
The AvatarUpload component already updates the database. We need to ensure:
1. The `profiles` table real-time subscription in `useProfileWithRole` is working
2. Or add explicit refresh callback for immediate visual feedback

### State Initialization Guard
```typescript
const startEditing = () => {
  // Guard against editing before data loads
  if (profileLoading || !profile) {
    toast({ 
      title: 'Please wait', 
      description: 'Profile data is still loading...' 
    });
    return;
  }
  // ... initialization code
};
```

## Expected Outcome
After implementation:
1. ✅ Avatar uploads reflect immediately in UI
2. ✅ Profile changes sync in real-time across components
3. ✅ Edit mode shows current data, not empty fields
4. ✅ All role-specific profiles (investor, accelerator, advisor, student) work consistently
5. ✅ No data loss when switching between view and edit modes
