// FILE: supabase/functions/manage-user-role/index.ts

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

// Helper function to create a Supabase client with the caller's authentication context
const createSupabaseClient = (req: Request) => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
        throw new Error('Missing Authorization header');
    }
    return createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
    );
};

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { target_user_id, new_role } = await req.json();
    if (!target_user_id || !new_role) {
        return new Response(JSON.stringify({ error: 'target_user_id and new_role are required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    if (new_role !== 'MANAGER' && new_role !== 'STAFF') {
        return new Response(JSON.stringify({ error: 'Invalid new_role specified. Must be MANAGER or STAFF.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    const supabase = createSupabaseClient(req);
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. --- AUTHORIZATION CHECK ---
    // Get the profile of the user MAKING the request (the actor)
    const { data: { user: actorUser }, error: actorError } = await supabase.auth.getUser();
    if (actorError || !actorUser) {
        return new Response(JSON.stringify({ error: 'Authentication error: Could not identify actor' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }
    const { data: actorProfile, error: actorProfileError } = await supabaseAdmin.from('users').select('role').eq('id', actorUser.id).single();
    if (actorProfileError || !actorProfile) {
        return new Response(JSON.stringify({ error: 'Could not find actor profile' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    // This function is for Admins only.
    if (actorProfile.role !== 'ADMIN') {
        return new Response(JSON.stringify({ error: 'You are not authorized to perform this action.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    // 2. --- TARGET USER VALIDATION ---
    // Get the profile of the user whose role is being changed (the target)
    const { data: targetProfile, error: targetProfileError } = await supabaseAdmin.from('users').select('id, role, tenant_id').eq('id', target_user_id).single();
    if (targetProfileError || !targetProfile) {
        return new Response(JSON.stringify({ error: 'Target user not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }
    
    if (targetProfile.role === new_role) {
        return new Response(JSON.stringify({ error: `User is already a ${new_role}.` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    // 3. --- BUSINESS LOGIC & EXECUTION ---
    if (new_role === 'MANAGER') {
        // PROMOTION LOGIC
        // Update user's role to MANAGER
        const { error: updateError } = await supabaseAdmin.from('users').update({ role: 'MANAGER' }).eq('id', target_user_id);
        if (updateError) throw updateError;
        
        // As a safeguard, remove all specific permissions the user had as a Staff member.
        // Managers have inherent permissions, so granular ones should be cleared.
        const { error: deletePermissionsError } = await supabaseAdmin.from('user_permissions').delete().eq('user_id', target_user_id);
        if (deletePermissionsError) throw deletePermissionsError;

    } else { // new_role === 'STAFF'
        // DEMOTION LOGIC
        // CRITICAL: Check if this is the last manager in the tenant.
        const { count, error: countError } = await supabaseAdmin
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', targetProfile.tenant_id)
            .eq('role', 'MANAGER');
        
        if (countError) throw countError;

        if (count !== null && count <= 1) {
            return new Response(JSON.stringify({ error: 'Cannot demote the last manager of a tenant. Promote another user to manager first.' }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
        }

        // Proceed with demotion
        const { error: updateError } = await supabaseAdmin.from('users').update({ role: 'STAFF' }).eq('id', target_user_id);
        if (updateError) throw updateError;
    }

    return new Response(JSON.stringify({ message: `User role successfully updated to ${new_role}.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});