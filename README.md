# MLTCENTERS Workshop

เว็บแอปและเวิร์กช็อปเรียนภาษาผ่านเทคโนโลยี (React + Vite)

## รันโปรเจกต์ในเครื่อง

ต้องมี Node.js (แนะนำ 18+) และ npm — [ติดตั้งด้วย nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

```sh
git clone <YOUR_GIT_URL>
cd mltcenters
npm install
npm run dev
```

## English Assessment (AI)

แบบทดสอบภาษาอังกฤษแบบโต้ตอบที่ **/assessment**: เสียงพูด, บทสนทนา AI, คะแนนแบบ NLP และหน้าสรุปผล

- **Frontend:** `src/pages/` และ `src/components/assessment/`
- **Backend:** Express ใน `server/` — จาก root ของโปรเจกต์:

  ```sh
  cd server && npm install && OPENAI_API_KEY=sk-your-key npm start
  ```

  API ใช้พอร์ต 3000; ในโหมด dev Vite จะ proxy `/api` ไปที่เซิร์ฟเวอร์นี้

- **เอกสาร:** [docs/ASSESSMENT_PROMPT.md](docs/ASSESSMENT_PROMPT.md)

## เทคโนโลยีหลัก

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Build และ preview

```sh
npm run build
npm run preview
```

## Docker / Dokploy / Traefik

รูทโปรเจกต์มี `Dockerfile` และ **`Dockerfile.prod`** — build แอป Vite แล้วรัน Express ที่เสิร์ฟทั้ง static จาก `dist` และ `/api` บนพอร์ต **3000** (ภายใน Docker เท่านั้น)

### Production (Traefik + Dokploy)

ใช้ **`docker-compose.yml`** — มี Traefik labels สำหรับ `www.mltcenters.com` และ network **`dokploy-network`**

```sh
# บนเซิร์ฟเวอร์ Dokploy: deploy compose จาก repo นี้ (ไม่ publish พอร์ต 3000 ออก host)
# ตั้งค่า .env: OPENAI_API_KEY, SMTP_USER, SMTP_PASS, ...
```

เอกสาร routing / ตรวจสอบ 404: **[docs/TRAEFIK.md](docs/TRAEFIK.md)**

### Local Docker (ไม่ใช้ Traefik)

```sh
docker compose -f docker-compose.yml -f docker-compose.local.yml up --build
# http://localhost:3000
```

### Build image อย่างเดียว

```sh
docker build -f Dockerfile.prod -t mltcenters .
docker run -p 3000:3000 -e OPENAI_API_KEY=sk-... mltcenters
```

บน **Dokploy**: ผูก repo, ใช้ **`Dockerfile.prod`** หรือ **Compose** จาก `docker-compose.yml`, ตั้ง environment (`OPENAI_API_KEY`, `SMTP_*`, …) แล้ว redeploy หลังแก้ Traefik labels
