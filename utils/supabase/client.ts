import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    'https://rfsndgiwxwrieiqznwf.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmc25kd2dpd3h3cmllaXF6bndmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzNDc2ODMsImV4cCI6MjEwNjkyMzY4M30.ZaZ5NyZrCS-PfXaIiB_nyBUTzWt7xZpj1TS4mJIuabk'
  );
}