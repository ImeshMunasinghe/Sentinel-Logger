'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, FilterX, Search, ShieldCheck } from 'lucide-react';

function LogsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // URL params state extraction
  const officerParam = searchParams.get('officer_id') || 'all';
  const locationParam = searchParams.get('location_id') || 'all';
  const patrolParam = searchParams.get('patrol_id') || '';
  const dateFromParam = searchParams.get('date_from') || '';
  const dateToParam = searchParams.get('date_to') || '';

  // Local filter states
  const [officerId, setOfficerId] = useState(officerParam);
  const [locationId, setLocationId] = useState(locationParam);
  const [patrolId, setPatrolId] = useState(patrolParam);
  const [dateFrom, setDateFrom] = useState(dateFromParam);
  const [dateTo, setDateTo] = useState(dateToParam);

  // Sync client selections with browser URL navigation
  useEffect(() => {
    setOfficerId(officerParam);
    setLocationId(locationParam);
    setPatrolId(patrolParam);
    setDateFrom(dateFromParam);
    setDateTo(dateToParam);
  }, [officerParam, locationParam, patrolParam, dateFromParam, dateToParam]);

  // Fetch checkpoints metadata
  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const r = await api.get('/locations');
      return r.data;
    }
  });

  // Fetch officer users checklist
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const r = await api.get('/users');
      return r.data.filter((u: any) => u.role === 'officer');
    }
  });

  // Fetch inspection checkpoints logs
  const { data: logs = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['logs', officerParam, locationParam, patrolParam, dateFromParam, dateToParam],
    queryFn: async () => {
      const params: any = {};
      if (officerParam !== 'all') params.officer_id = officerParam;
      if (locationParam !== 'all') params.location_id = locationParam;
      if (patrolParam) params.patrol_id = patrolParam;
      if (dateFromParam) params.date_from = dateFromParam;
      if (dateToParam) params.date_to = dateToParam;
      
      const r = await api.get('/logs', { params });
      return r.data;
    }
  });

  const handleApply = () => {
    const params = new URLSearchParams();
    if (officerId !== 'all') params.set('officer_id', officerId);
    if (locationId !== 'all') params.set('location_id', locationId);
    if (patrolId) params.set('patrol_id', patrolId);
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);
    router.push(`/logs?${params.toString()}`);
  };

  const handleClear = () => {
    setOfficerId('all');
    setLocationId('all');
    setPatrolId('');
    setDateFrom('');
    setDateTo('');
    router.push('/logs');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white">Patrol Activity Logs</h1>
        <p className="text-xs text-slate-400">View and audit sequential security checkpoint scans</p>
      </div>

      {/* Reusable Filters Control Block */}
      <Card className="border-slate-800 bg-slate-900/30">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Officer</label>
              <Select value={officerId} onValueChange={(val) => setOfficerId(val || 'all')}>
                <SelectTrigger className="bg-slate-950 border-slate-800 text-white focus:border-teal-500 h-9 text-xs">
                  <SelectValue placeholder="All Officers" />
                </SelectTrigger>
                <SelectContent className="bg-slate-950 border-slate-800 text-white text-xs">
                  <SelectItem value="all">All Officers</SelectItem>
                  {users.map((u: any) => (
                    <SelectItem key={u.id} value={u.id.toString()}>{u.full_name || u.username}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Checkpoint</label>
              <Select value={locationId} onValueChange={(val) => setLocationId(val || 'all')}>
                <SelectTrigger className="bg-slate-950 border-slate-800 text-white focus:border-teal-500 h-9 text-xs">
                  <SelectValue placeholder="All Checkpoints" />
                </SelectTrigger>
                <SelectContent className="bg-slate-950 border-slate-800 text-white text-xs">
                  <SelectItem value="all">All Checkpoints</SelectItem>
                  {locations.map((loc: any) => (
                    <SelectItem key={loc.id} value={loc.id.toString()}>{loc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Patrol ID</label>
              <Input
                type="number"
                placeholder="Search session..."
                value={patrolId}
                onChange={(e) => setPatrolId(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white focus:border-teal-500 h-9 placeholder-slate-700 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">From Date</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white focus:border-teal-500 h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">To Date</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white focus:border-teal-500 h-9 text-xs"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 justify-end">
            <Button
              onClick={handleClear}
              variant="outline"
              className="border-slate-800 hover:bg-slate-900 text-xs text-slate-300 h-9 font-semibold"
            >
              <FilterX size={13} className="mr-1.5" />
              Reset
            </Button>
            
            <Button
              onClick={handleApply}
              className="bg-teal-500 hover:bg-teal-650 text-slate-950 text-xs h-9 font-bold"
            >
              <Search size={13} className="mr-1.5" />
              Apply Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table Card */}
      <Card className="border-slate-800 bg-slate-900/30">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-sm text-white">Inspection Records</CardTitle>
            <CardDescription className="text-xs">
              Ordered chronologically (latest scans first)
            </CardDescription>
          </div>
          <Button
            onClick={() => refetch()}
            variant="outline"
            className="h-8 border-slate-800 hover:bg-slate-900 text-slate-400"
            disabled={isFetching}
          >
            <RefreshCw size={13} className={`mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-slate-800/80 bg-slate-950/20 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-950/40 border-slate-800">
                <TableRow className="border-slate-850 hover:bg-transparent">
                  <TableHead className="text-slate-400 text-xs font-bold py-3 w-24">Patrol ID</TableHead>
                  <TableHead className="text-slate-400 text-xs font-bold">Checkpoint name</TableHead>
                  <TableHead className="text-slate-400 text-xs font-bold">NFC Tag ID</TableHead>
                  <TableHead className="text-slate-400 text-xs font-bold">Officer</TableHead>
                  <TableHead className="text-slate-400 text-xs font-bold w-20">Sequence</TableHead>
                  <TableHead className="text-slate-400 text-xs font-bold text-right">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs">
                {isLoading ? (
                  <TableRow className="border-slate-850 hover:bg-transparent">
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                      Querying patrol checkin records...
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow className="border-slate-850 hover:bg-transparent">
                    <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                      No matching log files found on server database.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log: any) => (
                    <TableRow key={log.id} className="border-slate-850 hover:bg-slate-900/10">
                      <TableCell className="font-semibold text-slate-300">
                        #{log.patrol_session_id}
                      </TableCell>
                      <TableCell className="text-white font-medium flex items-center gap-1.5 py-3">
                        <span className="text-teal-400 text-xs"><ShieldCheck size={13} /></span>
                        {log.location?.name || 'Unknown Location'}
                      </TableCell>
                      <TableCell className="font-mono text-[10px] text-slate-500">
                        {log.location?.nfc_tag_id || 'N/A'}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {log.officer?.username || 'Officer'}
                        {log.officer?.badge_id && (
                          <span className="text-[10px] bg-slate-900 text-slate-500 px-1.5 py-0.5 rounded font-mono ml-2">
                            {log.officer.badge_id}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center font-bold text-teal-400">
                        {log.sequence_order}
                      </TableCell>
                      <TableCell className="text-right text-slate-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LogsPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[400px] items-center justify-center text-xs text-slate-400">
        Loading sequential checklist logs view...
      </div>
    }>
      <LogsPageContent />
    </Suspense>
  );
}
