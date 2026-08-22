# 📊 Chula AIX - AI Tools Usage Tracker & GitHub Dashboard

ระบบติดตามและวิเคราะห์ระยะเวลาการใช้งาน AI Tools สำหรับ Chula AIX
โดยบันทึกเวลาตั้งแต่ผ่าน **Registration Gate จนถึง Logout** พร้อมแจกแจงเวลาที่เปิดใช้งานแต่ละเครื่องมือ AI อย่างแม่นยำ (Deduplicated Multi-tab Tracking) และแสดงผลบน **GitHub Pages Dashboard**

---

## 📁 โครงสร้างโปรเจกต์

```
AIX/
├── AIX_Usage_Tracker.user.js   # Tampermonkey Userscript สำหรับจับเวลาและส่งขึ้น GitHub
├── dashboard/
│   ├── index.html              # หน้าเว็บ Dashboard (Deploy ขึ้น GitHub Pages ได้ทันที)
│   ├── data/
│   │   └── usage_logs.json     # ฐานข้อมูล JSON ที่เก็บ Session Logs จาก Userscript
│   └── README.md               # คู่มือการติดตั้งและใช้งาน
```

---

## 🚀 ขั้นตอนการติดตั้งและใช้งาน (3 ขั้นตอนง่ายๆ)

### ขั้นตอนที่ 1: สร้าง GitHub Repository และเปิด GitHub Pages

1. ไปที่ [GitHub.com](https://github.com/) แล้วสร้าง Repository ใหม่ (เช่น ชื่อ `chula-aix-tracker`) ตั้งเป็น **Public** (เพื่อให้ GitHub Pages โหลดไฟล์ JSON ได้ง่าย)
2. อัปโหลดไฟล์ทั้งหมดในโฟลเดอร์ `dashboard/` ขึ้นไปไว้ที่ Repository (รวมถึงไฟล์ `index.html` และโฟลเดอร์ `data/usage_logs.json`)
3. ไปที่ **Settings** ของ Repository ➔ เมนู **Pages** ด้านซ้าย
4. ในส่วน **Build and deployment** ให้เลือก:
   * **Source**: `Deploy from a branch`
   * **Branch**: `main` / Folder: `/(root)`
   * กด **Save**
5. รอ 1 นาที จะได้รับ URL สำหรับเปิดดู Dashboard เช่น `https://OarChula.github.io/chula-aix-tracker/`

---

### ขั้นตอนที่ 2: สร้าง GitHub Personal Access Token (สำหรับ Userscript)

เพื่อให้ Userscript ใน Tampermonkey สามารถส่งข้อมูล Log เข้าไปอัปเดตไฟล์ `data/usage_logs.json` ได้อัตโนมัติ:

1. ไปที่ [GitHub Token Settings](https://github.com/settings/tokens)
2. กด **Generate new token (classic)**
3. ตั้งชื่อ Note เช่น `AIX Tracker Token` และติ๊กเลือกสิทธิ์:
   * ✅ `repo` (Full control of private/public repositories)
4. กด **Generate token** ด้านล่างสุด แล้วคัดลอกรหัส Token ที่ได้ (เช่น `ghp_xxxxxxxxxxxxxxxxxxxx`)

---

### ขั้นตอนที่ 3: ตั้งค่าในไฟล์ `AIX_Usage_Tracker.user.js`

เปิดไฟล์ `AIX_Usage_Tracker.user.js` แล้วแก้ไขการตั้งค่าในส่วนหัวข้อ `GITHUB_CONFIG`:

```javascript
const GITHUB_CONFIG = {
    enabled: true,
    owner: "ชื่อผู้ใช้_GitHub_ของคุณ",      // เช่น "OarChula"
    repo: "ชื่อ_Repository_ของคุณ",        // เช่น "chula-aix-tracker"
    branch: "main",
    filePath: "data/usage_logs.json",
    token: "ghp_xxxxxxxxxxxxxxxxxxxx"     // นำ Token จากขั้นตอนที่ 2 มาใส่ตรงนี้
};
```

จากนั้นติดตั้งสคริปต์ลงใน **Tampermonkey** เป็นอันเสร็จสิ้น!

---

## ⏱️ ฟังก์ชันการทำงานของระบบจับเวลา (Multi-tab Deduplication)

* **เริ่มนับเวลา:** เมื่อผู้ใช้ผ่าน Registration Gate และสถานะเปลี่ยนเป็น `active`
* **ระบบป้องกันการนับเวลาซ้อน (Anti-Duplicate Multi-tab):**
  * หากผู้ใช้เปิด ChatGPT 3 แท็บพร้อมกันในช่วงเวลาเดียวกัน ระบบจะรวมเวลานับเป็นระยะเวลาจริงเพียงครั้งเดียว ไม่นับคูณตามจำนวนแท็บ
* **จบ Session & ซิงค์ขึ้น GitHub:**
  * เมื่อผู้ใช้กด **Logout** บน Top bar หรือเมนูในเว็บ ระบบจะคำนวณเวลารวมทั้ง Session และเวลาเปิดแยกรายเครื่องมือ (เช่น ChatGPT 45 นาที, Claude 30 นาที) แล้วส่งไปบันทึกลง GitHub อัตโนมัติ

---

## 📈 ฟีเจอร์ของ Dashboard บน GitHub Pages

1. **Summary Metrics:** สรุปเวลารวมทั้งระบบ, จำนวนรอบการเข้าใช้ (Total Sessions), จำนวนนิสิต/ผู้ใช้ (Unique Users) และ AI Tool ยอดนิยม
2. **Interactive Donut Chart:** แสดงสัดส่วนเปอร์เซ็นต์และเวลารวมที่ใช้กับแต่ละเครื่องมือ AI
3. **Daily Trends Bar Chart:** กราฟแท่งแสดงแนวโน้มชั่วโมงการใช้งานในแต่ละวัน
4. **Top Users Activity:** กราฟจัดอันดับผู้ใช้ที่เปิดใช้งาน AI นานที่สุด
5. **Search & Filter:** ค้นหาตาม Email / Username หรือเลือกกรองตามประเภทเครื่องมือ AI และช่วงเวลา
6. **Export CSV:** ปุ่มดาวน์โหลดรายงานสรุปประวัติการใช้งานเป็นไฟล์ Excel/CSV ได้ในคลิกเดียว
