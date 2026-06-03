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

// Decryption helper
const crypto = require('crypto');
function decrypt(ciphertext) {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    throw new Error('Invalid ENCRYPTION_KEY');
  }
  const keyBuffer = Buffer.from(key, 'hex');

  // CBC format (fallback)
  if (ciphertext.startsWith('cbc:')) {
    const parts = ciphertext.substring(4).split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = Buffer.from(parts[1], 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString('utf8');
  }

  // GCM format
  const parts = ciphertext.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid ciphertext format');
  }
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = Buffer.from(parts[1], 'hex');
  const authTag = Buffer.from(parts[2], 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString('utf8');
}

async function check() {
  try {
    const { data: configs, error: configError } = await supabase
      .from('whatsapp_config')
      .select('*');

    if (configError) {
      console.error('Config fetch error:', configError);
      return;
    }

    if (!configs || configs.length === 0) {
      console.log('No WhatsApp configs found in database.');
      return;
    }

    for (const config of configs) {
      console.log(`Checking config for user: ${config.user_id}`);
      console.log(`Phone Number ID: ${config.phone_number_id}`);
      console.log(`WABA ID: ${config.waba_id}`);
      
      let accessToken;
      try {
        accessToken = decrypt(config.access_token);
        console.log('Access Token decrypted successfully.');
      } catch (err) {
        console.error('Failed to decrypt Access Token:', err.message);
        continue;
      }

      // Verify against Meta
      const url = `https://graph.facebook.com/v21.0/${config.phone_number_id}?fields=id,display_phone_number,verified_name,quality_rating`;
      console.log('Fetching Meta URL:', url);
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!res.ok) {
        console.error(`Meta API returned status ${res.status}`);
        const data = await res.json().catch(() => ({}));
        console.error('Meta API error payload:', data);
      } else {
        const data = await res.json();
        console.log('Meta API Verification Success:', data);
      }
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

check();
