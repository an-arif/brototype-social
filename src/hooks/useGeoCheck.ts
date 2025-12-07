import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const GEO_CHECK_CACHE_KEY = "geo_check_result";
const GEO_CHECK_CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

interface GeoCheckCache {
  allowed: boolean;
  timestamp: number;
}

export function useGeoCheck() {
  const [isChecking, setIsChecking] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    const checkGeoLocation = async () => {
      try {
        // Check cache first
        const cached = sessionStorage.getItem(GEO_CHECK_CACHE_KEY);
        if (cached) {
          const { allowed, timestamp }: GeoCheckCache = JSON.parse(cached);
          if (Date.now() - timestamp < GEO_CHECK_CACHE_DURATION) {
            setIsBlocked(!allowed);
            setIsChecking(false);
            return;
          }
        }

        // Call geo-check edge function
        const response = await supabase.functions.invoke('geo-check');
        
        if (response.error) {
          console.log('Geo-check error, allowing user (fail-open):', response.error);
          setIsBlocked(false);
        } else {
          const { allowed, country, reason } = response.data;
          console.log('Geo-check result:', { allowed, country, reason });
          setIsBlocked(!allowed);
          
          // Cache the result
          const cacheData: GeoCheckCache = { allowed, timestamp: Date.now() };
          sessionStorage.setItem(GEO_CHECK_CACHE_KEY, JSON.stringify(cacheData));
        }
      } catch (error) {
        console.log('Geo-check failed, allowing user (fail-open):', error);
        setIsBlocked(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkGeoLocation();
  }, []);

  return { isChecking, isBlocked };
}
