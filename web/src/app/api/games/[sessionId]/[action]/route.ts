import { backend } from "@/lib/backend";
const allowed=new Set(["finish","review","replay"]);
export async function POST(_:Request,ctx:{params:Promise<{sessionId:string;action:string}>}) { const {sessionId,action}=await ctx.params; if(!allowed.has(action)) return Response.json({detail:"Unknown action"},{status:404}); return backend(`/api/v1/games/${sessionId}/${action}`,{method:"POST"}); }
