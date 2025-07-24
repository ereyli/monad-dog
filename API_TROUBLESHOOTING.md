# API Troubleshooting Guide

## Problem: `net::ERR_BLOCKED_BY_CLIENT` Error

This error occurs when browser extensions (like ad blockers) prevent API requests from reaching the server.

## Solutions Implemented

### 1. **Offline Mode Fallback**
- When API is blocked, the app automatically switches to offline mode
- Data is stored locally in browser storage
- Updates are queued and synced when API becomes available

### 2. **Multiple Endpoint Fallbacks**
- Primary: `https://monad-snowy.vercel.app/api`
- Fallback 1: `https://monad-snowy.vercel.app/api`
- Fallback 2: `https://monad-snowy.vercel.app/api/v1`

### 3. **Ad-Blocker Friendly Headers**
- Added proper `Accept` and `Accept-Language` headers
- Removed potentially problematic headers
- Added request timeouts to prevent hanging

### 4. **Enhanced CORS Configuration**
- More permissive CORS settings for development
- Proper preflight request handling
- Multiple allowed origins

## Testing the API

### 1. **Use the Test Page**
Visit: `https://monad-snowy.vercel.app/test-api.html`

This page will:
- Test all API endpoints
- Show network diagnostics
- Display environment information

### 2. **Check Browser Console**
Look for these messages:
- `✅ API connection successful` - API is working
- `🔄 API offline mode enabled` - Using local storage
- `⚠️ Request blocked by client` - Ad blocker detected

### 3. **Manual Testing**
```javascript
// Test in browser console
fetch('https://monad-snowy.vercel.app/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

## Troubleshooting Steps

### Step 1: Disable Ad Blockers
1. Temporarily disable ad blockers for the site
2. Refresh the page
3. Check if API requests work

### Step 2: Check Browser Extensions
1. Open browser in incognito/private mode
2. Test the app without extensions
3. If it works, disable extensions one by one

### Step 3: Use Different Browser
1. Try Chrome, Firefox, Safari
2. Some browsers handle CORS differently
3. Mobile browsers often have fewer restrictions

### Step 4: Check Network
1. Try different network (mobile data vs WiFi)
2. Some corporate networks block certain requests
3. VPN might help or hurt depending on configuration

## Offline Mode Features

When API is blocked, the app will:

✅ **Continue Working**
- All game features remain functional
- XP and progress saved locally
- Transactions still work (blockchain)

⚠️ **Limited Features**
- Leaderboard may not update
- Cross-device sync disabled
- Some social features limited

🔄 **Auto-Sync**
- When API becomes available, data syncs automatically
- No data loss during offline periods
- Seamless transition between modes

## Environment Variables

Make sure these are set in Vercel:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
NODE_ENV=production
```

## Common Issues

### Issue: "Failed to fetch" in Production
**Solution**: Check Vercel deployment and environment variables

### Issue: CORS Errors
**Solution**: Verify CORS configuration in `server.js`

### Issue: Rate Limiting
**Solution**: Rate limiting is disabled in development, enabled in production

### Issue: Supabase Connection
**Solution**: Verify Supabase credentials and table structure

## Support

If issues persist:
1. Check the test page: `/test-api.html`
2. Review browser console for detailed errors
3. Try in incognito mode
4. Test with different browsers
5. Check network connectivity

## Development vs Production

| Feature | Development | Production |
|---------|-------------|------------|
| Rate Limiting | Disabled | Enabled |
| CORS | Permissive | Restricted |
| Logging | Verbose | Minimal |
| Error Handling | Detailed | Generic |

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/xp/:address` - Get user XP
- `PUT /api/xp/:address` - Update user XP
- `GET /api/challenges/:address` - Get challenges
- `PUT /api/challenges/:address` - Update challenges
- `GET /api/stats/:address` - Get daily stats
- `PUT /api/stats/:address` - Update daily stats 