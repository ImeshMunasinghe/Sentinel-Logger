'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RefreshCw, TrendingUp, Users, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';

export default function AnalyticsPage() {
  const { data: stats, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['analytics-stats'],
    queryFn: async () => {
      const r = await api.get('/analytics');
      return r.data;
    }
  });

  if (isLoading || !stats) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-xs text-slate-400">
        <div className="text-center space-y-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-500 border-t-transparent mx-auto"></div>
          <p>Compiling statistics dashboard charts...</p>
        </div>
      </div>
    );
  }

  const avgMinutes = (stats.average_duration_seconds / 60).toFixed(1);

  // Transform Recharts data keys
  const scansPerOfficer = stats.scans_per_officer.map((o: any) => ({
    name: o.username,
    scans: o.scans
  }));

  const checkpointsVisits = stats.most_visited_locations.map((loc: any) => ({
    name: loc.name,
    visits: loc.visits
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Live Patrol Analytics</h1>
          <p className="text-xs text-slate-400">Aggregate statistics of officer checkins and alerts</p>
        </div>
        <Button
          onClick={() => refetch()}
          variant="outline"
          className="border-slate-800 hover:bg-slate-900 text-slate-450 text-xs h-9"
          disabled={isFetching}
        >
          <RefreshCw size={13} className={`mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh Stats
        </Button>
      </div>

      {/* Grid Highlights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-slate-800 bg-slate-900/20">
          <CardContent className="pt-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Patrols Today</p>
              <h3 className="text-xl font-bold text-white">{stats.total_patrols_today} Runs</h3>
            </div>
            <div className="rounded-lg bg-teal-500/10 p-2.5 text-teal-400 border border-teal-500/20">
              <TrendingUp size={16} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/20">
          <CardContent className="pt-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Patrols This Week</p>
              <h3 className="text-xl font-bold text-white">{stats.total_patrols_week} Runs</h3>
            </div>
            <div className="rounded-lg bg-teal-500/10 p-2.5 text-teal-450 border border-teal-550/20">
              <Activity size={16} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/20">
          <CardContent className="pt-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Avg Run Duration</p>
              <h3 className="text-xl font-bold text-white">{avgMinutes} Min</h3>
            </div>
            <div className="rounded-lg bg-teal-500/10 p-2.5 text-teal-400 border border-teal-500/20">
              <Activity size={16} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/20">
          <CardContent className="pt-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Patrols</p>
              <h3 className="text-xl font-bold text-teal-400">{stats.active_patrols_count} Online</h3>
            </div>
            <div className="rounded-lg bg-emerald-500/10 p-2.5 text-emerald-400 border border-emerald-500/20">
              <Activity size={16} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Checkpoint frequency */}
        <Card className="border-slate-805 bg-slate-900/20">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-white">Top Checkpoint Scans</CardTitle>
            <CardDescription className="text-xs">
              Frequent scan checkpoints visits frequency distribution
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[280px] pt-4">
            {checkpointsVisits.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-slate-500">
                No location scan data compiled.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={checkpointsVisits} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
                  <YAxis stroke="#64748b" fontSize={9} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
                    labelStyle={{ color: '#ffffff', fontSize: 10, fontWeight: 'bold' }}
                    itemStyle={{ color: '#14b8a6', fontSize: 10 }}
                  />
                  <Bar dataKey="visits" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Officer efficiency */}
        <Card className="border-slate-805 bg-slate-900/20">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-white">Scans By Security Officer</CardTitle>
            <CardDescription className="text-xs">
              Checkpoint count leaderboard by authenticated profiles
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[280px] pt-4">
            {scansPerOfficer.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-slate-500">
                No officer activity logged.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scansPerOfficer} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
                  <YAxis stroke="#64748b" fontSize={9} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
                    labelStyle={{ color: '#ffffff', fontSize: 10, fontWeight: 'bold' }}
                    itemStyle={{ color: '#0ea5e9', fontSize: 10 }}
                  />
                  <Bar dataKey="scans" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerts Table: Missed Checkpoints */}
      <Card className="border-slate-800 bg-slate-900/20">
        <CardHeader className="flex flex-row items-center gap-2 pb-4">
          <div className="rounded-lg bg-amber-500/10 p-2 text-amber-500 border border-amber-500/20">
            <AlertTriangle size={15} />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold text-white">Missed Checkpoint Alerts</CardTitle>
            <CardDescription className="text-xs">
              Checkpoints with no scans in the last 3 days
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-slate-800 bg-slate-950/20 overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/40 text-slate-400 font-bold border-b border-slate-800">
                  <th className="py-3 px-4">Checkpoint Name</th>
                  <th className="py-3 px-4">Alert Severity</th>
                  <th className="py-3 px-4 text-right">Last Inspected</th>
                </tr>
              </thead>
              <tbody>
                {stats.missed_checkpoints.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-6 text-slate-500">
                      All checkpoints inspected within schedule parameter limits.
                    </td>
                  </tr>
                ) : (
                  stats.missed_checkpoints.map((cp: any, i: number) => {
                    const neverScanned = cp.days_since_last_scan === null;
                    return (
                      <tr key={i} className="border-b border-slate-850 hover:bg-slate-900/10">
                        <td className="py-3 px-4 font-semibold text-white flex items-center gap-1.5">
                          <span className="text-amber-550"><ShieldCheck size={13} /></span>
                          {cp.name}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            neverScanned 
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                          }`}>
                            {neverScanned ? 'HIGH RISK' : 'SCHEDULE OVERDUE'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-slate-400 font-medium">
                          {neverScanned 
                            ? 'Never Scanned' 
                            : `${cp.days_since_last_scan} days ago`
                          }
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
