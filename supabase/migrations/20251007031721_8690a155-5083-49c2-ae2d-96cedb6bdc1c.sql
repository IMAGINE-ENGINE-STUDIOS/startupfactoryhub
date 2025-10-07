-- Create leaderboard_entries table for Student Dashboard
CREATE TABLE IF NOT EXISTS public.leaderboard_entries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    points integer NOT NULL DEFAULT 0,
    rank integer,
    achievements_count integer DEFAULT 0,
    courses_completed integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(user_id)
);

-- Create study_groups table
CREATE TABLE IF NOT EXISTS public.study_groups (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    category text NOT NULL,
    created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    max_members integer DEFAULT 10,
    is_public boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create study_group_members table
CREATE TABLE IF NOT EXISTS public.study_group_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id uuid REFERENCES public.study_groups(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role text DEFAULT 'member' NOT NULL,
    joined_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(group_id, user_id)
);

-- Create endorsements table for Mentor Dashboard
CREATE TABLE IF NOT EXISTS public.endorsements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    mentor_id uuid NOT NULL,
    endorser_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    skill text NOT NULL,
    comment text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(mentor_id, endorser_id, skill)
);

-- Create resource_bookmarks table
CREATE TABLE IF NOT EXISTS public.resource_bookmarks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    resource_id uuid REFERENCES public.resources(id) ON DELETE CASCADE NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(user_id, resource_id)
);

-- Enable RLS
ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.endorsements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leaderboard_entries
CREATE POLICY "Anyone can view leaderboard"
ON public.leaderboard_entries FOR SELECT
TO authenticated USING (true);

CREATE POLICY "Users can update their own entry"
ON public.leaderboard_entries FOR UPDATE
TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own entry"
ON public.leaderboard_entries FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

-- RLS Policies for study_groups
CREATE POLICY "Anyone can view public groups"
ON public.study_groups FOR SELECT
TO authenticated USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create groups"
ON public.study_groups FOR INSERT
TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group creators can update their groups"
ON public.study_groups FOR UPDATE
TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "Group creators can delete their groups"
ON public.study_groups FOR DELETE
TO authenticated USING (auth.uid() = created_by);

-- RLS Policies for study_group_members
CREATE POLICY "Anyone can view group members"
ON public.study_group_members FOR SELECT
TO authenticated USING (true);

CREATE POLICY "Users can join groups"
ON public.study_group_members FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups"
ON public.study_group_members FOR DELETE
TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for endorsements
CREATE POLICY "Anyone can view endorsements"
ON public.endorsements FOR SELECT
TO authenticated USING (true);

CREATE POLICY "Users can create endorsements"
ON public.endorsements FOR INSERT
TO authenticated WITH CHECK (auth.uid() = endorser_id);

CREATE POLICY "Users can delete their own endorsements"
ON public.endorsements FOR DELETE
TO authenticated USING (auth.uid() = endorser_id);

-- RLS Policies for resource_bookmarks
CREATE POLICY "Users can view their own bookmarks"
ON public.resource_bookmarks FOR SELECT
TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own bookmarks"
ON public.resource_bookmarks FOR ALL
TO authenticated USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_leaderboard_entries_updated_at
BEFORE UPDATE ON public.leaderboard_entries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_study_groups_updated_at
BEFORE UPDATE ON public.study_groups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();