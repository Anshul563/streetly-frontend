import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_BACKEND_URL // the base url of your express API
})

export const { signIn, signUp, signOut, useSession } = authClient;
