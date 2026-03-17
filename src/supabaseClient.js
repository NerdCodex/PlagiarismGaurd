// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pflizdmqzmpbjwmerzyl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmbGl6ZG1xem1wYmp3bWVyenlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NTc2ODIsImV4cCI6MjA4OTMzMzY4Mn0.7W9PA2ZuMLbM87WHRlX_uRfYv3BocyHi09DIdqpk108';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);