# 🚀 Deployment Guide

Production deployment for The Tradooor on various platforms.

---

## Pre-Deployment Checklist

- [ ] Dry-run mode tested for 1-2 weeks
- [ ] All tests passing (`npm test`)
- [ ] No errors in build (`npm run build`)
- [ ] Configuration validated with real API keys
- [ ] Wallet funded with trading capital
- [ ] Notifications configured (Telegram/Discord)
- [ ] Monitoring dashboard accessible
- [ ] Backup wallet / private key saved securely
- [ ] Git repository committed and pushed
- [ ] Performance acceptable in dry-run

---

## Local Machine Deployment

### Simple (Basic)

```bash
# 1. Navigate to project
cd ~/the-tradooor

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Build
npm run build

# 4. Start bot
npm start
```

**Pros:** Simple, no extra tools  
**Cons:** Not resilient, stops if terminal closes  
**Best for:** Development, testing

---

### With PM2 (Recommended for Personal Machines)

PM2 provides automatic restart, logging, monitoring.

**1. Install PM2 globally:**
```bash
npm install -g pm2
pm2 startup  # Auto-start on reboot
```

**2. Start bot:**
```bash
pm2 start npm --name tradooor -- start
```

**3. Monitor:**
```bash
pm2 monit tradooor      # Real-time monitoring
pm2 logs tradooor       # View logs
pm2 logs tradooor -f    # Follow logs
```

**4. Manage:**
```bash
pm2 stop tradooor       # Stop bot
pm2 restart tradooor    # Restart
pm2 delete tradooor     # Remove from PM2
```

**5. Restore from backup:**
```bash
pm2 save                # Save current state
pm2 restore             # Restore on reboot
```

**Pros:** Resilient, auto-restart, logging  
**Cons:** Single machine  
**Best for:** Personal machines, small portfolios

---

### With Systemd (Linux Server)

For production Linux servers (Debian/Ubuntu).

**1. Create systemd service file:**
```bash
sudo nano /etc/systemd/system/tradooor.service
```

**2. Add configuration:**
```ini
[Unit]
Description=The Tradooor Trading Bot
After=network.target

[Service]
Type=simple
User=trading
WorkingDirectory=/home/trading/the-tradooor
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

**3. Enable and start:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable tradooor
sudo systemctl start tradooor
```

**4. Monitor:**
```bash
sudo systemctl status tradooor
sudo journalctl -u tradooor -f   # Follow logs
```

**Pros:** Production-grade, systemd integration  
**Cons:** Linux only  
**Best for:** VPS, dedicated servers

---

## Cloud Deployment

### AWS EC2 (Elastic Compute Cloud)

**1. Launch EC2 instance:**
- OS: Amazon Linux 2 or Ubuntu 22.04
- Instance: t3.small (1 vCPU, 2GB RAM minimum)
- Storage: 30GB SSD
- Security Group: Allow SSH (port 22) inbound only

**2. Connect and setup:**
```bash
ssh -i your-key.pem ec2-user@your-instance-ip

# Update system
sudo yum update -y  # Amazon Linux
# OR
sudo apt update && sudo apt upgrade -y  # Ubuntu

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Clone repo
git clone https://github.com/Reinasboo/the-tradooor.git
cd the-tradooor

# Setup
npm install --legacy-peer-deps
npm run build

# Create .env
cp .env.example .env
nano .env  # Add your config

# Start with PM2
npm install -g pm2
pm2 start npm --name tradooor -- start
pm2 startup
pm2 save
```

**3. Estimated costs:**
- EC2: ~$10-15/month (t3.small)
- Bandwidth: ~$1-5/month
- **Total: ~$15-20/month**

**Pros:** Scalable, reliable, managed  
**Cons:** Need AWS account, some setup  
**Best for:** Professional deployment, scaling

---

### DigitalOcean Droplet (Simple)

**1. Create Droplet:**
- Image: Ubuntu 22.04
- Size: Basic ($5-6/month)
- Region: Closest to you

**2. Connect via SSH and setup:**
```bash
ssh root@your-droplet-ip

# Create non-root user
adduser trading
usermod -aG sudo trading
su - trading

# Follow "AWS EC2" setup steps above
```

