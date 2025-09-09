import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateEditLocationDialog } from './CreateEditLocationDialog';

export type Location = {
  id: number;
  name: string;
  created_at: string;
};

const fetchLocations = async (tenantId: number): Promise<Location[]> => {
  const { data, error } = await supabase
    .from('locations')
    .select('id, name, created_at')
    .eq('tenant_id', tenantId)
    .eq('is_archived', false)
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return data;
};

export const LocationsManager = () => {
  const { profile } = useSession();
  const tenantId = profile?.tenant_id;

  const [isDialogOpen, setDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  const { data: locations, isLoading } = useQuery({
    queryKey: ['locations', tenantId],
    queryFn: () => fetchLocations(tenantId!),
    enabled: !!tenantId,
  });
  
  const handleCreate = () => {
    setSelectedLocation(null);
    setDialogOpen(true);
  };

  const handleEdit = (location: Location) => {
    setSelectedLocation(location);
    setDialogOpen(true);
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={handleCreate}>Create New Location</Button>
      </div>
      <Card>
        <CardHeader><CardTitle>All Locations</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location Name</TableHead>
                <TableHead>Created On</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : (
                locations?.map((location) => (
                  <TableRow key={location.id}>
                    <TableCell className="font-medium">{location.name}</TableCell>
                    <TableCell>{format(new Date(location.created_at), 'PPP')}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(location)}>Edit</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {tenantId && (
        <CreateEditLocationDialog 
          isOpen={isDialogOpen}
          onOpenChange={setDialogOpen}
          location={selectedLocation}
          tenantId={tenantId}
        />
      )}
    </>
  );
};