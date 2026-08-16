import{auth,signIn}from"@/auth";import SettingsClient from"./settings-client";import"../words/words.css";import"./settings.css";
export const dynamic="force-dynamic";
export default async function SettingsPage(){const session=await auth();if(!session)return <main className="words-signin"><h1>Sign in to manage your progress.</h1><form action={async()=>{"use server";await signIn("keycloak",{redirectTo:"/settings"})}}><button className="primary">Sign in</button></form></main>;return <SettingsClient/>}
