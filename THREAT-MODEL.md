# Threat Model — Isolated Gaming Marketplace Admin System

เอกสารฉบับนี้จัดทำขึ้นเพื่อวิเคราะห์ภัยคุกคาม (Threat Vectors), ประเมินระดับความเสี่ยง (Risk Level) และกำหนดมาตรการบรรเทาผลกระทบ (Mitigations) สำหรับระบบ Admin แยกขาดของแพลตฟอร์มจำหน่ายไอดีเกมและเงินในเกม

---

## 1. การวิเคราะห์ภัยคุกคาม 17 ด้าน (Threat Analysis & Mitigations)

| # | Threat Vector | Description | Severity | Mitigation in Architecture |
|---|---------------|-------------|----------|----------------------------|
| 1 | **Bot Scanner** | บอทสแกนหา path มาตรฐาน เช่น `/admin`, `wp-admin`, `.env`, phpMyAdmin | Medium | **Layer 1 Network Isolation**: ย้าย Admin ไปอยู่ Subdomain แยก (`admin-internal.example.com`) ภายใต้ **Cloudflare Zero Trust / Cloudflare Access** พร้อมปิดกั้น Endpoint ของ Admin ในเว็บหน้าร้านเดิม ทำให้ Public Internet ไม่สามารถเชื่อมต่อมาถึง Admin API ได้โดยตรง |
| 2 | **Credential Stuffing** | การนำชุดรหัสผ่านที่รั่วไหลจากเว็บอื่นมาสุ่ม Login อัตโนมัติ | High | **2-Factor Authentication (TOTP)** บังคับใช้ RFC 6238 แม้รหัสผ่านหลุดก็เข้าไม่ได้ + **Account Lockout & Progressive Delay** หลังกรอกผิด 5 ครั้ง |
| 3 | **Brute Force** | ยิงรหัสผ่านหรือโค้ด 2FA ซ้ำๆ เพื่อสุ่มเจาะ | High | **Sliding Window Rate Limiter** ผูกกับ Client IP และ Account Identifier + หน่วงเวลาตอบสนอง (Progressive Delay) + **Security Event Alert** แจ้งเตือนเมื่อผิดติดต่อกัน |
| 4 | **Stolen Admin Password** | รหัสผ่านแอดมินรั่วไหล (จาก Phishing, Keylogger, หรือการตั้งรหัสผ่านซ้ำ) | Critical | บังคับใช้ **TOTP 2FA (Google Authenticator)** เสมอ + รหัสผ่านใน DB เข้ารหัสด้วย **Argon2id** (Memory/Time hardened) ไม่สามารถ Reverse ได้ |
| 5 | **Stolen Session** | ผู้โจมตีขโมย Session Cookie จากเครื่องแอดมิน | High | คุกกี้ตั้งค่า `HttpOnly`, `Secure`, `SameSite=Strict`, ผูก Token Hash ในตาราง `AdminSession` กับ User-Agent/IP, มี **Idle Timeout (30 นาที)**, ระบบ **Session Rotation** ทุกครั้งที่ยืนยันตัวตน และปุ่ม **Revoke All Sessions** ทันที |
| 6 | **Cross-Site Scripting (XSS)** | ฝังมัลแวร์สคริปต์ในชื่อสินค้า ข้อมูลเกม หรือรีวิว เพื่อขโมยข้อมูลแอดมิน | High | React/Next.js Auto-escaping + ไม่ใช้ `dangerouslySetInnerHTML` โดยไม่ sanitize + บังคับใช้ **Strict Content Security Policy (CSP)** ห้าม inline script และห้ามโหลดสคริปต์จาก external untrusted domain |
| 7 | **Cross-Site Request Forgery (CSRF)** | ผู้ไม่หวังดีหลอกให้ Browser ส่ง Request ไปยัง Admin API ในขณะที่มี Session ค้างอยู่ | High | ใช้ `SameSite=Strict` บน Cookie + ตรวจสอบ Origin / Referer Header ทุก Mutating Request (POST, PATCH, DELETE) + Custom Header `X-Admin-Action` ที่เบราว์เซอร์ไม่อนุญาตให้ cross-origin request ส่งได้โดยอัตโนมัติ |
| 8 | **SQL Injection** | เจาะฐานข้อมูลผ่าน Parameter ในการค้นหา หรือกรองข้อมูล | Critical | ใช้ **Prisma ORM** ซึ่งทำ **Parameterized Queries** ในทุกคำสั่งโดยกำเนิด ห้ามนำ String จาก User มาร้อยต่อคำสั่ง SQL ดิบอย่างเด็ดขาด |
| 9 | **Server-Side Request Forgery (SSRF)** | แอดมินหรือระบบดึง URL รูปภาพจากภายนอก แล้วยิงเข้า Private Network / Cloud Metadata | High | ตรวจสอบ Allowlist ของ Domain สำหรับ Assets และไม่เปิด API ให้อนุญาตให้ Backend ทำ arbitrary fetch ไปยัง private IP (`10.0.0.0/8`, `192.168.0.0/16`, `169.254.169.254`) |
| 10 | **Insecure Direct Object References (IDOR)** | แก้ตัวเลข ID เช่น `/api/admin/accounts/123` เป็น `124` เพื่อแอบดูข้อมูลไอดีเกมอื่น | Critical | ทุก Route มีการตรวจสอบสิทธิ์ทั้ง **Authentication (ใคร)**, **Role-Based Authorization (มีสิทธิ์ไหม)** และ **Ownership/Context-level verification** ก่อนตอบสนองทุกครั้ง |
| 11 | **Privilege Escalation** | ผู้ใช้งานระดับ Viewer หรือ Staff แก้ payload เพื่อเปลี่ยนตัวเองเป็น SUPER_ADMIN | Critical | **Strict RBAC Engine** ใน Backend ตรวจสอบ Permissions Matrix ทุก Route + **Mass Assignment Protection** (ห้าม spread request body ลง Prisma query โดยตรง เลือกเฉพาะ whitelist fields ที่อนุญาต) |
| 12 | **API Abuse** | การส่ง Request ปริมาณมากเพื่อกวนการทำงาน หรือพยายาม DoS ภายใน | Medium | Rate Limiting ในทุก Admin Endpoint + ปริมาณขนาด Request Payload (Max 1MB) + Timeout Handling |
| 13 | **Database Leak** | ฐานข้อมูลสำรองหรือตัว DB หลุดจากการโจมตี Server | Critical | ข้อมูลสำคัญยิ่งยวด เช่น รหัสผ่านไอดีเกม (Game Account Credentials) และรหัส Redeem จะถูก **เข้ารหัสด้วย AES-256-GCM** ในระดับ Application Layer ก่อนบันทึกลง Database เสมอ หาก DB หลุด ผู้โจมตีจะได้เพียง Ciphertext |
| 14 | **Insider Threat** | พนักงานภายในระบบแอบดูรหัสไอดีเกมเพื่อนำไปขายเอง | Critical | รหัสผ่านไอดีเกมแสดงผลแบบ Mask (`••••••••`) เสมอ การเปิดดูเต็มต้อง **Re-authenticate (ใส่รหัสผ่าน/TOTP อีกครั้ง)** และสร้าง **Immutable Audit Log** ทันที พร้อมจำกัดสิทธิ์เฉพาะ Role ที่จำเป็น |
| 15 | **Malicious Admin** | แอดมินที่มีสิทธิ์สูงพยายามขโมยข้อมูล Export สต็อกทั้งหมด หรือแก้สิทธิ์เพื่อยึดระบบ | Critical | บังคับใช้ **Dual-Control Approval (Two-Person Rule)**: การ Export สต็อกทั้งหมด, การถอนเงินจำนวนมาก, หรือการแต่งตั้ง SUPER_ADMIN คนใหม่ ต้องผ่านการอนุมัติจากแอดมินคนที่สอง โดยระบบ **บล็อกการอนุมัติรายการของตนเอง (Self-Approval Block)** โดยสิ้นเชิง |
| 16 | **Supply Chain Attack** | Dependency มีมัลแวร์หรือช่องโหว่ (เช่น โดนวางยาใน npm) | High | ตรวจสอบ Package ผ่าน `npm audit` ล็อค `package-lock.json` คัดเลือก Dependency เฉพาะที่เสถียรและมีผู้นิยมใช้สูง ไม่นำ third-party bundle ที่ไม่จำเป็นเข้ามา |
| 17 | **DDoS (Distributed Denial of Service)** | ยิงถล่มให้ระบบหลังบ้านล่ม | High | ซ่อน Admin IP ไว้หลัง **Cloudflare Proxy & Cloudflare Tunnel** ไม่เปิด Public Port ต่ออินเทอร์เน็ตโดยตรง ทำให้ Traffic ถูกกรองผ่าน Cloudflare DDoS Protection ชั้นต้น |

