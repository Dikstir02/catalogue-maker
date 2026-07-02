import { db } from '@/lib/data-store'
import React, { useState } from "react";

import { setAppUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, Loader2 } from "lucide-react";

export default function AppLogin({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const users = await db.entities.AppUser.filter({ username: username.trim() });
    const match = users.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password
    );
    setLoading(false);
    if (match) {
      setAppUser({ id: match.id, username: match.username, role: match.role });
      onLogin({ id: match.id, username: match.username, role: match.role });
    } else {
      setError("Invalid username or password.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="p-3 rounded-xl bg-primary/10">
            <Package className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Catalogue Builder</h1>
          <p className="text-sm text-muted-foreground">Sign in to continue</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-card/60 backdrop-blur-md border border-border/30 rounded-xl p-6 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">Username</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              className="bg-background/50 border-border/50 h-10"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-background/50 border-border/50 h-10"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full h-10 bg-primary hover:bg-primary/90 font-medium">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
          </Button>
        </form>
        <p className="text-center text-xs text-muted-foreground/50 mt-6 italic">by Dexter John Modesto</p>
      </div>
    </div>
  );
}