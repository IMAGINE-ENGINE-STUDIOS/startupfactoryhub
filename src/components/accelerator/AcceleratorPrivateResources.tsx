import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, 
  Lock, 
  ExternalLink, 
  Copy, 
  Edit2, 
  Trash2, 
  Share2,
  Gift,
  Tag
} from 'lucide-react';
import { useAcceleratorPrivateResources, AcceleratorResource } from '@/hooks/useAcceleratorPrivateResources';
import { AddPrivateResourceDialog } from './AddPrivateResourceDialog';
import { ShareResourceDialog } from './ShareResourceDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export const AcceleratorPrivateResources = () => {
  const { resources, loading, deleteResource } = useAcceleratorPrivateResources();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editResource, setEditResource] = useState<AcceleratorResource | null>(null);
  const [shareResource, setShareResource] = useState<AcceleratorResource | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const copyPromoCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Promo code copied!');
  };

  const handleDelete = async () => {
    if (deleteConfirm) {
      await deleteResource(deleteConfirm);
      setDeleteConfirm(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/20">
            <Lock className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Program Resources</h2>
            <p className="text-sm text-muted-foreground">
              Exclusive resources for your cohort startups
            </p>
          </div>
        </div>
        <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Resource
        </Button>
      </div>

      {/* Resources Grid */}
      {resources.length === 0 ? (
        <Card className="tech-card border-0">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Gift className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Private Resources Yet</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              Add exclusive resources, perks, and discounts that only your cohort startups can access.
            </p>
            <Button onClick={() => setAddDialogOpen(true)} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Resource
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map(resource => (
            <Card key={resource.id} className="tech-card border-0 flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {resource.logo_url ? (
                      <img 
                        src={resource.logo_url} 
                        alt={resource.title}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <Gift className="h-5 w-5 text-emerald-400" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-base">{resource.title}</CardTitle>
                      <Badge variant="outline" className="text-xs mt-1">
                        {resource.resource_type}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col">
                {resource.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {resource.description}
                  </p>
                )}

                {/* Promo Code */}
                {resource.promo_code && (
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="h-4 w-4 text-emerald-400" />
                    <code className="text-sm bg-emerald-500/10 px-2 py-0.5 rounded text-emerald-400">
                      {resource.promo_code}
                    </code>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-6 w-6"
                      onClick={() => copyPromoCode(resource.promo_code!)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                )}

                {resource.discount_details && (
                  <p className="text-xs text-amber-400 mb-3">
                    {resource.discount_details}
                  </p>
                )}

                {/* Cohort Access */}
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-1">Shared with:</p>
                  <div className="flex flex-wrap gap-1">
                    {resource.cohort_access && resource.cohort_access.length > 0 ? (
                      resource.cohort_access.map(access => (
                        <Badge key={access.cohort_id} variant="secondary" className="text-xs">
                          {access.cohort_name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No cohorts</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-auto pt-3 border-t border-border/50">
                  {resource.website_url && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="gap-1"
                      onClick={() => window.open(resource.website_url!, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3" />
                      Visit
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => setShareResource(resource)}
                  >
                    <Share2 className="h-3 w-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => setEditResource(resource)}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteConfirm(resource.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <AddPrivateResourceDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
      />

      <AddPrivateResourceDialog
        open={!!editResource}
        onOpenChange={(open) => !open && setEditResource(null)}
        editResource={editResource}
      />

      <ShareResourceDialog
        open={!!shareResource}
        onOpenChange={(open) => !open && setShareResource(null)}
        resource={shareResource}
      />

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="tech-card border-0">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resource?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this resource and remove access from all cohorts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
