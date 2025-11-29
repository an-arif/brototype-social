import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_ENDPOINT = 'https://chatgpt5free.com/wp-json/chatgpt-pro/v1';

// Helper function to convert URL to base64
async function imageUrlToBase64(imageUrl: string): Promise<string> {
  try {
    console.log('Fetching image to convert to base64...');
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Convert to base64
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64 = btoa(binary);
    
    // Determine content type from response or default to png
    const contentType = response.headers.get('content-type') || 'image/png';
    
    console.log('Image converted to base64 successfully');
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();

    console.log('Generating image with prompt:', prompt);

    const response = await fetch(`${API_ENDPOINT}/image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        provider: 'openai'
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', response.status, error);
      throw new Error(`Failed to generate image: ${error}`);
    }

    const data = await response.json();
    console.log('Image generated successfully, response structure:', Object.keys(data));
    
    // Check if the API returned an error (content policy violation, etc.)
    if (data.error) {
      const errorMessage = data.error.message || data.error.type || 'Image generation failed';
      console.error('API returned error:', errorMessage);
      throw new Error(errorMessage);
    }
    
    // Get the image URL from the response
    const imageUrl = data.data?.[0]?.url || data.url || data.image_url;
    
    if (!imageUrl) {
      console.error('No image URL in response:', JSON.stringify(data));
      throw new Error('Failed to generate image. Please try a different prompt.');
    }
    
    console.log('Image URL received, converting to base64...');
    
    // Convert the image to base64 so it persists in localStorage
    const base64Image = await imageUrlToBase64(imageUrl);
    
    // Return in the same format but with base64 data URL
    return new Response(JSON.stringify({
      data: [{
        url: base64Image
      }]
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-image-gen function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
