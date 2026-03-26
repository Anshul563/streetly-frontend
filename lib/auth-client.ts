import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
    baseURL: "https://streetly-backend.onrender.com" // the base url of your express API
})

export const { signIn, signUp, useSession } = authClient;
