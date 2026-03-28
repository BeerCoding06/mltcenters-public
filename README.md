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

## Docker / Dockploy

รูทโปรเจกต์มี `Dockerfile` และ **`Dockerfile.prod`** (เนื้อหาเดียวกัน — Dockploy มักชี้ไฟล์หลัง) — build แอป Vite แล้วรัน Express ที่เสิร์ฟทั้ง static จาก `dist` และ `POST /api/assess` บนพอร์ตเดียวกัน

```sh
docker build -t mltcenters .
docker run -p 3000:3000 -e OPENAI_API_KEY=sk-... mltcenters
```

**Docker Compose** (ไฟล์ `docker-compose.yml` ใช้ `Dockerfile.prod`):

```sh
# สร้างไฟล์ .env ที่รูท: OPENAI_API_KEY=sk-... (optional ถ้าไม่ใช้ assessment)
docker compose up --build
# เปิด http://localhost:3000
```

บน **Dockploy**: ผูก repo แล้วให้ใช้ Dockerfile ที่รูท, ตั้งค่า environment **`OPENAI_API_KEY`** (บังคับสำหรับ assessment) และถ้าแพลตฟอร์มกำหนดพอร์ต ให้ตั้ง **`PORT`** ให้ตรงกับที่ reverse proxy ชี้เข้ามา (ค่าเริ่มต้นของคอนเทนเนอร์คือ `3000`)
