# 🗄️ Supabase Setup Guide for Quick Fund

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - **Name**: `quick-fund`
   - **Database Password**: (generate a strong password)
   - **Region**: Choose closest to your users
6. Click "Create new project"
7. Wait for project to be ready (2-3 minutes)

## 2. Get Your Project Credentials

1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (starts with `https://`)
   - **anon public** key (starts with `eyJ`)

## 3. Set Up Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the contents of `supabase-schema.sql`
3. Paste and run the SQL script
4. Verify tables were created:
   - `proposals` table
   - `donations` table

## 4. Configure Environment Variables

### For Local Development:
1. Copy `env.example` to `.env.local`
2. Add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
```

### For Vercel Deployment:
1. Go to your Vercel project dashboard
2. Go to **Settings** → **Environment Variables**
3. Add the same variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 5. Test the Setup

1. Start your local development server:
   ```bash
   npm run dev
   ```

2. Visit `http://localhost:3000`
3. You should see the sample proposals
4. Try creating a new proposal
5. Check your Supabase dashboard → **Table Editor** to see the data

## 6. Enable Real-time (Optional)

1. Go to **Database** → **Replication**
2. Enable replication for:
   - `proposals` table
   - `donations` table
3. This enables real-time updates across users

## 7. Database Features

### ✅ What's Included:
- **Proposals table** with all crowdfunding data
- **Donations table** with transaction tracking
- **Row Level Security** for data protection
- **Real-time subscriptions** for live updates
- **Sample data** to get started
- **Optimized indexes** for performance

### 🔒 Security:
- Public read access for proposals and donations
- Authenticated users can create content
- Row Level Security enabled
- No sensitive data exposed

### 📊 Sample Data:
- 2 example proposals included
- Realistic funding amounts
- Various categories and tags
- Proper timestamps

## 8. Troubleshooting

### Common Issues:

**"Invalid API key"**
- Check your environment variables
- Ensure you're using the `anon` key, not the `service_role` key

**"Table doesn't exist"**
- Run the SQL schema script
- Check the Table Editor in Supabase dashboard

**"Real-time not working"**
- Enable replication in Database settings
- Check browser console for errors

**"CORS errors"**
- Supabase handles CORS automatically
- Check your domain is allowed in Supabase settings

## 9. Production Considerations

### Scaling:
- Supabase handles scaling automatically
- Free tier: 500MB database, 2GB bandwidth
- Pro tier: $25/month for more resources

### Monitoring:
- Check **Logs** in Supabase dashboard
- Monitor **Database** → **Logs** for queries
- Use **Analytics** for usage insights

### Backup:
- Supabase automatically backs up your database
- Point-in-time recovery available
- Export data anytime from dashboard

## 🎉 Success!

Once set up, your Quick Fund platform will have:
- ✅ **Real database persistence**
- ✅ **Multi-user data sharing**
- ✅ **Real-time updates**
- ✅ **Scalable infrastructure**
- ✅ **Professional data management**

Your crowdfunding platform is now production-ready! 🚀
