'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { MapPin, RefreshCw, Calendar, ClipboardList } from 'lucide-react';

// Dynamically import Leaflet Map to prevent NextJS server hydration rendering errors
const PatrolMap = dynamic(() => import('@/components/patrol-map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[500px] w-full items-center justify-center rounded-lg border border-slate-800 bg-slate-950/20 text-xs text-slate-500">
      Loading interactive map tiles Canvas...
    </div>
  ),
});

export default function MapPage() {
  const [selectedPatrolId, setSelectedPatrolId] = useState<string>('none');

  // Fetch all completed/active patrol sessions list
  const { data: sessions = [], isLoading: loadingSessions } = useQuery({
    queryKey: ['patrol-sessions'],
    queryFn: async () => {
      const r = await api.get('/patrol');
      return r.data;
    }
  });

  // Fetch route logs details for selected patrol
  const { data: waypoints = [], isLoading: loadingWaypoints, refetch: refetchWaypoints, isFetching: fetchingWaypoints } = useQuery({
    queryKey: ['patrol-route', selectedPatrolId],
    queryFn: async () => {
      if (selectedPatrolId === 'none') return [];
      const r = await api.get(`/patrol/map-data?patrol_id=${selectedPatrolId}`);
      return r.data;
    },
    enabled: selectedPatrolId !== 'none'
  });

  const activePatrol = sessions.find((s: any) => s.id.toString() === selectedPatrolId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Route visualizer Map</h1>
          <p className="text-xs text-slate-400">Select an officer patrol session to trace checkpoints chronologically</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={selectedPatrolId} onValueChange={(val) => setSelectedPatrolId(val || 'none')}>
            <SelectTrigger className="w-[280px] bg-slate-950 border-slate-808 text-white focus:border-teal-505 h-9 text-xs">
              <SelectValue placeholder="Select Patrol Session" />
            </SelectTrigger>
            <SelectContent className="bg-slate-950 border-slate-800 text-white text-xs">
              <SelectItem value="none">Choose patrol session...</SelectItem>
              {sessions.map((s: any) => (
                <SelectItem key={s.id} value={s.id.toString()}>
                  Patrol #{s.id} - {s.officer?.full_name || s.officer?.username} ({new Date(s.start_time).toLocaleDateString()})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedPatrolId !== 'none' && (
            <Button
              onClick={() => refetchWaypoints()}
              variant="outline"
              size="icon"
              className="h-9 w-9 border-slate-800 hover:bg-slate-900 text-slate-400"
              disabled={fetchingWaypoints}
            >
              <RefreshCw size={13} className={fetchingWaypoints ? 'animate-spin' : ''} />
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Canvas */}
        <div className="lg:col-span-2">
          {selectedPatrolId === 'none' ? (
            <div className="flex h-[500px] w-full flex-col items-center justify-center rounded-lg border border-slate-800 bg-slate-950/20 text-center p-6 space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <MapPin size={20} />
              </div>
              <h3 className="text-sm font-semibold text-white">No Route Loaded</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Select a completed or ongoing patrol session from the menu above to render coordinates.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <PatrolMap waypoints={waypoints} />
              
              {activePatrol && (
                <div className="flex flex-wrap gap-4 text-xs bg-slate-950/30 p-3 rounded-lg border border-slate-800/80">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Calendar size={13} className="text-teal-400" />
                    <span className="font-semibold text-slate-300">Started:</span> {new Date(activePatrol.start_time).toLocaleString()}
                  </div>
                  {activePatrol.end_time && (
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Calendar size={13} className="text-teal-400" />
                      <span className="font-semibold text-slate-300">Ended:</span> {new Date(activePatrol.end_time).toLocaleString()}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className="font-semibold text-slate-300">Status:</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      activePatrol.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {activePatrol.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Side Panel: Chronological Waypoints Checklist */}
        <div className="lg:col-span-1">
          <Card className="border-slate-800 bg-slate-900/30 h-full flex flex-col">
            <CardHeader className="border-b border-slate-800/60 pb-4">
              <CardTitle className="text-sm text-white flex items-center gap-1.5">
                <ClipboardList size={14} className="text-teal-400" />
                Checkpoint check times
              </CardTitle>
              <CardDescription className="text-xs">
                Visit sequence for the selected guard route
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto pt-4">
              {selectedPatrolId === 'none' ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Awaiting selection...
                </div>
              ) : loadingWaypoints ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Loading checkpoints...
                </div>
              ) : waypoints.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No checkpoints scanned in this session.
                </div>
              ) : (
                <div className="relative border-l border-slate-800 ml-3 pl-5 space-y-6">
                  {waypoints.map((point: any) => (
                    <div key={point.sequence_order} className="relative">
                      {/* Timeline dot */}
                      <span className="absolute -left-[29px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-teal-500 text-slate-950 text-[9px] font-extrabold ring-4 ring-[#090d16]">
                        {point.sequence_order}
                      </span>
                      
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-white leading-none">
                          {point.location_name}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-mono">
                          NFC: {point.nfc_tag_id}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {new Date(point.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
