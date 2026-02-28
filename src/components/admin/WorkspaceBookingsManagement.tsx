import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { CalendarIcon, Clock, Building2, Check, X, AlertTriangle, RefreshCw, User } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from '@/hooks/use-toast';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  confirmed: { label: 'Confirmed', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  needs_action: { label: 'Needs Action', className: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
  cancelled: { label: 'Cancelled', className: 'bg-red-500/10 text-red-600 border-red-500/20' },
};

export default function WorkspaceBookingsManagement() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionBooking, setActionBooking] = useState<any | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionType, setActionType] = useState<'confirm' | 'flag' | 'cancel' | null>(null);
  const [saving, setSaving] = useState(false);
  const [userMap, setUserMap] = useState<Record<string, any>>({});

  const fetchBookings = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('hub_bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Enrich with user names
      const userIds = [...new Set((data || []).map(b => b.user_id))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, email')
          .in('user_id', userIds);
        if (profiles) {
          setUserMap(Object.fromEntries(profiles.map(p => [p.user_id, p])));
        }
      }

      setBookings(data || []);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const handleAction = async () => {
    if (!actionBooking || !actionType) return;
    setSaving(true);

    const newStatus = actionType === 'confirm' ? 'confirmed' : actionType === 'flag' ? 'needs_action' : 'cancelled';

    try {
      const { error } = await supabase
        .from('hub_bookings')
        .update({
          status: newStatus,
          admin_notes: adminNotes || null,
        })
        .eq('id', actionBooking.id);

      if (error) throw error;

      const userName = userMap[actionBooking.user_id]?.full_name || 'User';
      toast({
        title: `Booking ${newStatus === 'confirmed' ? 'approved' : newStatus === 'needs_action' ? 'flagged' : 'rejected'}`,
        description: `Booking for ${userName} has been updated.`,
      });

      setActionBooking(null);
      setAdminNotes('');
      setActionType(null);
      fetchBookings();
    } catch (err) {
      console.error('Error updating booking:', err);
      toast({ title: 'Error', description: 'Failed to update booking.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const openAction = (booking: any, type: 'confirm' | 'flag' | 'cancel') => {
    setActionBooking(booking);
    setActionType(type);
    setAdminNotes(booking.admin_notes || '');
  };

  const pendingCount = bookings.filter(b => b.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6 text-teal-500" />
            Workspace Bookings
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage Regus workspace booking requests
            {pendingCount > 0 && (
              <Badge className="ml-2 bg-amber-500/10 text-amber-600 border-amber-500/20 border">{pendingCount} pending</Badge>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="needs_action">Needs Action</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" onClick={fetchBookings}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
        </div>
      ) : bookings.length === 0 ? (
        <Card className="tech-card border-0">
          <CardContent className="py-16 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
            <h3 className="text-lg font-semibold mb-1">No bookings found</h3>
            <p className="text-sm text-muted-foreground">No workspace booking requests match the current filter.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {bookings.map(booking => {
            const config = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
            const profile = userMap[booking.user_id];
            return (
              <Card key={booking.id} className="tech-card border-0">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0">
                          <Building2 className="h-4 w-4 text-teal-500" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-sm">{booking.venue_name}</h4>
                          <p className="text-xs text-muted-foreground">{booking.workspace_type}</p>
                        </div>
                        <Badge className={`${config.className} border text-xs shrink-0`}>{config.label}</Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pl-12">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {profile?.full_name || 'Unknown'} ({profile?.email || ''})
                        </div>
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          {format(parseISO(booking.from_datetime), 'MMM d, yyyy')}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(parseISO(booking.from_datetime), 'HH:mm')} – {format(parseISO(booking.to_datetime), 'HH:mm')}
                        </div>
                      </div>

                      {booking.notes && (
                        <p className="text-xs text-muted-foreground pl-12 line-clamp-1">
                          <span className="font-medium">User note:</span> {booking.notes}
                        </p>
                      )}
                      {booking.admin_notes && (
                        <p className="text-xs text-orange-600 pl-12 line-clamp-1">
                          <span className="font-medium">Admin note:</span> {booking.admin_notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pl-12 lg:pl-0">
                      {booking.status === 'pending' && (
                        <>
                          <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10" onClick={() => openAction(booking, 'confirm')}>
                            <Check className="h-3.5 w-3.5 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" className="text-orange-600 border-orange-500/30 hover:bg-orange-500/10" onClick={() => openAction(booking, 'flag')}>
                            <AlertTriangle className="h-3.5 w-3.5 mr-1" /> Flag
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 border-red-500/30 hover:bg-red-500/10" onClick={() => openAction(booking, 'cancel')}>
                            <X className="h-3.5 w-3.5 mr-1" /> Reject
                          </Button>
                        </>
                      )}
                      {booking.status !== 'pending' && (
                        <Button size="sm" variant="ghost" className="text-xs" onClick={() => openAction(booking, booking.status === 'cancelled' ? 'confirm' : 'cancel')}>
                          Change Status
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Action Dialog */}
      <Dialog open={!!actionBooking && !!actionType} onOpenChange={(open) => { if (!open) { setActionBooking(null); setActionType(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'confirm' ? '✅ Approve Booking' : actionType === 'flag' ? '⚠️ Flag Booking' : '❌ Reject Booking'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'confirm' && 'Confirm this workspace booking request.'}
              {actionType === 'flag' && 'Flag this booking as needing further action.'}
              {actionType === 'cancel' && 'Reject and cancel this booking request.'}
            </DialogDescription>
          </DialogHeader>

          {actionBooking && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-3 space-y-1 text-sm">
                <p className="font-medium">{actionBooking.venue_name}</p>
                <p className="text-xs text-muted-foreground">
                  {userMap[actionBooking.user_id]?.full_name || 'User'} • {format(parseISO(actionBooking.from_datetime), 'MMM d, yyyy HH:mm')}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Admin Notes (optional)</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add a note for the user..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setActionBooking(null); setActionType(null); }}>Cancel</Button>
                <Button onClick={handleAction} disabled={saving}>
                  {saving ? 'Saving...' : actionType === 'confirm' ? 'Approve' : actionType === 'flag' ? 'Flag' : 'Reject'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
