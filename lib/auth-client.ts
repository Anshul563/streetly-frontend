import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
    baseURL: "http://localhost:5000" // the base url of your express API
})

export const { signIn, signUp, useSession } = authClient;
