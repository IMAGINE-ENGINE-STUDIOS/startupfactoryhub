import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Demo user personas
const demoUsers = [
  // Startup Founders (6)
  { name: 'Alex Chen', role: 'startup', company: 'TechNova AI', industry: 'Artificial Intelligence', stage: 'seed', location: 'San Francisco, CA' },
  { name: 'Sarah Martinez', role: 'startup', company: 'GreenFlow', industry: 'CleanTech', stage: 'series_a', location: 'Austin, TX' },
  { name: 'David Park', role: 'startup', company: 'HealthPulse', industry: 'Healthcare', stage: 'pre_seed', location: 'Boston, MA' },
  { name: 'Emma Wilson', role: 'startup', company: 'FinanceBot', industry: 'FinTech', stage: 'seed', location: 'New York, NY' },
  { name: 'Marcus Johnson', role: 'startup', company: 'EduSpark', industry: 'EdTech', stage: 'pre_seed', location: 'Chicago, IL' },
  { name: 'Priya Sharma', role: 'startup', company: 'DataVault', industry: 'Cybersecurity', stage: 'seed', location: 'Seattle, WA' },
  // Investors (4)
  { name: 'James Morrison', role: 'investor', bio: 'Angel investor focused on AI and Healthcare startups. 15+ years in venture capital.' },
  { name: 'Lisa Thompson', role: 'investor', bio: 'VC Partner at Horizon Ventures. Passionate about Climate tech and AI innovation.' },
  { name: 'Robert Kim', role: 'investor', bio: 'Seed investor specializing in B2B SaaS and FinTech solutions.' },
  { name: 'Michelle Davis', role: 'investor', bio: 'Angel Network Lead. Consumer tech and marketplace enthusiast.' },
  // Mentors (3)
  { name: 'Dr. Michael Foster', role: 'mentor', bio: 'Former CTO with 20+ years tech leadership experience. Helping startups scale.' },
  { name: 'Jennifer Lee', role: 'mentor', bio: 'Serial entrepreneur with 3 successful exits. Product and growth specialist.' },
  { name: 'Thomas Brown', role: 'mentor', bio: 'Growth expert who has scaled 5 startups from 0 to 10M+ users.' },
  // Advisors (3)
  { name: 'Rachel Green', role: 'advisor', bio: 'Legal advisor specializing in startup law, fundraising, and IP protection.' },
  { name: 'Daniel White', role: 'advisor', bio: 'Finance advisor with CFO experience at multiple unicorn startups.' },
  { name: 'Olivia Taylor', role: 'advisor', bio: 'Marketing strategist and brand building expert for early-stage companies.' },
  // Students (3)
  { name: 'Jake Anderson', role: 'student', bio: 'MBA student at Stanford GSB. Focused on entrepreneurship and venture capital.' },
  { name: 'Sophia Chen', role: 'student', bio: 'CS graduate from MIT. Looking for tech internships at innovative startups.' },
  { name: 'Noah Williams', role: 'student', bio: 'Business student passionate about startups and product management.' },
  // Accelerator (1)
  { name: 'Innovation Labs', role: 'accelerator', bio: 'Demo accelerator program supporting early-stage tech startups.' },
];

