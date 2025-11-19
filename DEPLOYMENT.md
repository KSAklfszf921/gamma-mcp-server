# Deployment Guide - Render.com

## Quick Deploy (1-Click)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/KSAklfszf921/gamma-mcp-server)

## Manual Deployment Steps

### 1. Create Render Account

1. Go to https://render.com
2. Sign up with your GitHub account
3. Authorize Render to access your repositories

### 2. Create New Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `gamma-mcp-server`
3. Configure the service:

| Setting | Value |
|---------|-------|
| **Name** | `gamma-mcp-server` |
| **Runtime** | Node |
| **Branch** | `master` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm run start:streamable` |
| **Plan** | Free |

### 3. Add Environment Variables

Click **"Environment"** and add these variables:

```
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
GAMMA_API_BASE_URL=https://public-api.gamma.app/v1.0
GAMMA_API_KEY=sk-gamma-7Y1Jl6M2zW7jxwMD9N9sy6RtaBWbghBzLRkWzf8Vk4
```

⚠️ **VIKTIGT:** Sätt `GAMMA_API_KEY` som **Secret** (klicka på lås-ikonen)

### 4. Deploy!

1. Click **"Create Web Service"**
2. Render börjar bygga och deploya (tar ~2-3 minuter)
3. När deployed visas din URL: `https://gamma-mcp-server-xxx.onrender.com`

### 5. Test Deployment

```bash
# Health check
curl https://gamma-mcp-server-xxx.onrender.com/health

# Test MCP endpoint
curl -X POST https://gamma-mcp-server-xxx.onrender.com/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list"
  }'
```

## Configure AI Engine

Once deployed, add the endpoint to AI Engine:

**MCP Endpoint:** `https://gamma-mcp-server-xxx.onrender.com/mcp`

(Replace `xxx` with your actual Render URL)

## Auto-Deploy on Git Push

✅ Render automatically redeploys when you push to GitHub `master` branch

## Monitoring

- **Logs:** Render Dashboard → Your Service → Logs
- **Metrics:** Render Dashboard → Your Service → Metrics
- **Uptime:** Free plan spins down after 15min inactivity (cold start ~30s)

## Troubleshooting

### Service won't start
- Check logs in Render dashboard
- Verify all environment variables are set
- Ensure `GAMMA_API_KEY` is valid

### 503 Service Unavailable
- Free plan has cold starts after inactivity
- First request after sleep takes ~30 seconds
- Subsequent requests are instant

### Gamma API errors
- Verify API key is correct
- Check Gamma API status
- Review request format in logs

## Upgrade to Paid Plan (Optional)

For production use without cold starts:

- **Starter Plan:** $7/month - Always online, no cold starts
- **Standard Plan:** $25/month - More resources

## Support

Issues? Check:
1. Render logs
2. GitHub issues: https://github.com/KSAklfszf921/gamma-mcp-server/issues
3. Gamma API docs: https://developers.gamma.app
