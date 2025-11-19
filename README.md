# Gamma MCP Server

Model Context Protocol (MCP) server för Gamma.app - gör det möjligt för AI-assistenter att generera presentationer via Gamma API.

## Features

- ✅ **3 MCP Tools**:
  - `gamma_generate` - Skapa presentation/dokument
  - `gamma_get_generation` - Hämta status på generation
  - `gamma_list_generations` - Lista tidigare generationer

- ✅ **Två lägen**:
  - **stdio** - För Claude Desktop (lokal användning)
  - **HTTP** - För AI Engine & webbapplikationer (24/7 deployment)

- ✅ **Full Gamma API support**:
  - Presentations, Documents, Webpages
  - Custom themes, tones, audiences
  - Swedish language default
  - Image generation

## Installation

### 1. Klona/Kopiera projektet

```bash
cd ~/gamma-mcp-server
```

### 2. Installera dependencies

```bash
npm install
```

### 3. Konfigurera API key

Uppdatera `.env` filen med din Gamma API key:

```bash
GAMMA_API_KEY=sk-gamma-your-key-here
```

### 4. Bygg projektet

```bash
npm run build
```

## Användning

### Lokal testning (stdio mode)

För att testa med Claude Desktop eller lokalt:

```bash
npm start
```

Lägg till i Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "gamma": {
      "command": "node",
      "args": ["/absolut/sökväg/till/gamma-mcp-server/dist/index.js"]
    }
  }
}
```

### HTTP Server (för AI Engine)

Starta HTTP-servern:

```bash
npm run start:streamable
```

Servern körs på `http://localhost:3000/mcp`

## Deployment till allgot.se

### Metod 1: PM2 (Process Manager)

```bash
# Installera PM2
npm install -g pm2

# Starta servern
pm2 start dist/streamable-http-server.js --name gamma-mcp

# Auto-restart vid server reboot
pm2 startup
pm2 save
```

### Metod 2: Systemd Service

Skapa `/etc/systemd/system/gamma-mcp.service`:

```ini
[Unit]
Description=Gamma MCP Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/home/u210698164/gamma-mcp-server
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/streamable-http-server.js
Restart=always

[Install]
WantedBy=multi-user.target
```

Aktivera:

```bash
sudo systemctl enable gamma-mcp
sudo systemctl start gamma-mcp
```

### Nginx Reverse Proxy

Lägg till i nginx config:

```nginx
location /gamma-mcp {
    proxy_pass http://localhost:3000/mcp;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;

    # För SSE streaming
    proxy_buffering off;
    proxy_read_timeout 600s;
}
```

## Integration med AI Engine

### 1. Via Code Engine Pro

Skapa ett PHP snippet i Code Engine (typ: function):

```php
function gamma_create_presentation($params) {
    $mcp_url = 'https://allgot.se/gamma-mcp';

    $request = [
        'jsonrpc' => '2.0',
        'id' => 1,
        'method' => 'tools/call',
        'params' => [
            'name' => 'gamma_generate',
            'arguments' => $params
        ]
    ];

    $response = wp_remote_post($mcp_url, [
        'headers' => [
            'Content-Type' => 'application/json',
            'Accept' => 'application/json, text/event-stream'
        ],
        'body' => json_encode($request),
        'timeout' => 60
    ]);

    return json_decode(wp_remote_retrieve_body($response), true);
}
```

### 2. Direkt i AI Engine

Om AI Engine stödjer externa MCP servers kan du konfigurera:

- Endpoint: `https://allgot.se/gamma-mcp`
- Metod: POST
- Headers: `Accept: application/json, text/event-stream`

## API Examples

### Skapa presentation

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "gamma_generate",
    "arguments": {
      "inputText": "Hållbar utveckling i skolan",
      "format": "presentation",
      "numCards": 12,
      "textTone": "educational",
      "textAudience": "teachers",
      "textLanguage": "Swedish"
    }
  }
}
```

### Hämta status

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "gamma_get_generation",
    "arguments": {
      "generationId": "gen_abc123"
    }
  }
}
```

## Environment Variables

| Variable | Beskrivning | Default |
|----------|-------------|---------|
| `GAMMA_API_KEY` | Din Gamma API key (REQUIRED) | - |
| `GAMMA_API_BASE_URL` | Gamma API bas-URL | `https://public-api.gamma.app/v1.0` |
| `PORT` | HTTP server port | `3000` |
| `HOST` | HTTP server host | `0.0.0.0` |
| `NODE_ENV` | Environment mode | `development` |

## Security

- ⚠️ **Lägg ALDRIG till `.env` i git**
- ✅ Använd HTTPS i produktion
- ✅ Begränsa access till MCP endpoint (firewall/auth)
- ✅ Håll Gamma API key säker

## Troubleshooting

### Server startar inte

```bash
# Kolla om port 3000 redan används
lsof -i :3000

# Prova annan port
PORT=3001 npm run start:streamable
```

### Gamma API errors

```bash
# Testa API key manuellt
curl -X POST https://public-api.gamma.app/v1.0/generate \
  -H "X-API-KEY: your-key-here" \
  -H "Content-Type: application/json" \
  -d '{"input_text":"Test","format":"presentation"}'
```

### MCP connection issues

- Kontrollera att `Accept: application/json, text/event-stream` header finns
- Kolla server logs: `pm2 logs gamma-mcp` eller `journalctl -u gamma-mcp -f`
- Verifiera att nginx reverse proxy är korrekt konfigurerad

## Support

För frågor eller problem, kontakta: isak@allgot.se

## License

MIT License - Allgot.se
