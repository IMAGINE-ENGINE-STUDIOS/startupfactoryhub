import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings,
  AlertTriangle,
  Mail,
  Key,
  ToggleLeft,
  RefreshCw,
  Eye,
  EyeOff,
  Save,
  Loader2
} from 'lucide-react';

interface PlatformSettings {
  maintenanceMode: boolean;
  userRegistration: boolean;
  emailNotifications: boolean;
  guestPosting: boolean;
  publicProfiles: boolean;
  apiRateLimiting: boolean;
}

interface FeatureFlags {
  aiFeatures: boolean;
  videoConferencing: boolean;
  resourcesGlobe: boolean;
  marketIntelligence: boolean;
  startupScoring: boolean;
  cohortManagement: boolean;
}

interface EmailTemplates {
  welcomeSubject: string;
  welcomeBody: string;
  notificationSubject: string;
  notificationBody: string;
}

const AdminSettings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState(false);
  
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>({
    maintenanceMode: false,
    userRegistration: true,
    emailNotifications: true,
    guestPosting: true,
    publicProfiles: true,
    apiRateLimiting: true
  });

  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>({
    aiFeatures: true,
    videoConferencing: true,
    resourcesGlobe: true,
    marketIntelligence: true,
    startupScoring: true,
    cohortManagement: true
  });

  const [emailTemplates, setEmailTemplates] = useState<EmailTemplates>({
    welcomeSubject: '🚀 Welcome to Startup Factory Hub!',
    welcomeBody: 'Thank you for joining our platform. Get started by completing your profile.',
    notificationSubject: '[Startup Factory Hub] {title}',
    notificationBody: '{message}'
  });

  const apiKeys = [
    { name: 'SUPABASE_URL', value: 'https://zqiihhmd...', masked: true },
    { name: 'WHEREBY_API_KEY', value: 'eyJhbG...', masked: true },
    { name: 'WEBZ_API_TOKEN', value: 'a1b2c3...', masked: true },
    { name: 'LOVABLE_API_KEY', value: 'lov_...', masked: true },
    { name: 'RESEND_API_KEY', value: 're_...', masked: true }
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data: settings, error } = await supabase
        .from('admin_settings')
        .select('*');

      if (error) throw error;

      // Parse settings from database
      settings?.forEach((setting: any) => {
        const value = setting.setting_value;
        
        switch (setting.setting_key) {
          case 'platform_settings':
            setPlatformSettings(prev => ({ ...prev, ...value }));
            break;
          case 'feature_flags':
            setFeatureFlags(prev => ({ ...prev, ...value }));
            break;
          case 'email_templates':
            setEmailTemplates(prev => ({ ...prev, ...value }));
            break;
        }
      });
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSetting = async (key: string, value: any, description: string) => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          setting_key: key,
          setting_value: value,
          description,
          updated_by: user?.id,
          updated_at: new Date().toISOString()
        }, { onConflict: 'setting_key' });

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: `${description} updated successfully.`
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePlatformSettings = () => {
    saveSetting('platform_settings', platformSettings, 'Platform settings');
  };

  const handleSaveFeatureFlags = () => {
    saveSetting('feature_flags', featureFlags, 'Feature flags');
  };

  const handleSaveEmailTemplates = () => {
    saveSetting('email_templates', emailTemplates, 'Email templates');
  };

  const handleClearCache = () => {
    localStorage.clear();
    sessionStorage.clear();
    toast({
      title: "Cache Cleared",
      description: "All local cache has been cleared."
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="platform" className="w-full">
        <TabsList className="tech-card border-0 p-1 grid grid-cols-4 h-auto gap-1">
          <TabsTrigger value="platform" className="flex items-center gap-2 py-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Platform</span>
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2 py-2">
            <ToggleLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Features</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2 py-2">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Email</span>
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2 py-2">
            <Key className="h-4 w-4" />
            <span className="hidden sm:inline">API Keys</span>
          </TabsTrigger>
        </TabsList>

        {/* Platform Settings */}
        <TabsContent value="platform" className="space-y-6 mt-6">
          <Card className="tech-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Platform Configuration
              </CardTitle>
              <CardDescription>Control core platform behavior and access</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(platformSettings).map(([key, value]) => {
                const labels: Record<string, { title: string; desc: string }> = {
                  maintenanceMode: { title: 'Maintenance Mode', desc: 'Temporarily disable access to the platform' },
                  userRegistration: { title: 'User Registration', desc: 'Allow new users to register' },
                  emailNotifications: { title: 'Email Notifications', desc: 'Send system email notifications' },
                  guestPosting: { title: 'Guest Posting', desc: 'Allow guests to post on the blog' },
                  publicProfiles: { title: 'Public Profiles', desc: 'Make user profiles publicly viewable' },
                  apiRateLimiting: { title: 'API Rate Limiting', desc: 'Enable rate limiting on API endpoints' }
                };
                const label = labels[key];
                
                return (
                  <div key={key} className="flex items-center justify-between p-4 rounded-lg border border-border/50">
                    <div>
                      <p className="font-medium">{label.title}</p>
                      <p className="text-sm text-muted-foreground">{label.desc}</p>
                    </div>
                    <Switch
                      checked={value}
                      onCheckedChange={(checked) => 
                        setPlatformSettings(prev => ({ ...prev, [key]: checked }))
                      }
                    />
                  </div>
                );
              })}
              
              <Button onClick={handleSavePlatformSettings} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Settings
              </Button>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="tech-card border-0 border-red-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>Irreversible and destructive actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button 
                  variant="outline" 
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                  onClick={handleClearCache}
                >
                  Clear All Cache
                </Button>
                <Button 
                  variant="outline" 
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                  disabled
                >
                  Reset Platform Stats
                </Button>
                <Button 
                  variant="outline" 
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                  disabled
                >
                  Purge Inactive Users
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feature Flags */}
        <TabsContent value="features" className="space-y-6 mt-6">
          <Card className="tech-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ToggleLeft className="h-5 w-5" />
                Feature Flags
              </CardTitle>
              <CardDescription>Enable or disable specific platform features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(featureFlags).map(([key, value]) => {
                const labels: Record<string, { title: string; desc: string }> = {
                  aiFeatures: { title: 'AI Features', desc: 'Enable AI-powered tools and recommendations' },
                  videoConferencing: { title: 'Video Conferencing', desc: 'Enable Whereby video meetings' },
                  resourcesGlobe: { title: 'Resources Globe', desc: 'Enable 3D resource map' },
                  marketIntelligence: { title: 'Market Intelligence', desc: 'Enable market predictions and news' },
                  startupScoring: { title: 'Startup Scoring', desc: 'Enable startup scoring system' },
                  cohortManagement: { title: 'Cohort Management', desc: 'Enable accelerator cohort features' }
                };
                const label = labels[key];
                
                return (
                  <div key={key} className="flex items-center justify-between p-4 rounded-lg border border-border/50">
                    <div>
                      <p className="font-medium">{label.title}</p>
                      <p className="text-sm text-muted-foreground">{label.desc}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={value ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                        {value ? 'Enabled' : 'Disabled'}
                      </Badge>
                      <Switch
                        checked={value}
                        onCheckedChange={(checked) => 
                          setFeatureFlags(prev => ({ ...prev, [key]: checked }))
                        }
                      />
                    </div>
                  </div>
                );
              })}
              
              <Button onClick={handleSaveFeatureFlags} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Feature Flags
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Templates */}
        <TabsContent value="email" className="space-y-6 mt-6">
          <Card className="tech-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Templates
              </CardTitle>
              <CardDescription>Customize system email templates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label>Welcome Email Subject</Label>
                  <Input
                    value={emailTemplates.welcomeSubject}
                    onChange={(e) => setEmailTemplates(prev => ({ ...prev, welcomeSubject: e.target.value }))}
                    className="tech-card border-0 mt-1"
                  />
                </div>
                <div>
                  <Label>Welcome Email Body</Label>
                  <Textarea
                    value={emailTemplates.welcomeBody}
                    onChange={(e) => setEmailTemplates(prev => ({ ...prev, welcomeBody: e.target.value }))}
                    className="tech-card border-0 mt-1"
                    rows={4}
                  />
                </div>
                <div>
                  <Label>Notification Email Subject</Label>
                  <Input
                    value={emailTemplates.notificationSubject}
                    onChange={(e) => setEmailTemplates(prev => ({ ...prev, notificationSubject: e.target.value }))}
                    className="tech-card border-0 mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Use {'{title}'} for dynamic title</p>
                </div>
                <div>
                  <Label>Notification Email Body</Label>
                  <Textarea
                    value={emailTemplates.notificationBody}
                    onChange={(e) => setEmailTemplates(prev => ({ ...prev, notificationBody: e.target.value }))}
                    className="tech-card border-0 mt-1"
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Use {'{message}'} for dynamic message</p>
                </div>
              </div>
              
              <Button onClick={handleSaveEmailTemplates} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Templates
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys */}
        <TabsContent value="api" className="space-y-6 mt-6">
          <Card className="tech-card border-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    API Keys
                  </CardTitle>
                  <CardDescription>View configured API keys (read-only)</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowApiKeys(!showApiKeys)}
                  className="tech-card border-0"
                >
                  {showApiKeys ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                  {showApiKeys ? 'Hide' : 'Show'} Keys
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {apiKeys.map((key) => (
                  <div key={key.name} className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                    <div>
                      <p className="font-mono text-sm font-medium">{key.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-500/20 text-green-400">
                        Configured
                      </Badge>
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                        {showApiKeys ? key.value : '••••••••'}
                      </code>
                    </div>
                  </div>
                ))}
              </div>
              
              <p className="text-sm text-muted-foreground mt-4">
                API keys are managed through Supabase Edge Function secrets. 
                <a href="https://supabase.com/dashboard/project/zqiihhmdsdgwdcwmryym/settings/functions" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="text-primary hover:underline ml-1"
                >
                  Manage in Supabase Dashboard
                </a>
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;
