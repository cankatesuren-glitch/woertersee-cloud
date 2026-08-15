import{auth,signIn}from"@/auth";import AdminClient from"./admin-client";import"../words/words.css";
export const dynamic="force-dynamic";
export default async function AdminPage(){const session=await auth();if(!session)return <main className="words-signin"><h1>Sign in to open administration.</h1><form action={async()=>{"use server";await signIn("keycloak",{redirectTo:"/admin"})}}><button className="primary">Sign in</button></form></main>;return <AdminClient/>}
