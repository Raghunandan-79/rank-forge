# RankForge & Judge0 Production Deployment Guide

This guide provides a step-by-step walkthrough for deploying RankForge (Next.js, Express, PostgreSQL, Redis) and self-hosting the **Judge0** execution sandbox on a cloud instance (e.g. GCP Compute Engine, DigitalOcean, or Hetzner).

---

## 📋 Prerequisites
* A Cloud VM running **Ubuntu 22.04 LTS / 24.04 LTS** (Recommended: **2 vCPUs, 4GB RAM**).
* Docker & Docker Compose installed on the VM.
* A domain or subdomain (e.g., `api.yourdomain.com`) pointed to the VM's public IP.
* A GitHub repository containing your RankForge code.

---

## 🚀 Step 1: Install Docker on the Cloud VM
Log in to your VM via SSH and install Docker:
```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose
sudo systemctl enable --now docker
```

---

## 🛠️ Step 2: Deploy Judge0 CE (Self-Hosted)
Judge0 needs to run in its own sandbox environment to securely compile and execute user submissions.

1. **Download and Extract Judge0**:
   ```bash
   cd ~
   wget https://github.com/judge0/judge0/releases/download/v1.13.0/judge0-v1.13.0.tar.gz
   tar -xvf judge0-v1.13.0.tar.gz
   cd judge0-v1.13.0
   ```

2. **Configure Passwords**:
   Generate secure random passwords for Judge0's isolated Redis and DB databases inside `judge0.conf`:
   ```bash
   nano judge0.conf
   ```
   *Change `REDIS_PASSWORD` and `POSTGRES_PASSWORD` to secure strings.*

3. **Start Judge0**:
   ```bash
   docker-compose up -d
   ```
   *Judge0 will now be running internally on port `2358`.*

---

## 📦 Step 3: Deploy RankForge Backend Services
We will run PostgreSQL, Redis, the Express API, and the Submission Worker using the production compose file.

1. **Clone your repository** on the VM:
   ```bash
   cd ~
   git clone https://github.com/Raghunandan-79/rank-forge.git
   cd rank-forge
   ```

2. **Configure Environment Variables**:
   In `docker-compose.prod.yml`, verify/update:
   * `SESSION_SECRET`: A long secure random string.
   * `CORS_ORIGIN`: Set to your frontend Vercel URL (e.g., `https://rankforge.vercel.app`).
   * `JUDGE0_API_URL`: Keep as `http://localhost:2358` (since Judge0 is running on the same host).

3. **Start the RankForge Stack**:
   This will spin up brand new, clean databases and services:
   ```bash
   docker compose -f docker-compose.prod.yml up --build -d
   ```

4. **Run Database Migrations**:
   Build the schemas and tables on your fresh database:
   ```bash
   docker compose -f docker-compose.prod.yml exec api bun x prisma db push
   ```

---

## 🔒 Step 4: Reverse Proxy & HTTPS (SSL)
To secure endpoint traffic, we'll route external HTTPS traffic through Nginx to our Express API (port `8000`).

1. **Install Nginx & Certbot**:
   ```bash
   sudo apt install -y nginx certbot python3-certbot-nginx
   ```

2. **Configure Nginx**:
   Create a server block for your API subdomain:
   ```bash
   sudo nano /etc/nginx/sites-available/rankforge-api
   ```
   Paste the following:
   ```nginx
   server {
       server_name api.yourdomain.com;

       location / {
           proxy_pass http://localhost:8000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. **Enable Site & Restart Nginx**:
   ```bash
   sudo ln -s /etc/nginx/sites-available/rankforge-api /etc/nginx/sites-enabled/
   sudo systemctl restart nginx
   ```

4. **Obtain SSL Certificate**:
   ```bash
   sudo certbot --nginx -d api.yourdomain.com
   ```
   *(Select redirect traffic options when prompted to enforce HTTPS).*

---

## 🖥️ Step 5: Deploy Frontend (Vercel - Free)
1. Go to [Vercel](https://vercel.com) and click **Add New Project**.
2. Connect your GitHub repository.
3. Configure the Environment Variables in the project settings:
   * `NEXT_PUBLIC_API_URL` = `https://api.yourdomain.com` (your secure API subdomain link).
4. Click **Deploy**. Vercel will automatically build the Next.js app.

---

## 🩺 Step 6: Verify Deployment
* **Judge0 Health Check**: Open `http://<your-vm-ip>:2358/submissions/active` in your browser. It should return a list or `[]`.
* **API Health Check**: Access `https://api.yourdomain.com/health` or check logs:
  ```bash
  docker compose -f docker-compose.prod.yml logs -f api
  ```