// Sample post content
const demoPosts = [
  { type: 'update', content: "🚀 Excited to announce the launch of our AI-powered analytics platform! After 6 months of development, we're finally live. The future of data insights is here! #startup #AI #launch", hasImage: true },
  { type: 'update', content: "Just hit 10,000 users! 🎉 Huge thanks to our amazing team and early adopters who believed in us from day one. This is just the beginning of our journey!", hasImage: false },
  { type: 'update', content: "Our team after a successful demo day pitch! So grateful to work with these talented individuals who pour their hearts into building something meaningful. #teamwork #startuplife", hasImage: true },
  { type: 'update', content: "The future of healthcare is personalized AI. Here's what I've learned from 100 conversations with healthcare providers about their biggest pain points and how technology can help.", hasImage: false },
  { type: 'update', content: "Excited to share that we've just closed our seed round! 🌱 Thanks to all our investors who believe in our vision. Now the real work begins!", hasImage: true },
  { type: 'update', content: "Building a startup is a marathon, not a sprint. Today I'm reflecting on the lessons learned from our first year in business. Thread 🧵👇", hasImage: false },
  { type: 'update', content: "Our new office is finally ready! Moving from a garage to a real workspace feels like a huge milestone. Here's to many more late nights and early mornings! 🏢", hasImage: true },
  { type: 'update', content: "Just wrapped up an incredible mentorship session with @startups. The energy and ideas from these founders never cease to amaze me. The future is bright! 💡", hasImage: false },
  { type: 'update', content: "Product-market fit achieved! 📈 Our retention metrics are finally where we wanted them to be. Persistence pays off. Keep pushing, founders!", hasImage: true },
  { type: 'update', content: "Hiring is the hardest part of building a startup. Here are 5 things I wish I knew before making our first 10 hires:", hasImage: false },
  { type: 'update', content: "Launched our mobile app today! 📱 6 months of development, countless iterations, and finally it's in the hands of our users. Download link in bio!", hasImage: true },
  { type: 'update', content: "The best investment you can make is in your team's growth. Just announced unlimited learning budgets for all employees. Education should never be a barrier.", hasImage: false },
  { type: 'update', content: "Proud to announce our partnership with @TechGiant! This collaboration will help us scale faster and reach more customers globally. 🌍", hasImage: true },
  { type: 'update', content: "Working late on our investor deck. The coffee is strong, the vision is clear, and the opportunity is massive. Series A, here we come! ☕", hasImage: false },
  { type: 'update', content: "Customer feedback session today was eye-opening. Sometimes the best product insights come directly from the people using your product every day. Listen more, assume less.", hasImage: true },
  { type: 'update', content: "Just returned from TechCrunch Disrupt! Met so many incredible founders and investors. The startup ecosystem is truly a global community. 🌐", hasImage: true },
  { type: 'update', content: "Revenue milestone: We just crossed $1M ARR! 💰 Two years ago, this was just an idea on a whiteboard. Dreams do come true with hard work and the right team.", hasImage: false },
  { type: 'update', content: "Remote work tip: Create rituals that bring your team together. Our daily virtual coffee chats have been game-changing for team morale and culture. ☕💻", hasImage: false },
  { type: 'update', content: "Pivoting is not failing - it's learning. We just made a significant product pivot based on market feedback, and it feels liberating. Trust the process!", hasImage: true },
  { type: 'update', content: "Mentoring the next generation of entrepreneurs at the local university today. Their energy and fresh perspectives remind me why I love this ecosystem. 🎓", hasImage: true },
  { type: 'update', content: "Our customer success team is the unsung hero of our growth. Shoutout to the amazing people who turn customers into advocates every single day! 🌟", hasImage: false },
  { type: 'update', content: "Just got accepted into Y Combinator! 🚀 Can't believe this journey - from a dorm room idea to one of the most prestigious accelerators in the world. Let's go!", hasImage: true },
  { type: 'update', content: "Building in public update: Here's our honest metrics dashboard. Transparency builds trust, and we believe in sharing our journey - the ups and downs.", hasImage: true },
  { type: 'update', content: "The power of community: Our user Discord now has 5,000+ members helping each other succeed. This is bigger than any product feature we could build. 💬", hasImage: false },
  { type: 'update', content: "Friday wins: Closed 3 enterprise deals, shipped 2 major features, and hired our first VP of Engineering. What a week! 🎉", hasImage: false },
  { type: 'update', content: "Sustainability isn't just a buzzword for us - we're now carbon neutral! Every decision we make considers our environmental impact. 🌱🌍", hasImage: true },
  { type: 'update', content: "The hardest part of being a founder? Making decisions with incomplete information. But that's also what makes it exciting. Embrace uncertainty!", hasImage: false },
  { type: 'update', content: "Our team retreat in the mountains was exactly what we needed. Sometimes you have to step away from the keyboard to see the bigger picture. 🏔️", hasImage: true },
  { type: 'update', content: "Grateful for every investor who said 'no' before we found the right partners. Those rejections made our pitch and product 10x better. Keep going, founders!", hasImage: false },
  { type: 'update', content: "Breaking: We just announced our acquisition of @SmallStartup! Together, we'll be able to serve our customers even better. Excited for this new chapter! 🤝", hasImage: true },
];

// Unsplash image URLs for posts
const postImages = [
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800',
  'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800',
  'https://images.unsplash.com/photo-1531973576160-7125cd663d86?w=800',
  'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800',
  'https://images.unsplash.com/photo-1553028826-f4804a6dba3b?w=800',
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800',
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800',
  'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800',
  'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800',
  'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
  'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800',
];

