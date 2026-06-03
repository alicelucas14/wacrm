const { createClient } = require('@supabase/supabase-js');
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
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('status', 'failed')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error(error);
      return;
    }

    console.log('Failed messages count:', messages.length);
    messages.forEach(m => {
      console.log(`- DB ID: ${m.id}, Meta Message ID: ${m.message_id}, Content: "${m.content_text}", Created: ${m.created_at}`);
    });
  } catch (err) {
    console.error(err);
  }
}

check();
