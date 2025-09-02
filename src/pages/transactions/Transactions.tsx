import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';

import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { showError, showSuccess } from '@/utils/toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

// Schema for the transaction form
const transactionSchema = z.object({
  itemId: z.string().min(1, 'Please select an item.'),
  type: z.enum(['INBOUND', 'OUTBOUND']),
  quantity: z.coerce.number().int().positive('Quantity must be a positive number.'),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

// Types for data fetching
type InventoryItemOption = { id: number; name: string };
type TransactionLogItem = {
  item_name: string;
  type: string;
  quantity: number;
  user_name: string;
  created_at: string;
};

// Fetching functions
const fetchInventoryItems = async (tenantId: number): Promise<InventoryItemOption[]> => {
  const { data, error } = await supabase.from('inventory_items').select('id, name').eq('tenant_id', tenantId).order('name');
  if (error) throw new Error(error.message);
  return data;
};

const fetchTransactions = async (tenantId: number): Promise<TransactionLogItem[]> => {
  const { data, error } = await supabase.rpc('get_tenant_transactions', { p_tenant_id: tenantId });
  if (error) throw new Error(error.message);
  return data;
};

const TransactionsPage = () => {
  const { profile } = useSession();
  const queryClient = useQueryClient();
  const tenantId = profile?.tenant_id || 1; // Using fallback for development
  const userId = profile?.id;

  const [searchTerm, setSearchTerm] = useState('');

  // Form setup
  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: { type: 'INBOUND', quantity: 1 },
  });

  // Data queries
  const { data: items, isLoading: isLoadingItems } = useQuery({
    queryKey: ['inventoryItems', tenantId],
    queryFn: () => fetchInventoryItems(tenantId),
    enabled: !!tenantId,
  });

  const { data: transactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['transactions', tenantId],
    queryFn: () => fetchTransactions(tenantId),
    enabled: !!tenantId,
  });

  // Mutation for creating a transaction
  const createTransactionMutation = useMutation({
    mutationFn: async (data: TransactionFormValues) => {
      if (!tenantId || !userId) throw new Error('User or tenant not identified.');
      const { error } = await supabase.from('transactions').insert({
        tenant_id: tenantId,
        item_id: data.itemId,
        type: data.type,
        quantity: data.quantity,
        user_id: userId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess('Transaction recorded successfully!');
      queryClient.invalidateQueries({ queryKey: ['transactions', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['inventory', tenantId] }); // To update stock on inventory page
      queryClient.invalidateQueries({ queryKey: ['dashboardData', tenantId] }); // To update dashboard stats
      reset();
    },
    onError: (error) => {
      showError(`Failed to record transaction: ${error.message}`);
    },
  });

  const onSubmit = (data: TransactionFormValues) => {
    createTransactionMutation.mutate(data);
  };

  // Filtering logic for the log
  const filteredTransactions = transactions?.filter(t =>
    t.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.user_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <header className="pb-4 mb-6 border-b">
        <h1 className="text-3xl font-bold">Transactions</h1>
        <p className="text-gray-600 mt-1">Record stock movements and view transaction history.</p>
      </header>

      {/* Create Transaction Form */}
      <Card className="mb-8">
        <CardHeader><CardTitle>Create New Transaction</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-5 gap-6 items-end">
            <div className="md:col-span-2">
              <Label htmlFor="itemId">Inventory Item</Label>
              <Controller
                name="itemId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingItems}>
                    <SelectTrigger><SelectValue placeholder="Select an item..." /></SelectTrigger>
                    <SelectContent>
                      {items?.map(item => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.itemId && <p className="text-sm text-red-600 mt-1">{errors.itemId.message}</p>}
            </div>
            <div>
              <Label>Type</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex items-center mt-2">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="INBOUND" id="inbound" /><Label htmlFor="inbound">Inbound</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="OUTBOUND" id="outbound" /><Label htmlFor="outbound">Outbound</Label></div>
                  </RadioGroup>
                )}
              />
            </div>
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input id="quantity" type="number" {...register('quantity')} />
              {errors.quantity && <p className="text-sm text-red-600 mt-1">{errors.quantity.message}</p>}
            </div>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Recording...' : 'Record Transaction'}</Button>
          </form>
        </CardContent>
      </Card>

      {/* Transaction Log */}
      <Card>
        <CardHeader><CardTitle>Transaction Log</CardTitle></CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Filter by item or user..."
              className="max-w-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingTransactions ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                  </TableRow>
                ))
              ) : (
                filteredTransactions?.map((t, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{t.item_name}</TableCell>
                    <TableCell>
                      <Badge variant={t.type === 'INBOUND' ? 'success' : 'destructive'}>{t.type}</Badge>
                    </TableCell>
                    <TableCell>{t.quantity}</TableCell>
                    <TableCell>{t.user_name}</TableCell>
                    <TableCell>{format(new Date(t.created_at), 'Pp')}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionsPage;