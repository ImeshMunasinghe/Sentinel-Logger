'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FileDown, ShieldAlert, FileText, CheckCircle } from 'lucide-react';

export default function ReportsPage() {
  const [reportType, setReportType] = useState<string>('officer');
  const [selectedId, setSelectedId] = useState<string>('none');
  const [format, setFormat] = useState<string>('pdf');
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' | 'none' }>({
    text: '',
    type: 'none'
  });

  // Fetch checkpoints metadata
  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const r = await api.get('/locations');
      return r.data;
    },
    enabled: reportType === 'location'
  });

  // Fetch officer users checklist
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const r = await api.get('/users');
      return r.data.filter((u: any) => u.role === 'officer');
    },
    enabled: reportType === 'officer'
  });

  // Fetch all completed/active patrol sessions list
  const { data: sessions = [] } = useQuery({
    queryKey: ['patrol-sessions'],
    queryFn: async () => {
      const r = await api.get('/patrol');
      return r.data;
    },
    enabled: reportType === 'patrol'
  });

  // When report type changes, reset the entity ID picker
  const handleTypeChange = (val: string) => {
    setReportType(val);
    setSelectedId('none');
    setStatusMsg({ text: '', type: 'none' });
  };

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedId === 'none') {
      setStatusMsg({ text: 'Please choose a target profile before exporting.', type: 'error' });
      return;
    }
    
    setStatusMsg({ text: 'Compiling database data, constructing report...', type: 'none' });
    setLoading(true);
    
    try {
      // Secure AJAX file download utilizing Bearer token headers via Blob compilation
      const response = await api.get(`/report?type=${reportType}&id=${selectedId}&format=${format}`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: typeof response.headers['content-type'] === 'string' ? response.headers['content-type'] : 'application/octet-stream' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `report_${reportType}_${selectedId}_${Date.now()}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      
      setStatusMsg({ text: 'Report exported successfully.', type: 'success' });
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ text: 'Export failed. Ensure data is populated on server.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white">Operations Reports Desk</h1>
        <p className="text-xs text-slate-400">Compile chronological patrol inspection logs and access audits into CSV or PDF formats</p>
      </div>

      <Card className="border-slate-800 bg-slate-900/30">
        <form onSubmit={handleDownload}>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-white flex items-center gap-1.5">
              <FileText size={15} className="text-teal-400" />
              Configure Export parameters
            </CardTitle>
            <CardDescription className="text-xs">
              Select metadata bounds and document file types
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status alerts */}
            {statusMsg.type === 'error' && (
              <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-xs text-red-400 border border-red-500/20">
                <ShieldAlert size={14} className="flex-shrink-0" />
                <span>{statusMsg.text}</span>
              </div>
            )}
            {statusMsg.type === 'success' && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-3 text-xs text-emerald-400 border border-emerald-500/20">
                <CheckCircle size={14} className="flex-shrink-0" />
                <span>{statusMsg.text}</span>
              </div>
            )}
            {statusMsg.type === 'none' && statusMsg.text && (
              <div className="flex items-center gap-2 rounded-lg bg-teal-500/10 p-3 text-xs text-teal-400 border border-teal-500/20">
                <div className="h-4 w-4 animate-spin rounded-full border border-teal-500 border-t-transparent flex-shrink-0"></div>
                <span>{statusMsg.text}</span>
              </div>
            )}

            {/* Type selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Report Category</label>
              <Select value={reportType} onValueChange={(val) => handleTypeChange(val || 'officer')}>
                <SelectTrigger className="bg-slate-950 border-slate-808 text-white focus:border-teal-505 h-9 text-xs">
                  <SelectValue placeholder="Select Report Type" />
                </SelectTrigger>
                <SelectContent className="bg-slate-950 border-slate-800 text-white text-xs">
                  <SelectItem value="officer">Officer Activity summary</SelectItem>
                  <SelectItem value="patrol">Single patrol session audit</SelectItem>
                  <SelectItem value="location">Checkpoint check-ins historical log</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dynamic Target Selection Dropdowns */}
            {reportType === 'officer' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Officer</label>
                <Select value={selectedId} onValueChange={(val) => setSelectedId(val || 'none')}>
                  <SelectTrigger className="bg-slate-950 border-slate-800 text-white focus:border-teal-500 h-9 text-xs">
                    <SelectValue placeholder="Pick an officer..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-950 border-slate-800 text-white text-xs">
                    <SelectItem value="none">Pick an officer...</SelectItem>
                    {users.map((u: any) => (
                      <SelectItem key={u.id} value={u.id.toString()}>{u.full_name || u.username}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {reportType === 'patrol' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Patrol session</label>
                <Select value={selectedId} onValueChange={(val) => setSelectedId(val || 'none')}>
                  <SelectTrigger className="bg-slate-950 border-slate-800 text-white focus:border-teal-500 h-9 text-xs">
                    <SelectValue placeholder="Choose Session" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-950 border-slate-800 text-white text-xs">
                    <SelectItem value="none">Pick a patrol session...</SelectItem>
                    {sessions.map((s: any) => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        Patrol Session #{s.id} ({s.officer?.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {reportType === 'location' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Checkpoint Location</label>
                <Select value={selectedId} onValueChange={(val) => setSelectedId(val || 'none')}>
                  <SelectTrigger className="bg-slate-950 border-slate-800 text-white focus:border-teal-500 h-9 text-xs">
                    <SelectValue placeholder="Choose Location" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-950 border-slate-800 text-white text-xs">
                    <SelectItem value="none">Pick a location checkpoint...</SelectItem>
                    {locations.map((loc: any) => (
                      <SelectItem key={loc.id} value={loc.id.toString()}>{loc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Document export format extension */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Document Format</label>
              <Select value={format} onValueChange={(val) => setFormat(val || 'pdf')}>
                <SelectTrigger className="bg-slate-950 border-slate-800 text-white focus:border-teal-505 h-9 text-xs">
                  <SelectValue placeholder="Select Format" />
                </SelectTrigger>
                <SelectContent className="bg-slate-950 border-slate-800 text-white text-xs">
                  <SelectItem value="pdf">Adobe PDF (.pdf)</SelectItem>
                  <SelectItem value="csv">Standard CSV Text (.csv)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs h-9"
              disabled={loading || selectedId === 'none'}
            >
              <FileDown size={14} className="mr-1.5" />
              {loading ? 'Compiling File...' : 'Compile & Download'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
