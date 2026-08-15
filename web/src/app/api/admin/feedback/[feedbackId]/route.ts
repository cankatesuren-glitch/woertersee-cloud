import{backend}from"@/lib/backend";
export async function PATCH(request:Request,ctx:{params:Promise<{feedbackId:string}>}){const{feedbackId}=await ctx.params;return backend(`/api/v1/admin/feedback/${feedbackId}`,{method:"PATCH",body:await request.text()})}
