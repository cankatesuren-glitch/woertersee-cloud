import{backend}from"@/lib/backend";
export async function GET(){return backend("/api/v1/personal-words")}
export async function POST(request:Request){return backend("/api/v1/personal-words",{method:"POST",body:await request.text()})}