---

## 2. Security Boundaries

```text
+-----------------------------------------------------------------------------------+
| ZONE 1: PUBLIC INTERNET                                                           |
| - Public Customers                                                                |
| - Bots / Scanners                                                                 |
+----------------------------------------+------------------------------------------+
                                         |
                       +-----------------+-----------------+
                       |                                   |
                       v                                   v
+--------------------------------------+   +----------------------------------------+
| ZONE 2: PUBLIC STOREFRONT            |   | ZONE 3: NETWORK ISOLATION PERIMETER    |
| - shop.example.com                   |   | - admin-internal.example.com           |
| - Catalog Browsing / Shopping Cart   |   | - Cloudflare Access (Identity / MFA)   |
| - Customer Login / Register          |   | - IP / Country / Posture Policies      |
| - Order Creation                     |   +-------------------+--------------------+
| - Public Payment Webhook             |                       |
+------------------+-------------------+                       v
                   |                       +----------------------------------------+
                   |                       | ZONE 4: ADMIN APPLICATION PERIMETER    |
                   |                       | - Separate Admin Frontend (Port 3001)  |
                   |                       | - Separate Admin API                   |
                   |                       | - Argon2id / RFC 6238 TOTP 2FA         |
                   |                       | - Cryptographic Session Invalidation   |
                   |                       | - Strict RBAC Matrix                   |
                   |                       | - Dual-Control Approval Engine         |
                   |                       | - AES-256-GCM Crypto Module            |
                   |                       | - Audit Logging & Security Monitor     |
                   |                       +-------------------+--------------------+
                   |                                           |
                   +---------------------+---------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| ZONE 5: HARDENED DATA TIER (PostgreSQL / Neon)                                    |
| - Customer Tables: users, orders, payments, games, products                       |
| - Encrypted Inventory: stock_items (AES-256-GCM ciphertext)                       |
| - Segregated Admin Tables: admin_users, admin_sessions, admin_totp,               |
|   approval_requests, security_events, admin_audit_logs                            |
+-----------------------------------------------------------------------------------+
```

---

## 3. High-Risk Actions Requiring Dual-Control (Two-Person Rule)

ระบบจะบังคับใช้ Two-Person Rule สำหรับคำสั่งที่มีความเสี่ยงสูงดังต่อไปนี้:
1. **Export Stock ทั้งหมด**: ป้องกันการดูดฐานข้อมูลไอดีเกม
2. **Bulk Delete Stock**: ป้องกันการทำลายข้อมูลสินค้า
3. **Role Escalation / เปลี่ยน Role เป็น SUPER_ADMIN**: ป้องกันแอดมินคนเดียวแอบเพิ่มสิทธิ์
4. **สร้างหรือเปิดใช้งาน SUPER_ADMIN คนใหม่**
5. **เปลี่ยน Payment Gateway Configuration หรือถอนเงินจำนวนมาก**
6. **Disable Security Controls หรือปรับเปลี่ยน Security Policy**
