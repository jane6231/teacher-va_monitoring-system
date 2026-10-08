import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    'https://rfsndwgiwxwrieiqznwf.supabase.co',
    'sb_publishable_WIfSJv-FIxVlNPqziJVPiA_ppycNoea'
  );
}