// Company logos from Unsplash
const companyLogos = [
  'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200',
  'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=200',
  'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=200',
  'https://images.unsplash.com/photo-1614680376408-81e91ffe3db7?w=200',
  'https://images.unsplash.com/photo-1567095761054-7a02e69e5c43?w=200',
  'https://images.unsplash.com/photo-1614851099511-773084f6911d?w=200',
];

// Comments for engagement
const sampleComments = [
  "This is incredible! Congratulations on the launch! 🚀",
  "Love seeing this kind of progress. Keep up the great work!",
  "Such an inspiring journey. Thanks for sharing!",
  "Congrats! Would love to connect and learn more.",
  "This resonates so much with my own experience. Great insights!",
  "Amazing milestone! The future looks bright for you all.",
  "This is exactly what the industry needs. Well done!",
  "Great to see such transparency. Following your journey closely!",
  "Impressive growth! What's the secret sauce?",
  "Bookmarked this for later. So many valuable takeaways!",
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { action } = await req.json();

    if (action === 'clear') {
      console.log('Clearing demo data...');
      
      // Delete demo posts (those with [DEMO] marker in content)
      const { error: postsError } = await supabase
        .from('feed_posts')
        .delete()
        .ilike('content', '%[DEMO]%');
      
      if (postsError) console.error('Error deleting demo posts:', postsError);

      // Delete demo profiles (those with [DEMO] marker in bio)
      const { data: demoProfiles } = await supabase
        .from('profiles')
        .select('user_id')
        .ilike('bio', '%[DEMO]%');

      if (demoProfiles && demoProfiles.length > 0) {
        const demoUserIds = demoProfiles.map(p => p.user_id);
        
        // Delete related data
        await supabase.from('companies').delete().in('user_id', demoUserIds);
        await supabase.from('investor_profiles').delete().in('user_id', demoUserIds);
        await supabase.from('mentor_profiles').delete().in('user_id', demoUserIds);
        await supabase.from('user_roles').delete().in('user_id', demoUserIds);
        await supabase.from('profiles').delete().in('user_id', demoUserIds);
        
        // Delete auth users
        for (const userId of demoUserIds) {
          await supabase.auth.admin.deleteUser(userId);
        }
      }

      return new Response(JSON.stringify({ success: true, message: 'Demo data cleared' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'seed') {
      console.log('Seeding demo data...');

      // Fetch random profile images
      const randomUserResponse = await fetch('https://randomuser.me/api/?results=20&nat=us,gb,de,fr');
      const randomUserData = await randomUserResponse.json();
      const randomUsers = randomUserData.results;

      const createdUserIds: string[] = [];
      const startupUserIds: string[] = [];

      // Create demo users
      for (let i = 0; i < demoUsers.length; i++) {
        const persona = demoUsers[i];
        const randomUser = randomUsers[i];
        const email = `demo.${persona.name.toLowerCase().replace(/\s+/g, '.')}@example.com`;
        
        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email,
          password: 'demo123456',
          email_confirm: true,
          user_metadata: {
            full_name: persona.name,
            role: persona.role
          }
        });

        if (authError) {
          console.error(`Error creating user ${persona.name}:`, authError);
          continue;
        }

        const userId = authData.user.id;
        createdUserIds.push(userId);

        if (persona.role === 'startup') {
          startupUserIds.push(userId);
        }

        // Update profile with avatar and demo marker
        const bio = persona.bio || `${persona.role === 'startup' ? `Founder of ${persona.company}. Building the future of ${persona.industry}.` : ''} [DEMO]`;
        
        await supabase.from('profiles').update({
          full_name: persona.name,
          avatar_url: randomUser?.picture?.large || null,
          bio,
          location: persona.location || randomUser?.location?.city + ', ' + randomUser?.location?.country,
          email
        }).eq('user_id', userId);

        // Create role
        await supabase.from('user_roles').upsert({
          user_id: userId,
          role: persona.role
        }, { onConflict: 'user_id,role' });

        // Create role-specific profile
        if (persona.role === 'startup' && persona.company) {
          await supabase.from('companies').insert({
            user_id: userId,
            name: persona.company,
            industry: persona.industry,
            stage: persona.stage,
            location: persona.location,
            description: `${persona.company} is a ${persona.industry} startup revolutionizing the industry with innovative solutions.`,
            logo_url: companyLogos[Math.floor(Math.random() * companyLogos.length)],
            founded_year: 2022 + Math.floor(Math.random() * 3),
            team_size: 5 + Math.floor(Math.random() * 20)
          });
        } else if (persona.role === 'investor') {
          await supabase.from('investor_profiles').upsert({
            user_id: userId,
            investment_focus: ['AI', 'Healthcare', 'FinTech', 'CleanTech'].slice(0, 2 + Math.floor(Math.random() * 2)),
            preferred_stages: ['pre_seed', 'seed', 'series_a'].slice(0, 1 + Math.floor(Math.random() * 2)),
            typical_investment_range: '$50K - $500K',
            portfolio_size: Math.floor(Math.random() * 20)
          }, { onConflict: 'user_id' });
        } else if (persona.role === 'mentor') {
          await supabase.from('mentor_profiles').upsert({
            user_id: userId,
            expertise: ['Product', 'Growth', 'Fundraising', 'Engineering'].slice(0, 2 + Math.floor(Math.random() * 2)),
            availability_hours: 5 + Math.floor(Math.random() * 10),
            total_sessions: Math.floor(Math.random() * 50)
          }, { onConflict: 'user_id' });
        }

        console.log(`Created demo user: ${persona.name} (${persona.role})`);
      }

      // Create demo posts
      let imageIndex = 0;
      for (let i = 0; i < demoPosts.length; i++) {
        const post = demoPosts[i];
        const randomUserId = createdUserIds[Math.floor(Math.random() * createdUserIds.length)];
        
        const mediaUrls = post.hasImage ? [postImages[imageIndex++ % postImages.length]] : null;
        
        // Add [DEMO] marker at the end of content
        const content = post.content + ' [DEMO]';
        
        const { data: postData, error: postError } = await supabase.from('feed_posts').insert({
          user_id: randomUserId,
          content,
          post_type: 'update',
          media_urls: mediaUrls,
          likes_count: Math.floor(Math.random() * 50) + 5,
          comments_count: Math.floor(Math.random() * 10),
          created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        }).select().single();

        if (postError) {
          console.error('Error creating post:', postError);
          continue;
        }

        // Add some likes
        const numLikes = Math.floor(Math.random() * 10) + 2;
        for (let j = 0; j < numLikes && j < createdUserIds.length; j++) {
          const likerUserId = createdUserIds[(i + j) % createdUserIds.length];
          if (likerUserId !== randomUserId) {
            await supabase.from('post_likes').insert({
              post_id: postData.id,
              user_id: likerUserId
            }).catch(() => {}); // Ignore duplicate likes
          }
        }

        // Add some comments
        const numComments = Math.floor(Math.random() * 3);
        for (let j = 0; j < numComments; j++) {
          const commenterUserId = createdUserIds[(i + j + 1) % createdUserIds.length];
          if (commenterUserId !== randomUserId) {
            await supabase.from('post_comments').insert({
              post_id: postData.id,
              user_id: commenterUserId,
              content: sampleComments[Math.floor(Math.random() * sampleComments.length)]
            }).catch(() => {});
          }
        }
      }

      // Create follow relationships
      for (const userId of createdUserIds) {
        const numFollows = 3 + Math.floor(Math.random() * 5);
        for (let i = 0; i < numFollows; i++) {
          const targetUserId = createdUserIds[Math.floor(Math.random() * createdUserIds.length)];
          if (targetUserId !== userId) {
            await supabase.from('follows').insert({
              follower_id: userId,
              following_id: targetUserId
            }).catch(() => {}); // Ignore duplicates
          }
        }
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Demo data seeded successfully',
        stats: {
          users: createdUserIds.length,
          posts: demoPosts.length
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get demo stats
    if (action === 'stats') {
      const { count: demoUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .ilike('bio', '%[DEMO]%');

      const { count: demoPosts } = await supabase
        .from('feed_posts')
        .select('*', { count: 'exact', head: true })
        .ilike('content', '%[DEMO]%');

      const { count: demoCompanies } = await supabase
        .from('companies')
        .select('*, profiles!inner(*)', { count: 'exact', head: true })
        .ilike('profiles.bio', '%[DEMO]%');

      return new Response(JSON.stringify({
        success: true,
        stats: {
          users: demoUsers || 0,
          posts: demoPosts || 0,
          companies: demoCompanies || 0
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
