import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CommunityStats {
  totalUsers: number;
  totalStartups: number;
  totalMentors: number;
  totalInvestors: number;
  totalStudents: number;
  activeConnections: number;
  totalInvestments: number;
  totalFundingRaised: number;
  totalEvents: number;
  totalSessions: number;
  totalMessages: number;
  totalPosts: number;
  totalEnrollments: number;
}

interface GrowthData {
  month: string;
  users: number;
  startups: number;
  investments: number;
}

interface IndustryData {
  name: string;
  value: number;
}

interface InvestmentData {
  startup: string;
  amount: number;
  date: string;
  investor: string;
}

interface ActivityData {
  day: string;
  messages: number;
  connections: number;
  events: number;
}

export const useCommunityAnalytics = () => {
  const [stats, setStats] = useState<CommunityStats>({
    totalUsers: 0,
    totalStartups: 0,
    totalMentors: 0,
    totalInvestors: 0,
    totalStudents: 0,
    activeConnections: 0,
    totalInvestments: 0,
    totalFundingRaised: 0,
    totalEvents: 0,
    totalSessions: 0,
    totalMessages: 0,
    totalPosts: 0,
    totalEnrollments: 0,
  });
  
  const [growthData, setGrowthData] = useState<GrowthData[]>([]);
  const [industryData, setIndustryData] = useState<IndustryData[]>([]);
  const [recentInvestments, setRecentInvestments] = useState<InvestmentData[]>([]);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch total users
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch startups
      const { count: startupsCount } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true });

      // Fetch mentors
      const { count: mentorsCount } = await supabase
        .from('mentor_profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch investors
      const { count: investorsCount } = await supabase
        .from('investor_profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch students
      const { count: studentsCount } = await supabase
        .from('student_profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch active connections
      const { count: connectionsCount } = await supabase
        .from('connections')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'accepted');

      // Fetch investments
      const { data: investments, count: investmentsCount } = await supabase
        .from('investments')
        .select('amount', { count: 'exact' });

      const totalFunding = investments?.reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0;

      // Fetch events
      const { count: eventsCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });

      // Fetch sessions
      const { count: sessionsCount } = await supabase
        .from('mentoring_sessions')
        .select('*', { count: 'exact', head: true });

      // Fetch messages
      const { count: messagesCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true });

      // Fetch posts
      const { count: postsCount } = await supabase
        .from('feed_posts')
        .select('*', { count: 'exact', head: true });

      // Fetch enrollments
      const { count: enrollmentsCount } = await supabase
        .from('course_enrollments')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalUsers: usersCount || 0,
        totalStartups: startupsCount || 0,
        totalMentors: mentorsCount || 0,
        totalInvestors: investorsCount || 0,
        totalStudents: studentsCount || 0,
        activeConnections: connectionsCount || 0,
        totalInvestments: investmentsCount || 0,
        totalFundingRaised: totalFunding,
        totalEvents: eventsCount || 0,
        totalSessions: sessionsCount || 0,
        totalMessages: messagesCount || 0,
        totalPosts: postsCount || 0,
        totalEnrollments: enrollmentsCount || 0,
      });

      // Fetch growth data by month
      await fetchGrowthData();
      
      // Fetch industry distribution
      await fetchIndustryData();
      
      // Fetch recent investments
      await fetchRecentInvestments();
      
      // Fetch weekly activity
      await fetchActivityData();

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGrowthData = async () => {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('created_at')
      .order('created_at', { ascending: true });

    const { data: companies } = await supabase
      .from('companies')
      .select('created_at')
      .order('created_at', { ascending: true });

    const { data: investments } = await supabase
      .from('investments')
      .select('created_at')
      .order('created_at', { ascending: true });

    // Group by month
    const monthlyData: { [key: string]: { users: number; startups: number; investments: number } } = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    profiles?.forEach((p) => {
      const date = new Date(p.created_at);
      const month = months[date.getMonth()];
      if (!monthlyData[month]) monthlyData[month] = { users: 0, startups: 0, investments: 0 };
      monthlyData[month].users++;
    });

    companies?.forEach((c) => {
      const date = new Date(c.created_at);
      const month = months[date.getMonth()];
      if (!monthlyData[month]) monthlyData[month] = { users: 0, startups: 0, investments: 0 };
      monthlyData[month].startups++;
    });

    investments?.forEach((i) => {
      const date = new Date(i.created_at);
      const month = months[date.getMonth()];
      if (!monthlyData[month]) monthlyData[month] = { users: 0, startups: 0, investments: 0 };
      monthlyData[month].investments++;
    });

    const growth = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      users: data.users,
      startups: data.startups,
      investments: data.investments,
    }));

    setGrowthData(growth.slice(-6)); // Last 6 months
  };

  const fetchIndustryData = async () => {
    const { data } = await supabase
      .from('companies')
      .select('industry');

    const industries: { [key: string]: number } = {};
    data?.forEach((company) => {
      const industry = company.industry || 'Other';
      industries[industry] = (industries[industry] || 0) + 1;
    });

    const industryArray = Object.entries(industries)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    setIndustryData(industryArray);
  };

  const fetchRecentInvestments = async () => {
    const { data } = await supabase
      .from('investments')
      .select(`
        amount,
        investment_date,
        company_id,
        investor_id
      `)
      .order('investment_date', { ascending: false })
      .limit(10);

    if (data) {
      const investmentsWithNames = await Promise.all(
        data.map(async (inv) => {
          const { data: company } = await supabase
            .from('companies')
            .select('name')
            .eq('id', inv.company_id)
            .single();

          const { data: investor } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', inv.investor_id)
            .single();

          return {
            startup: company?.name || 'Unknown',
            amount: inv.amount,
            date: new Date(inv.investment_date).toLocaleDateString(),
            investor: investor?.full_name || 'Anonymous',
          };
        })
      );

      setRecentInvestments(investmentsWithNames);
    }
  };

  const fetchActivityData = async () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    const activity = await Promise.all(
      last7Days.map(async (date, index) => {
        const startOfDay = new Date(date.setHours(0, 0, 0, 0)).toISOString();
        const endOfDay = new Date(date.setHours(23, 59, 59, 999)).toISOString();

        const { count: messagesCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startOfDay)
          .lte('created_at', endOfDay);

        const { count: connectionsCount } = await supabase
          .from('connections')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startOfDay)
          .lte('created_at', endOfDay);

        const { count: eventsCount } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startOfDay)
          .lte('created_at', endOfDay);

        return {
          day: days[index],
          messages: messagesCount || 0,
          connections: connectionsCount || 0,
          events: eventsCount || 0,
        };
      })
    );

    setActivityData(activity);
  };

  return {
    stats,
    growthData,
    industryData,
    recentInvestments,
    activityData,
    loading,
    refresh: fetchAnalytics,
  };
};
