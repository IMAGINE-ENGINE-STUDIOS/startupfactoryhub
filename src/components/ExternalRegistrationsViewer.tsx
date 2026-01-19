import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Search, Users, Mail, Phone, Building, Calendar, MoreVertical, Check, X, Download, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface ExternalRegistration {
  id: string;
  event_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  notes: string | null;
  status: string;
  created_at: string;
}

interface ExternalRegistrationsViewerProps {
  eventId: string;
  eventTitle: string;
}

export function ExternalRegistrationsViewer({ eventId, eventTitle }: ExternalRegistrationsViewerProps) {
  const [registrations, setRegistrations] = useState<ExternalRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchRegistrations();

    const channel = supabase
      .channel(`external-registrations-${eventId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'event_external_registrations',
        filter: `event_id=eq.${eventId}`
      }, () => {
        fetchRegistrations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  const fetchRegistrations = async () => {
    try {
      const { data, error } = await supabase
        .from('event_external_registrations')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRegistrations(data || []);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast({ title: 'Failed to load registrations', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: 'registered' | 'attended' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('event_external_registrations')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      toast({ title: `Status updated to ${status}` });
      fetchRegistrations();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({ title: 'Failed to update status', variant: 'destructive' });
    }
  };

  const deleteRegistration = async (id: string) => {
    try {
      const { error } = await supabase
        .from('event_external_registrations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Registration removed' });
      fetchRegistrations();
    } catch (error) {
      console.error('Error deleting registration:', error);
      toast({ title: 'Failed to remove registration', variant: 'destructive' });
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Company', 'Notes', 'Status', 'Registered At'];
    const rows = registrations.map(r => [
      r.full_name,
      r.email,
      r.phone || '',
      r.company || '',
      r.notes || '',
      r.status,
      format(parseISO(r.created_at), 'yyyy-MM-dd HH:mm')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${eventTitle.replace(/[^a-z0-9]/gi, '_')}_registrations.csv`;
    link.click();
    toast({ title: 'Registrations exported!' });
  };

  const filteredRegistrations = registrations.filter(r =>
    r.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusCounts = {
    registered: registrations.filter(r => r.status === 'registered').length,
    attended: registrations.filter(r => r.status === 'attended').length,
    cancelled: registrations.filter(r => r.status === 'cancelled').length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'registered':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Registered</Badge>;
      case 'attended':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Attended</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">{statusCounts.registered}</p>
            <p className="text-xs text-muted-foreground">Registered</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-400">{statusCounts.attended}</p>
            <p className="text-xs text-muted-foreground">Attended</p>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-400">{statusCounts.cancelled}</p>
            <p className="text-xs text-muted-foreground">Cancelled</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Export */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" onClick={exportToCSV} disabled={registrations.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Registrations Table */}
      {filteredRegistrations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? 'No registrations match your search' : 'No external registrations yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistrations.map((registration) => (
                  <TableRow key={registration.id}>
                    <TableCell>
                      <div className="font-medium">{registration.full_name}</div>
                      {registration.notes && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{registration.notes}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <a href={`mailto:${registration.email}`} className="text-primary hover:underline">
                            {registration.email}
                          </a>
                        </div>
                        {registration.phone && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span>{registration.phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {registration.company && (
                        <div className="flex items-center gap-1 text-sm">
                          <Building className="h-3 w-3 text-muted-foreground" />
                          <span>{registration.company}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(registration.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(parseISO(registration.created_at), 'MMM d, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => updateStatus(registration.id, 'attended')}>
                            <Check className="h-4 w-4 mr-2 text-green-500" />
                            Mark as Attended
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus(registration.id, 'registered')}>
                            <Users className="h-4 w-4 mr-2 text-blue-500" />
                            Mark as Registered
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus(registration.id, 'cancelled')}>
                            <X className="h-4 w-4 mr-2 text-red-500" />
                            Mark as Cancelled
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => deleteRegistration(registration.id)}
                            className="text-red-500"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Remove Registration
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>
      )}
    </div>
  );
}
