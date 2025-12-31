# Email Notifications Setup

## Setup Resend Email Notifications

### Prerequisites
1. A Resend account and API key from [resend.com/api-keys](https://resend.com/api-keys)
2. Supabase CLI installed

### Deployment Steps

1. **Set the Resend API key as a Supabase secret:**
   ```bash
   supabase secrets set RESEND_API_KEY=re_xxxxxxxxx
   ```

2. **Deploy the edge function:**
   ```bash
   supabase functions deploy send-email
   ```

3. **Test the function:**
   ```bash
   curl -X POST 'https://YOUR_PROJECT.supabase.co/functions/v1/send-email' \
     -H 'Authorization: Bearer YOUR_ANON_KEY' \
     -H 'Content-Type: application/json' \
     -d '{"type": "welcome", "to": "test@example.com", "userName": "Test User"}'
   ```

### Email Types
- `welcome` - Sent on new user signup
- `enquiry` - Sent when product enquiry is submitted
- `enquiry-update` - Sent when enquiry status changes
- `password-changed` - Sent after password update
