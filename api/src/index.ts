// api/src/index.ts
import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { staticPlugin } from '@elysiajs/static';
import { rateLimit } from "elysia-rate-limit";

// Middlewares
import { tenantAuthMiddleware } from "./middlewares/tenantAuth";

// Modules / Routes
import { authModule } from "./modules/auth"; 
import { userRoutes } from "./routes/userRoutes"; 
import { ownerModule } from "./modules/owner";
import { bookingModule } from "./modules/booking";
import { paymentModule } from "./modules/payment";
import { queueModule } from "./modules/queue";
import { businessHoursModule } from "./modules/business_hours";
import { adminModule } from "./modules/admin";

const app = new Elysia()
  // --- 🛡️ 1. Rate Limit (OWASP A07 - Anti Brute Force) ---
  .use(rateLimit({
    duration: 60000, // 1 นาที
    max: 100, // 100 ครั้งต่อนาที
    // ✅ ใช้ 'error' แทน 'errorResponse' เพื่อให้ตรงตาม Type ล่าสุดของปลั๊กอิน
    errorResponse: "คุณทำรายการบ่อยเกินไป กรุณาลองใหม่ในอีก 1 นาที"
  }))

  // --- 🛡️ 2. Global Security Setup (OWASP A05) ---s
  .use(cors({
    origin: (request) => {
      const origin = request.headers.get('origin');
      const allowedOrigins = [
        'http://localhost:5173', 
        process.env.FRONTEND_URL
      ];
      
      // ✅ ถ้าเป็น localhost หรือตรงกับ FRONTEND_URL หรือลงท้ายด้วย .vercel.app ให้ผ่านได้เลย
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        return true;
      }
      return false;
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
    preflight: true
  }))

  // --- 🛡️ 3. Global Error Handling (OWASP A05) ---
  .onError(({ code, error, set }) => {
    const errorMessage = error instanceof Error ? error.message : "Unknown Error";
    console.error(`🔥 [Security Log] Error ${code}:`, errorMessage);
    
    if (code === 'VALIDATION') {
      set.status = 400;
      return { error: "ข้อมูลที่ส่งมาไม่ถูกต้อง", details: error.all };
    }
    if (code === 'NOT_FOUND') {
      set.status = 404;
      return { error: "ไม่พบหน้าที่คุณต้องการ (404)" };
    }
    
    set.status = 500;
    return { error: "Internal Server Error" }; // ปิดบัง Stack Trace เพื่อความปลอดภัย
  })
  
  .use(staticPlugin({ assets: 'public', prefix: '' }))

  // --- 🔑 4. Global Routes (Root Level) ---
  // สำหรับ Google OAuth Redirect
  .use(authModule)

  // --- 🌐 5. API GROUP (แก้ปัญหา 404 Conflict) ---
  .group("/api", (api) => api
    .use(authModule)  
    .use(userRoutes)  
    .use(adminModule)

    // --- 🏪 6. Tenant Specific Routes (OWASP A01 Isolation) ---
    .group("/:tenantPath", (apiGroup) => 
      apiGroup
        .use(tenantAuthMiddleware)
        .get("/config", async ({ currentTenant, set }: any) => {
          if (!currentTenant) { 
            set.status = 404; 
            return { error: "ไม่พบร้านค้านี้ในระบบ" }; 
          }
          return { config: currentTenant };
        })
        .use(businessHoursModule)
        .use(queueModule)
        .use(ownerModule)
        .use(bookingModule)
        .use(paymentModule)
    )
  )
  
  .listen(process.env.PORT || 3000);

console.log(`🦊 [Security Armed] Cozy Backend online at port ${app.server?.port}`);