import { createClient } from '@supabase/supabase-js';

// Credentials provided by the user
const supabaseUrl = 'https://lqaqknottfkzcpjmobvs.supabase.co';
const supabaseKey = 'sb_publishable_HXJxP57J9xhxeI5GciCoYw_yktYIOTC';

export const supabase = createClient(supabaseUrl, supabaseKey);