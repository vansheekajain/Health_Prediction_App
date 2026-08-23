import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const configs: Record<string, { bg: string; text: string; label: string }> = {
    CONFIRMED: { bg: 'bg-blue-50 text-blue-700 border-blue-200', text: 'text-blue-700', label: 'Confirmed' },
    COMPLETED: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'text-emerald-700', label: 'Completed' },
    CANCELLED_BY_PATIENT: { bg: 'bg-slate-100 text-slate-700 border-slate-200', text: 'text-slate-700', label: 'Cancelled (Patient)' },
    CANCELLED_BY_DOCTOR: { bg: 'bg-rose-50 text-rose-700 border-rose-200', text: 'text-rose-700', label: 'Cancelled (Doctor)' },
    CANCELLED_DUE_TO_LEAVE: { bg: 'bg-red-50 text-red-700 border-red-200 font-semibold', text: 'text-red-700', label: 'Doctor on Leave' },
    NO_SHOW: { bg: 'bg-purple-50 text-purple-700 border-purple-200', text: 'text-purple-700', label: 'No Show' },
  };

  const current = configs[status] || { bg: 'bg-slate-100 text-slate-700 border-slate-200', label: status };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${current.bg}`}>
      {current.label}
    </span>
  );
};
