import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

// Helper function to generate a secure temporary password
const generatePassword = (length = 12) => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
};

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
    const { target_user_id } = await req.json();
    if (!target_user_id) {
        return new Response(JSON.stringify({ error: 'target_user_id is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    const supabase = createSupabaseClient(req);
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Get the profile of the user MAKING the request (the actor)
    const { data: { user: actorUser }, error: actorError } = await supabase.auth.getUser();
    if (actorError || !actorUser) {
        return new Response(JSON.stringify({ error: 'Authentication error: Could not identify actor' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }
    const { data: actorProfile, error: actorProfileError } = await supabaseAdmin.from('users').select('role, tenant_id').eq('id', actorUser.id).single();
    if (actorProfileError || !actorProfile) {
        return new Response(JSON.stringify({ error: 'Could not find actor profile' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }


    // 2. Get the profile of the user HAVING their password reset (the target)
    const { data: targetProfile, error: targetProfileError } = await supabaseAdmin.from('users').select('role, tenant_id').eq('id', target_user_id).single();
    if (targetProfileError || !targetProfile) {
        return new Response(JSON.stringify({ error: 'Target user not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    // 3. --- AUTHORIZATION LOGIC ---
    const isActorAdmin = actorProfile.role === 'ADMIN';
    const isActorManager = actorProfile.role === 'MANAGER';
    const isTargetManager = targetProfile.role === 'MANAGER';
    const isTargetStaff = targetProfile.role === 'STAFF';

    let isAuthorized = false;

    // Rule 1: Admin can reset a Manager's password
    if (isActorAdmin && isTargetManager) {
        isAuthorized = true;
    }

    // Rule 2: Manager can reset a Staff member's password within the same tenant
    if (isActorManager && isTargetStaff && actorProfile.tenant_id === targetProfile.tenant_id) {
        isAuthorized = true;
    }

    if (!isAuthorized) {
        return new Response(JSON.stringify({ error: 'You are not authorized to perform this action.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    // 4. --- EXECUTION LOGIC ---
    const tempPassword = generatePassword();

    // Update the user's password in Supabase Auth
    const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(target_user_id, {
        password: tempPassword
    });
    if (updateAuthError) throw updateAuthError;

    // Update the user's status in the public users table
    const { error: updateProfileError } = await supabaseAdmin
        .from('users')
        .update({ account_status: 'FORCE_PASSWORD_RESET' })
        .eq('id', target_user_id);
    if (updateProfileError) throw updateProfileError;

    return new Response(JSON.stringify({ tempPassword }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});