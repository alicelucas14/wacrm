const { createClient } = require('@supabase/supabase-js');
// Load environment variables from .env.local
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  try {
    console.log('Using Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    
    // 1. Check profiles columns
    const { data: profiles, error: pError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (pError) {
      console.error('Profiles select error:', pError);
    } else {
      console.log('Profiles columns:', Object.keys(profiles[0] || {}));
    }

    // 2. Fetch latest messages
    const { data: messages, error: mError } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (mError) {
      console.error('Messages select error:', mError);
    } else {
      console.log('Latest messages:');
      messages.forEach(m => {
        console.log(`- ID: ${m.id}, Sender: ${m.sender_type}, Status: ${m.status}, Content: "${m.content_text}", Created: ${m.created_at}`);
      });
    }

    // 3. Fetch latest flow_runs
    const { data: flowRuns, error: fError } = await supabase
      .from('flow_runs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (fError) {
      console.error('Flow runs select error:', fError);
    } else {
      console.log('Latest flow runs:', flowRuns);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

check();
