import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const generatePassword = (length = 12) => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { user_id: targetUserId } = await req.json();
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!targetUserId) {
      return new Response(JSON.stringify({ error: 'Missing user_id' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Use the service role key to create an admin client to bypass RLS for internal checks
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the invoker's user object from the provided auth token
    const { data: { user: invoker } } = await createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
    ).auth.getUser();

    if (!invoker) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Fetch profiles for both invoker and target user using the admin client
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('users')
      .select('id, role, tenant_id')
      .in('id', [invoker.id, targetUserId]);

    if (profilesError || !profiles || profiles.length === 0) {
      console.error('Error fetching profiles:', profilesError);
      return new Response(JSON.stringify({ error: 'Could not retrieve user profiles.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const invokerProfile = profiles.find(p => p.id === invoker.id);
    const targetProfile = profiles.find(p => p.id === targetUserId);

    if (!invokerProfile || !targetProfile) {
      return new Response(JSON.stringify({ error: 'Invoker or target user not found.' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Security Check 1: Invoker must be a Manager or Admin
    if (invokerProfile.role !== 'MANAGER' && invokerProfile.role !== 'ADMIN') {
      return new Response(JSON.stringify({ error: 'Forbidden: Insufficient privileges.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Security Check 2: Users must be in the same tenant
    if (invokerProfile.tenant_id !== targetProfile.tenant_id) {
      return new Response(JSON.stringify({ error: 'Forbidden: Cannot reset password for a user in another tenant.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Security Check 3: A Manager cannot reset another Manager's password
    if (invokerProfile.role === 'MANAGER' && targetProfile.role === 'MANAGER') {
      return new Response(JSON.stringify({ error: 'Forbidden: Managers cannot reset passwords for other managers.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // All checks passed, proceed with password reset
    const tempPassword = generatePassword();

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      targetUserId,
      { password: tempPassword }
    );

    if (authError) {
      console.error('Auth user update error:', authError);
      return new Response(JSON.stringify({ error: authError.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { error: dbError } = await supabaseAdmin
      .from('users')
      .update({ account_status: 'FORCE_PASSWORD_RESET' })
      .eq('id', targetUserId);

    if (dbError) {
      console.error('DB user update error:', dbError);
      return new Response(JSON.stringify({ error: dbError.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ tempPassword }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});