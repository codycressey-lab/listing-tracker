import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bvfwcmsadxymgwujqudw.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2ZndjbXNhZHh5bWd3dWpxdWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5Njg4NTMsImV4cCI6MjA5MjU0NDg1M30.G-9yJtpiT2IoIg0Ek-QFNp2IlzeM-sgqIpRUpPV1snA'

export const supabase = createClient(supabaseUrl, supabaseKey)
