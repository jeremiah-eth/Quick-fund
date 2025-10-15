# 🚀 Quick Fund - Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Push your code to GitHub
3. **Node.js 18+**: Ensure you have the correct Node version

## Deployment Steps

### 1. Prepare Your Repository

```bash
# Make sure all changes are committed
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 2. Deploy to Vercel

#### Option A: Vercel CLI (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from your project directory
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (your account)
# - Link to existing project? No
# - Project name: quick-fund
# - Directory: ./
# - Override settings? No
```

#### Option B: Vercel Dashboard
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
5. Click "Deploy"

### 3. Environment Variables (Optional)

If you want to customize the app, add these in Vercel Dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_APP_NAME=Quick Fund
NEXT_PUBLIC_APP_DESCRIPTION=Crowdfund projects with Base Account SDK
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_APP_LOGO_URL=https://your-app.vercel.app/logo.png
```

### 4. Custom Domain (Optional)

1. Go to your project in Vercel Dashboard
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Update DNS records as instructed

## Post-Deployment

### ✅ Verify Deployment

1. **Check the live URL** - Your app should be accessible
2. **Test wallet connection** - Ensure Base Account SDK works
3. **Test proposal creation** - Create a test proposal
4. **Test donations** - Make a test donation

### 🔧 Troubleshooting

**Common Issues:**

1. **Build Errors**: Check the build logs in Vercel Dashboard
2. **Environment Variables**: Ensure all required vars are set
3. **Base Account SDK**: Verify it works in production
4. **CORS Issues**: Should not occur with Vercel + Base Account SDK

### 📊 Monitoring

- **Vercel Analytics**: Built-in performance monitoring
- **Console Logs**: Check Vercel function logs
- **User Feedback**: Monitor user interactions

## 🎉 Success!

Your crowdfunding platform is now live on Vercel! Users can:

- ✅ Connect their Base Account wallets
- ✅ Create funding proposals
- ✅ Browse and donate to projects
- ✅ Use Auto Spend Permissions
- ✅ Track funding progress

## 🔄 Updates

To update your deployment:

```bash
# Make changes to your code
git add .
git commit -m "Update crowdfunding features"
git push origin main

# Vercel will automatically redeploy
```

## 📱 Mobile Support

The app is fully responsive and works on:
- ✅ Desktop browsers
- ✅ Mobile browsers
- ✅ Progressive Web App (PWA) ready

## 🛡️ Security

- ✅ Client-side only (no backend vulnerabilities)
- ✅ Base Account SDK security
- ✅ HTTPS enforced by Vercel
- ✅ No sensitive data stored

---

**Need Help?** Check the [Vercel Documentation](https://vercel.com/docs) or [Base Account SDK Docs](https://docs.base.org/base-account/)
