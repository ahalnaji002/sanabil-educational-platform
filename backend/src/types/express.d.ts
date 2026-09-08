import type { SafeAdmin } from "../modules/auth/auth.types.js";
declare global { namespace Express { interface Request { admin?: SafeAdmin } } }
export {};