**3. Estimated costs:**
- Droplet: ~$6/month (basic)
- **Total: ~$6/month**

**Pros:** Very cheap, simple interface  
**Cons:** Fewer features than AWS  
**Best for:** Budget-conscious, small portfolios

---

### Railway (Easiest for Non-DevOps)

**1. Connect GitHub repository:**
- Go to https://railway.app
- Create project
- Connect your GitHub repo

**2. Add environment variables:**
- GMGN_API_KEY
- SOLANA_RPC_URL
- SOLANA_WALLET_PRIVATE_KEY
- (all from .env.example)

**3. Deploy:**
- Push to GitHub
- Railway auto-deploys
- View logs in dashboard

**4. Estimated costs:**
- Free tier: $5/month credit
- Paid: $5-20/month depending on usage

**Pros:** Git-native, zero DevOps, easy scaling  
**Cons:** Less control, vendor lock-in  
**Best for:** Non-technical users, quick deployment

---

### Docker Deployment (Advanced)

For reproducible, containerized deployment.

**1. Create Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy project
COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

# Build
RUN npm run build

# Run
CMD ["npm", "start"]
```

**2. Create docker-compose.yml:**
```yaml
version: '3'
services:
  tradooor:
    build: .
    restart: always
    env_file: .env
    volumes:
      - ./logs:/app/logs
    networks:
      - tradooor-network

volumes:
  logs:

networks:
  tradooor-network:
```

**3. Deploy:**
```bash
# Build image
docker build -t tradooor .

# Run with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f tradooor

# Stop
docker-compose down
```

**Pros:** Reproducible, portable, easy scaling  
**Cons:** Docker learning curve  
**Best for:** Kubernetes, multi-container setups

---

## Monitoring & Maintenance

### Health Checks

**1. API availability:**
```bash
# Verify GMGN API is reachable
curl https://api.gmgn.ai/health

# Verify Solana RPC is reachable
curl https://api.mainnet-beta.solana.com \
  -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'
```

**2. Application health:**
```bash
# Check if process is running
pm2 list tradooor

# Check memory usage
pm2 monit tradooor

# Check recent logs
pm2 logs tradooor --lines 50 | grep Error
```

**3. Wallet health:**
```bash
# Verify balance > 0
# Check via Phantom or:
# https://explorer.solana.com/address/YOUR_WALLET

# Monitor for low balance alert
# Add to bot: if balance < 1 SOL, alert
```

---

### Monitoring Dashboard (Optional)

For more sophisticated monitoring:

**Datadog:**
- Ship logs to Datadog
- Create dashboards
- Set up alerts

**Prometheus + Grafana:**
- Collect metrics
- Visualize in Grafana
- Alert on thresholds

**New Relic:**
- Application performance monitoring
- Error tracking
- Real-time alerts

---

### Backup Strategy

**1. Daily backups:**
```bash
# Backup logs and state
tar -czf backup-$(date +%Y%m%d).tar.gz \
  logs/ \
  .env \
  state.json

# Upload to S3 or backup service
aws s3 cp backup-*.tar.gz s3://my-backups/
```

**2. Git repository:**
```bash
# Ensure code is pushed
git push origin main

# Tag releases
git tag v1.0.0
git push origin v1.0.0
```

**3. Private key backup:**
```bash
# Store securely (encrypted, offline)
# Options:
# - Hardware wallet (Ledger, Trezor)
# - Encrypted USB drive
# - Password manager (1Password, Bitwarden)
# - Physical safe deposit box
```

---

## Scaling Strategy

### Phase 1: Single Instance ($15-20/month)
- 1 EC2 t3.small instance
- 1 wallet
- Handles 50-100 signals/day
- Portfolio: ~$10-50k

### Phase 2: Multi-Instance ($50-100/month)
- 2-3 instances (each monitoring different tokens)
- Shared state in RDS or Redis
- Load balancer
- Handles 200-500 signals/day
- Portfolio: ~$50-500k

### Phase 3: Distributed ($500+/month)
- 5+ instances across regions
- Kubernetes for orchestration
- Centralized monitoring
- Disaster recovery setup
- Portfolio: ~$500k+

---

## Performance Tuning

### Database Optimization
If using persistent storage:
```sql
-- Index frequently queried columns
CREATE INDEX idx_token_mint ON trades(mint);
CREATE INDEX idx_trade_timestamp ON trades(timestamp);

