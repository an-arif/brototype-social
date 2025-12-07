import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP from headers
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || req.headers.get('x-real-ip') 
      || req.headers.get('cf-connecting-ip')
      || 'unknown';

    console.log('Checking geo-location for IP:', clientIP);

    // Call ipinfo.io to get location data
    const response = await fetch(`https://ipinfo.io/${clientIP}/json`);
    
    // If quota exceeded or API fails, allow the user (fail-open)
    if (!response.ok) {
      console.log('ipinfo.io API failed, allowing user through (fail-open)');
      return new Response(
        JSON.stringify({ allowed: true, reason: 'api_unavailable' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('Geo-location data:', JSON.stringify(data));

    // Check if there's an error (like rate limit)
    if (data.error) {
      console.log('ipinfo.io returned error, allowing user through (fail-open):', data.error);
      return new Response(
        JSON.stringify({ allowed: true, reason: 'api_error' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if the country is India (IN)
    const country = data.country;
    const isIndia = country === 'IN';

    console.log(`Country: ${country}, Is India: ${isIndia}`);

    return new Response(
      JSON.stringify({ 
        allowed: isIndia, 
        country: country,
        reason: isIndia ? 'india_allowed' : 'non_india_blocked'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in geo-check:', error);
    // Fail-open: if anything goes wrong, allow the user
    return new Response(
      JSON.stringify({ allowed: true, reason: 'error_failopen' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
