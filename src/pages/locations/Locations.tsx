import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
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
import { CreateEditLocationDialog } from '@/components/locations/CreateEditLocationDialog';
import { showError, showSuccess } from '@/utils/toast';

export type Location = {
  id: number;
  name: string;
};

const fetchLocations = async (tenantId: number): Promise<Location[]> => {
  const { data, error } = await supabase
    .from('locations')
    .select('id, name')
    .eq('tenant_id', tenantId)
    .eq('is_archived', false)
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return data as Location[];
};

const LocationsPage = () => {
  const { profile } = useSession();
  const queryClient = useQueryClient();
  const tenantId = profile?.tenant_id;

  const [isCreateEditDialogOpen, setCreateEditDialogOpen] = useState(false);
  const [isArchiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: locations, isLoading } = useQuery({
    queryKey: ['locations', tenantId],
    queryFn: () => fetchLocations(tenantId!),
    enabled: !!tenantId,
  });

  const archiveMutation = useMutation({
    mutationFn: async (locationId: number) => {
      const { error } = await supabase.from('locations').update({ is_archived: true }).eq('id', locationId);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess('Location archived successfully.');
      queryClient.invalidateQueries({ queryKey: ['locations', tenantId] });
      setArchiveDialogOpen(false);
    },
    onError: (error) => {
      showError(`Failed to archive location: ${error.message}`);
    },
  });

  const handleEdit = (location: Location) => {
    setSelectedLocation(location);
    setCreateEditDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedLocation(null);
    setCreateEditDialogOpen(true);
  };

  const handleArchive = (location: Location) => {
    setSelectedLocation(location);
    setArchiveDialogOpen(true);
  };

  const filteredLocations = locations?.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <header className="flex justify-between items-center pb-4 mb-6 border-b">
        <div>
          <h1 className="text-3xl font-bold">Locations</h1>
          <p className="text-gray-600 mt-1">Manage labs, stockrooms, or other sub-units.</p>
        </div>
        <Button onClick={handleCreate}>Create New Location</Button>
      </header>

      <div className="mb-6">
        <Input
          placeholder="Search by name..."
          className="max-w-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location Name</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-36 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : (
                filteredLocations?.map((location) => (
                  <TableRow key={location.id}>
                    <TableCell className="font-medium">{location.name}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(location)}>Edit</Button>
                      <Button variant="outline" size="sm" onClick={() => handleArchive(location)}>Archive</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {tenantId && <CreateEditLocationDialog
        isOpen={isCreateEditDialogOpen}
        onOpenChange={setCreateEditDialogOpen}
        location={selectedLocation}
        tenantId={tenantId}
      />}

      <AlertDialog open={isArchiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Archiving this location will hide it from this list. This will not affect existing users or items in this location.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => selectedLocation && archiveMutation.mutate(selectedLocation.id)}>
              Confirm Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LocationsPage;