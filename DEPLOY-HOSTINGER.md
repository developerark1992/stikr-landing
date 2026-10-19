# Deploying to Hostinger (yourstikr.com)

The same repo builds for Vercel (`npm run build`) or Hostinger (`npm run build:hostinger`, a standalone
Node server via `@astrojs/node`). Hostinger's LiteSpeed starts it through `app.cjs`.

## Live setup (shared / cloud plan, same account as costcalculator.bizhub.ae)

- SSH: `ssh -i ~/.ssh/bizhub_hostinger -p 65002 u105833361@189.49.97.31`
- App: `~/stikr-landing` (this repo, public, cloned over HTTPS)
- Node: `/opt/alt/alt-nodejs22/root/usr/bin` (add to `PATH` in SSH sessions)
- Secrets: `~/stikr-landing/.env` with `NOMOD_API_KEY=...` (never committed)
- Site folder `~/domains/yourstikr.com/public_html/.htaccess` hands requests to the app:

```apache
PassengerAppRoot /home/u105833361/stikr-landing
PassengerBaseURI /
PassengerNodejs /opt/alt/alt-nodejs22/root/usr/bin/node
PassengerAppType node
PassengerStartupFile app.cjs
PassengerAppEnv production
```

## Update

```bash
export PATH=/opt/alt/alt-nodejs22/root/usr/bin:$PATH
cd ~/stikr-landing && git pull && npm ci && npm run build:hostinger && pkill -f "lsnode:/home/u105833361/stikr-landing" || true
```

LiteSpeed starts the app again on the next request.

## Domain

`yourstikr.com` is registered at OnlyDomains. Add it as a website in Hostinger hPanel, then either switch
its nameservers to Hostinger's or point the `A` records for `@` and `www` at the IP hPanel shows.
