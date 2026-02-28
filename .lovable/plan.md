
## Plan: Add "Post Cohort to Feed" from Admin Dashboard

### What This Does
Adds a "Post to Feed" button on each cohort card in the admin's SFH Accelerator Manager (Cohorts tab). Clicking it inserts a `post_type: 'cohort'` feed post with the same `cohort_data` structure already used by `CohortPostCard`, so it renders identically to accelerator-created cohort posts in the community feed.

### Implementation Steps

1. **Modify `src/components/accelerator/CohortManagement.tsx`**
   - Add a new "Post to Feed" button (with a `Rocket` or `Share` icon) in each cohort card's action row
   - Add a new prop `onPostToFeed?: (cohort: Cohort) => Promise<void>` to the component interface

2. **Modify `src/components/admin/SFHAcceleratorManager.tsx`**
   - Create a `handlePostCohortToFeed` function that:
     - Gets the current authenticated user
     - Fetches the SFH accelerator profile data (already available in state)
     - Inserts a `feed_posts` row with `post_type: 'cohort'` and the full `cohort_data` object (cohort_id, name, description, deadline, funding, equity, enrollment_fee, industries, accelerator_name, accelerator_logo, accelerator_id, application_url)
   - Pass this handler as `onPostToFeed` to the `CohortManagement` component

No database changes needed -- the existing `feed_posts` table already supports `post_type = 'cohort'` and `cohort_data` JSONB.
