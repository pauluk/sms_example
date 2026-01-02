
"use client";
import { authClient } from "@/lib/auth-client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TEAMS } from "@/config/teams";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [teamId, setTeamId] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [view, setView] = useState<"login" | "magic-link" | "forgot-password">("login"); // 'login' covers sign-in/up
  const [allowedDomains, setAllowedDomains] = useState<string[]>([]);
  const router = useRouter();

  // Fetch allowed domains on load
  const [configLoaded, setConfigLoaded] = useState(false);


  useEffect(() => {
    fetch('/api/system/config')
      .then(res => res.json())
      .then(data => {
        if (data.allowedDomains) {
          setAllowedDomains(data.allowedDomains.split(',').map((d: string) => d.trim()).filter(Boolean));
        }
        setConfigLoaded(true);
      })
      .catch(err => console.error("Failed to load config", err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (view === "magic-link") {
      await authClient.signIn.magicLink({
        email,
        callbackURL: "/dashboard",
      }, {
        onSuccess: () => alert("Magic link sent! Check your email."),
        onError: (ctx: any) => alert(ctx.error.message)
      });
      return;
    }
    if (view === "forgot-password") {
      // @ts-ignore - Lint suggests resetPassword but docs say forgetPassword/requestPasswordReset. Keeping logic.
      await authClient.forgetPassword({
        email,
        redirectTo: "/reset-password",
      }, {
        onSuccess: () => alert("Reset email sent!"),
        onError: (ctx: any) => alert(ctx.error.message)
      });
      return;
    }

    if (isSignUp) {
      // Frontend Domain Check
      if (allowedDomains.length > 0) {
        const emailDomain = email.split('@')[1];
        const isAllowed = allowedDomains.some(domain => emailDomain?.endsWith(domain));
        if (!isAllowed) {
          alert(`Sign up restricted to specific domains: ${allowedDomains.join(', ')}`);
          return;
        }
      }

      console.log("Signing up with:", { email, name, teamId }); // DEBUG
      await authClient.signUp.email({
        email,
        password,
        name,
        teamId,
      } as any, {
        onSuccess: () => {
          alert("Sign up successful!");
          router.push("/dashboard");
        },
        onError: (ctx: any) => alert(ctx.error.message)
      });
    } else {
      await authClient.signIn.email({
        email,
        password,
      }, {
        onSuccess: () => {
          router.push("/dashboard");
        },
        onError: (ctx: any) => alert(ctx.error.message)
      });
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Fin Ops SMS Application</h1>
      <div className="w-full max-w-md p-8 space-y-4 bg-white rounded-xl shadow-lg border border-gray-200 text-gray-900">
        {/* ... headers ... */}
        <h2 className="text-2xl font-bold text-center">
          {view === "magic-link" ? "Magic Link Sign In" :
            view === "forgot-password" ? "Reset Password" :
              isSignUp ? "Create Account" : "Sign In"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && view === "login" && (
            <>
              <div>
                <label className="block text-sm font-medium">Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full mt-1 p-2 border rounded-md" required />
              </div>
              <div>
                <label className="block text-sm font-medium">Department / Team <span className="text-red-500">*</span></label>
                <select
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-md bg-white"
                  required
                >
                  <option value="">Select a Department</option>
                  {Object.entries(TEAMS).map(([key, team]) => (
                    <option key={key} value={key}>{team.label}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mt-1 p-2 border rounded-md" required />
          </div>

          {view === "login" && (
            <div>
              <label className="block text-sm font-medium">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full mt-1 p-2 border rounded-md" required />
              <div className="text-right text-xs mt-1">
                <button type="button" onClick={() => setView("forgot-password")} className="text-blue-600 hover:underline">Forgot password?</button>
              </div>
            </div>
          )}

          <div className="flex justify-center my-4">
            {/* Captcha Disabled */}
          </div>

          <button type="button" onClick={async () => {
            try {
              await authClient.signIn.passkey({
                fetchOptions: {
                  onSuccess: () => {
                    alert("Passkey login successful!");
                    router.push("/dashboard");
                  },
                  onError: (ctx) => {
                    alert(ctx.error.message || "Passkey login failed");
                    console.error("Passkey error:", ctx);
                  }
                }
              });
            } catch (err: any) {
              console.error(err);
              alert("Error triggering passkey: " + err.message);
            }
          }} className="w-full py-2 px-4 mb-2 bg-gray-800 hover:bg-gray-900 text-white rounded-md font-medium flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></svg>
            Sign in with Passkey
          </button>

          <button type="submit" className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium">
            {view === "magic-link" ? "Send Magic Link" :
              view === "forgot-password" ? "Send Reset Email" :
                isSignUp ? "Sign Up" : "Sign In"}
          </button>
        </form>

        <div className="space-y-2 text-center text-sm">
          {view === "login" && (
            <>
              <button onClick={() => setView("magic-link")} className="block w-full text-blue-600 hover:underline">
                Sign in with Magic Link
              </button>
              <div className="border-t pt-2">
                <button onClick={() => setIsSignUp(!isSignUp)} className="text-blue-600 hover:underline">
                  {isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up"}
                </button>
              </div>
            </>
          )}
          {(view === "magic-link" || view === "forgot-password") && (
            <button onClick={() => setView("login")} className="text-gray-500 hover:underline">
              Back to Login
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
