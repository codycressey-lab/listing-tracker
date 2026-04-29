import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bvfwcmsadxymgwujqudw.supabase.co'
const supabaseKey = 'sb_publishable_a8Di-TmmY_ejdTL5GbmdOQ_p3f725Fu'

export const supabase = createClient(supabaseUrl, supabaseKey)