-- Partition data by date
ALTER TABLE trades PARTITION BY RANGE (YEAR(timestamp)) (...);
```

### RPC Optimization
```env
# Use dedicated endpoint
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=XXX

# Or local validator for testing
# Setup: https://docs.solana.com/running-validator
```

### Caching Strategy
```typescript
// Cache token data for 30s
const cache = new Map();
const cacheTime = 30000; // ms

function getCachedToken(mint) {
  const cached = cache.get(mint);
  if (cached && Date.now() - cached.time < cacheTime) {
    return cached.data;
  }
  return null;
}
```

---

## Security Hardening

### 1. Minimize Private Key Exposure
```env
# Use environment variable (never hardcoded)
SOLANA_WALLET_PRIVATE_KEY=from_env_only

# OR use AWS Secrets Manager
# OR use HashiCorp Vault
```

### 2. API Key Rotation
```bash
# Rotate GMGN API key monthly
# 1. Generate new key in GMGN dashboard
# 2. Update environment variable
# 3. Delete old key

# Set reminder: 1st of each month
```

### 3. Firewall Rules
```bash
# Allow only necessary outbound
- api.gmgn.ai (TCP 443)
- mainnet.helius-rpc.com (TCP 443)
- discord.com (TCP 443)
- t.me (TCP 443)

# Block everything else
# Allow SSH only from your IP
```

### 4. VPN for RPC
```bash
# If in restrictive location, use VPN
# Or use VPN-compatible RPC provider
# (Helius, QuickNode handle georestrictions)
```

### 5. Monitoring & Logging
```bash
# Enable CloudTrail (AWS)
# Enable VPC Flow Logs
# Monitor for unauthorized access

# Set up alerts:
# - Unusual transaction amounts
# - New wallet addresses
# - Failed login attempts
```

---

## Disaster Recovery

### Recovery Time Objective (RTO): 15 minutes
### Recovery Point Objective (RPO): 5 minutes

**Backup Procedure:**
```bash
# Every 5 minutes, backup state
# Store in S3 with versioning

# Test restore monthly
# Time complete restoration
```

**Failover Procedure:**
```bash
# 1. Detect primary failure (no signal for 10 min)
# 2. Alert team
# 3. Launch standby instance
# 4. Restore state from latest backup
# 5. Resume trading

# Total time: ~15 minutes
```

---

## Cost Optimization

| Component | Cost/Month | Optimization |
|-----------|------------|-------------|
| Compute (EC2) | $15 | Start small, scale gradually |
| RPC (Helius) | $0 | Free tier sufficient for most |
| Backup (S3) | $1 | 30-day retention policy |
| Monitoring | $0 | PM2/Datadog free tier |
| **Total** | **~$16** | **Budget-friendly** |

---

## Maintenance Windows

**Weekly:**
- Check logs for errors
- Verify balance
- Monitor win rate

**Monthly:**
- Rotate API keys
- Update dependencies (`npm audit fix`)
- Review performance metrics

**Quarterly:**
- Test disaster recovery
- Security audit
- Strategy review

---

## Troubleshooting Deployment

### Bot won't start after deployment
```bash
# Check logs
pm2 logs tradooor

# Verify environment variables
echo $GMGN_API_KEY

# Rebuild
npm run build

# Restart
pm2 restart tradooor
```

### High CPU/Memory usage
```bash
# Check what's consuming resources
pm2 monit tradooor

# Profile if needed
node --prof src/index.ts

# Reduce scan frequency (increase interval)
```

### Network connectivity issues
```bash
# Test RPC connection
curl https://api.mainnet-beta.solana.com

# Test GMGN API
curl https://api.gmgn.ai/health

# Check firewall rules
sudo ufw status
```

---

## Next Steps

1. Choose deployment platform
2. Follow platform-specific setup
3. Configure monitoring
4. Set up backups
5. Test failover procedure
6. Document runbooks
7. Monitor continuously

---

**Last Updated:** April 16, 2026  
**Status:** Production Ready
