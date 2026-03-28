# ตั้ง Caddy เป็น reverse proxy หน้าเซิร์ฟเวอร์ (ร่วมกับ Dokploy)

เอกสารนี้สรุปขั้นตอนที่ใช้เมื่อ **พอร์ต 80/443 บน host ถูก container `caddy` รับ** แต่แอปจาก Dokploy (Docker Swarm) **ไม่ได้ publish พอร์ตออก host** — ต้องให้ Caddy ส่งต่อเข้า **ชื่อ Swarm service + พอร์ตภายใน** บน network เดียวกัน

## สถาปัตยกรรมสั้นๆ

- **Caddy** → ฟัง `0.0.0.0:80`, `443` (TLS อัตโนมัติด้วย Let’s Encrypt สำหรับโดเมนที่ชี้มาที่เครื่องนี้)
- **แอป Dokploy** → ฟังเฉพาะใน Docker network (เช่นพอร์ต `3000` ภายใน) ชื่อ service เช่น `mltcenters-frontendmltcenter-ib2evs`
- **Network ร่วม:** `dokploy-network` (ชื่อจริงอาจตรวจได้จากขั้นตอนด้านล่าง)

## 1) หาชื่อ Docker Swarm service ของแอป

```bash
docker service ls | grep -i mltcenter
```

ตัวอย่างผลลัพธ์ (คอลัมน์ NAME):

```text
mltcenters-frontendmltcenter-ib2evs
```

ใช้ชื่อนี้เป็น hostname ใน `reverse_proxy` (ไม่ใช้ชื่อ task แบบ `....1.xxxxx` เพราะเปลี่ยนทุกครั้งที่ deploy)

## 2) ตรวจว่า Caddy อยู่ network เดียวกับ service

หา network ID ที่ service ใช้:

```bash
docker service inspect mltcenters-frontendmltcenter-ib2evs --format '{{range .Spec.TaskTemplate.Networks}}{{.Target}}{{println}}{{end}}'
```

ตรวจชื่อ network:

```bash
docker network inspect <ID_จากคำสั่งบน> --format '{{.Name}}'
```

ตัวอย่างที่พบได้: **`dokploy-network`**

ถ้า Caddy **ยังไม่** อยู่ network นี้:

```bash
docker network connect dokploy-network caddy
```

ถ้าขึ้นว่า **already attached** = ใช้ได้แล้ว ไม่ต้องทำซ้ำ

ตรวจอีกครั้ง:

```bash
docker inspect caddy --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{"\n"}}{{end}}'
```

## 3) ตำแหน่งไฟล์ Caddyfile บน host

```bash
docker inspect caddy --format '{{range .Mounts}}{{.Source}} -> {{.Destination}}{{"\n"}}{{end}}'
```

ตัวอย่างที่ใช้ในการติดตั้งนี้:

```text
/root/Caddyfile -> /etc/caddy/Caddyfile
```

แก้ไขบน host:

```bash
nano /root/Caddyfile
```

## 4) ตัวอย่าง Caddyfile แบบเต็ม (รวมโดเมนอื่นบนเครื่องเดียวกัน)

ปรับชื่อ service / โดเมนให้ตรงของคุณ

```caddy
www.yardsaleth.com {
	reverse_proxy yardsalethailand-nuxt-8p0ykj:3000
}

cms.yardsaleth.com {
	reverse_proxy wordpress:80
}

api.yardsaleth.com {
	reverse_proxy 172.17.0.1:4000
}

www.mltcenters.com {
	reverse_proxy mltcenters-frontendmltcenter-ib2evs:3000
}

mltcenters.com {
	redir https://www.mltcenters.com{uri}
}
```

หมายเหตุ:

- **พอร์ต `3000`** ต้องตรงกับที่แอปฟังใน container (โปรเจกต์นี้ใช้ค่าเริ่มต้น 3000)
- บล็อก `cms.yardsaleth.com` ชี้ `wordpress:80` — ถ้าไม่มี container/service ชื่อ `wordpress` จะได้ 502 และ log Caddy เป็น `lookup wordpress: no such host`; แก้โดยรัน WordPress จริงหรือลบ/แก้บล็อกนั้น

## 5) ตรวจ syntax และ reload

```bash
docker exec caddy caddy validate --config /etc/caddy/Caddyfile
docker exec caddy caddy reload --config /etc/caddy/Caddyfile
```

จัดรูป Caddyfile (ไม่บังคับ):

```bash
docker exec caddy caddy fmt --overwrite --config /etc/caddy/Caddyfile
docker exec caddy caddy reload --config /etc/caddy/Caddyfile
```

## 6) ทดสอบจากเซิร์ฟเวอร์

อย่าใช้ `curl https://127.0.0.1` พร้อมแค่ header `Host:` เพราะ **SNI ของ TLS จะไม่ตรงโดเมน** — ใช้ `--resolve` แทน:

```bash
curl -sI --resolve www.mltcenters.com:443:127.0.0.1 https://www.mltcenters.com/
```

ค่าที่คาดหวัง: `HTTP/2 200`, `via: Caddy`, `x-powered-by: Express` (ถ้าเป็นแอป stack นี้)

ทดสอบ HTTP (มัก redirect ไป HTTPS):

```bash
curl -sI --resolve www.mltcenters.com:80:127.0.0.1 http://www.mltcenters.com/
```

## 7) Checklist ก่อนถือว่าเสร็จ

- [ ] DNS `www` (และถ้ามี apex) ชี้ **A record** มาที่ IP เซิร์ฟเวอร์นี้
- [ ] Firewall เปิด **80** และ **443** เข้าเครื่อง
- [ ] Caddy อยู่ **network เดียวกับ** Swarm service ของแอป
- [ ] `reverse_proxy` ใช้ **ชื่อ service** และ **พอร์ตภายใน** ถูกต้อง
- [ ] `caddy validate` ผ่าน และ `reload` แล้ว

## 8) หลัง redeploy บน Dokploy

ถ้า Dokploy สร้าง **ชื่อ service ใหม่** (ไม่บ่อย แต่เป็นไปได้ถ้าสร้างแอปใหม่) ให้รัน `docker service ls` แล้วอัปเดตชื่อใน `reverse_proxy` ใน Caddyfile แล้ว reload อีกครั้ง

---

*เอกสารนี้อ้างอิงการติดตั้งจริง: Caddy + Dokploy บน `dokploy-network`, แอป MLTCENTERS ที่ service `mltcenters-frontendmltcenter-ib2evs:3000`.*
