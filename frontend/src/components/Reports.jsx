import React, { useEffect } from 'react';
import { useVidyut } from '../VidyutContext';
import { motion } from 'framer-motion';
import { Download, FileSpreadsheet, RefreshCw, Cloud, CloudOff, ExternalLink, Printer } from 'lucide-react';

export default function Reports() {
  const { history, historyLoading, fetchHistory, cloudStatus, analysisResult } = useVidyut();

  useEffect(() => {
    fetchHistory();
  }, []);

  const exportCSV = () => {
    if (history.length === 0) return;
    
    // Prepare headers
    const headers = ['Timestamp', 'Sync ID', 'Cloud Status', 'Resident Name', 'House Type', 'Monthly Bill (Rs)', 'Usage (kWh)', 'Savings (Rs)', 'S3 Key'];
    const rows = history.map(item => {
      const p = item.profile || {};
      return [
        item.timestamp,
        item.sync_id,
        item.cloud_provider,
        p.fullName || 'User',
        p.houseType || 'Apartment',
        item.current_bill || 0,
        item.current_units || 0,
        item.estimated_savings || 0,
        item.s3_object_key || ''
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.map(val => `"${val}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "vidyut_energy_reports.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 p-6 md:p-8 font-sans bg-slate-50/20">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-display tracking-tight">Audit Reports Archive</h2>
          <p className="text-slate-400 text-xs mt-0.5 font-medium">Export energy models or view historical cloud audits.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportCSV}
            disabled={history.length === 0}
            className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
          >
            <FileSpreadsheet size={14} />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/10 transition-all"
          >
            <Printer size={14} />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* AWS S3 status overview card */}
      <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.005)] flex items-center gap-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
          cloudStatus.connected ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
        }`}>
          {cloudStatus.connected ? <Cloud size={20} /> : <CloudOff size={20} />}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider leading-none">AWS S3 Infrastructure Status</h4>
          <p className="text-slate-400 text-[11px] mt-1.5 leading-normal">{cloudStatus.message}</p>
        </div>
        <button
          onClick={fetchHistory}
          disabled={historyLoading}
          className="p-2 border border-slate-150 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors shrink-0 disabled:opacity-50"
        >
          <RefreshCw size={14} className={historyLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Reports Table Card */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.005)] overflow-hidden">
        <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/20">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Historical records log</h3>
          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-full">
            {history.length} records found
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/60 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <th className="p-4 pl-6 font-semibold">Timestamp</th>
                <th className="p-4 font-semibold">Sync ID</th>
                <th className="p-4 font-semibold">Resident</th>
                <th className="p-4 font-semibold">Monthly Bill</th>
                <th className="p-4 font-semibold">Usage (kWh)</th>
                <th className="p-4 font-semibold">Savings (₹)</th>
                <th className="p-4 pr-6 font-semibold">AWS Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-medium text-slate-600">
              {historyLoading ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-400 font-medium">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw size={20} className="animate-spin text-blue-600" />
                      <span>Loading S3 archive list...</span>
                    </div>
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-400 font-medium">
                    No reports synced. Complete the energy survey to upload your first analysis!
                  </td>
                </tr>
              ) : (
                history.map((record) => {
                  const profile = record.profile || {};
                  return (
                    <tr key={record.sync_id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="p-4 pl-6 text-slate-500 font-mono">
                        {record.timestamp ? new Date(record.timestamp).toLocaleString() : '---'}
                      </td>
                      <td className="p-4 text-slate-400 font-mono truncate max-w-[120px]" title={record.sync_id}>
                        {record.sync_id}
                      </td>
                      <td className="p-4 text-slate-800 font-semibold">
                        {profile.fullName || 'Srivatsa Rajeev'}
                      </td>
                      <td className="p-4 text-slate-800 font-semibold">
                        ₹{record.current_bill || 0}
                      </td>
                      <td className="p-4 text-slate-800">
                        {record.current_units || 0} kWh
                      </td>
                      <td className="p-4 text-emerald-600 font-semibold">
                        +₹{record.estimated_savings || 0}
                      </td>
                      <td className="p-4 pr-6">
                        {record.s3_url ? (
                          <a
                            href={record.s3_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline font-semibold"
                          >
                            <span>JSON Record</span>
                            <ExternalLink size={12} />
                          </a>
                        ) : (
                          <span className="text-slate-400 font-normal">Mock Mode URL</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          aside, header, button, .no-print {
            display: none !important;
          }
          #print-section, #print-section * {
            visibility: visible;
          }
          #print-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            color: #000;
          }
        }
      `}</style>
    </div>
  );
}
