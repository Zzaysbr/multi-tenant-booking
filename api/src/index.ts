import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { staticPlugin } from '@elysiajs/static';
import { authModule } from "./modules/auth";
import { tenantAuthMiddleware } from "./middlewares/tenantAuth";
import { ownerModule } from "./modules/owner";
import { bookingModule } from "./modules/booking";
import { paymentModule } from "./modules/payment";
import { queueModule } from "./modules/queue";
import { businessHoursModule } from "./modules/business_hours";

const app = new Elysia()
  .use(cors())
  .use(staticPlugin({ assets: 'uploads', prefix: '/uploads' }))
  
 
  .use(authModule)
  
  
  .group("/api/:tenantPath", (apiGroup) => 
    apiGroup
      .use(tenantAuthMiddleware)
      

      .get("/config", async ({ currentTenant }: any) => {
        return { config: currentTenant };
      })
      .use(businessHoursModule)
      .use(queueModule)
      .use(ownerModule)
      
     
      .use(bookingModule)
      .use(paymentModule)
  )
  .listen(3000);

console.log(`🚀 Backend is back online!`);