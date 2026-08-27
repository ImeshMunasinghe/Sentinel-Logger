'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please Enter username and password.');
      return;
    }
    setError(null);
    setSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);
      
      const r = await api.post('/auth/login', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Seed account metadata response
      login(r.data.access_token, {
        id: r.data.user_id,
        username: r.data.username,
        full_name: r.data.username === 'admin' ? 'System Administrator' : 'Security Officer',
        role: r.data.role,
      });
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Host communication offline. Start FastAPI server first.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#090d16] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
            🛡️
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">NFC Security Tracker</h2>
          <p className="text-xs text-slate-400">Patrol Logging Console</p>
        </div>
        
        <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-md">
          <form onSubmit={handleSubmit}>
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg text-white">Login</CardTitle>
              <CardDescription>Enter security details to access operations desk</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-xs text-red-400 border border-red-500/20">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Username</label>
                <Input
                  type="text"
                  placeholder="officer1 or admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white placeholder-slate-600 focus:border-teal-500 text-sm"
                  disabled={submitting}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white placeholder-slate-600 focus:border-teal-500 text-sm"
                  disabled={submitting}
                />
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              <Button
                type="submit"
                className="w-full bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-sm"
                disabled={submitting}
              >
                {submitting ? 'Verifying...' : 'Sign In'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
