import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_ENDPOINT = 'https://chatgpt5free.com/wp-json/chatgpt-pro/v1';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    // Get user from authorization header
    const authHeader = req.headers.get('authorization');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader! } }
    });

    const { data: { user } } = await supabase.auth.getUser();
    
    let systemContext = `You are a helpful AI assistant for a community platform.`;

    if (user) {
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, username')
        .eq('id', user.id)
        .single();

      // Get recent complaints
      const { data: complaints } = await supabase
        .from('complaints')
        .select('title, description, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      // Get recent posts
      const { data: posts } = await supabase
        .from('posts')
        .select('content, created_at, profiles!inner(display_name)')
        .order('created_at', { ascending: false })
        .limit(5);

      systemContext = `You are a helpful AI assistant for a community platform.

User Information:
- Display Name: ${profile?.display_name || 'User'}
- Username: @${profile?.username || 'user'}
- Email: ${user.email || 'Not available'}

About the Platform:
This is a community platform where users can:
- Share posts and updates with the community
- Submit complaints and track their status
- Follow other users and engage with content
- Receive notifications about platform activity
- Participate in events and discussions

Recent Complaints on the Platform:
${complaints?.map(c => `- "${c.title}" (${c.status}) - ${c.description.substring(0, 100)}...`).join('\n') || 'No recent complaints'}

Recent Posts from the Community:
${posts?.map((p: any) => `- ${p.profiles?.display_name || 'User'}: ${p.content.substring(0, 100)}...`).join('\n') || 'No recent posts'}

Your role is to help users understand the platform, answer questions about their activity, provide insights about community trends, and assist with any questions they may have.`;
    }

    const response = await fetch(`${API_ENDPOINT}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemContext },
          ...messages
        ],
        provider: 'openai'
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('ChatGPT API error:', response.status, error);
      throw new Error('Failed to get response from ChatGPT');
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-chat function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
