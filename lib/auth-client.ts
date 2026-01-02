
import { createAuthClient } from "better-auth/react";
import { magicLinkClient, adminClient } from "better-auth/client/plugins";
import { passkeyClient } from "@better-auth/passkey/client";

export const authClient = createAuthClient({
    baseURL: "http://localhost:3000",
    plugins: [
        magicLinkClient(),
        adminClient(),
        passkeyClient()
    ]
});
