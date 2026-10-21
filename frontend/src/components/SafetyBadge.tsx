import React from 'react';
import { SafetyResult } from '../types/api';
import { CheckCircle2, AlertTriangle, AlertOctagon, Info } from 'lucide-react';

interface SafetyBadgeProps {
  safety?: SafetyResult;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export const SafetyBadge: React.FC<SafetyBadgeProps> = ({
  safety,
  size = 'md',
  showDetails = false,
}) => {
  if (!safety) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
        <Info className="w-3.5 h-3.5" />
        No Safety Data
      </span>
    );
  }

  const statusStr = (safety.status || '').toLowerCase();
  const isReady = statusStr === 'review_ready';
  const isRequired = statusStr === 'review_required';
  const isError = statusStr === 'processing_error';

  let badgeColor = 'bg-amber-950/40 text-amber-300 border-amber-600/40';
  let Icon = AlertTriangle;
  let label = 'REVIEW REQUIRED';

  if (isReady) {
    badgeColor = 'bg-emerald-950/40 text-emerald-300 border-emerald-600/40';
    Icon = CheckCircle2;
    label = 'REVIEW READY';
  } else if (isError) {
    badgeColor = 'bg-rose-950/40 text-rose-300 border-rose-600/40';
    Icon = AlertOctagon;
    label = 'PROCESSING ERROR';
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs sm:text-sm',
    lg: 'px-4 py-2 text-base font-semibold',
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border font-medium tracking-wide ${badgeColor} ${sizeClasses[size]}`}
        >
          <Icon className={size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />
          <span>{label}</span>
        </span>
        <span className="text-xs text-slate-400">
          (Demo Policy Thresholds: AFS ≥ 0.85, Uncertainty ≤ 0.15)
        </span>
      </div>

      {showDetails && safety.reasons && safety.reasons.length > 0 && (
        <div className="mt-2 p-3 rounded-lg bg-amber-950/20 border border-amber-800/30 text-xs text-amber-200/90 space-y-1">
          <div className="font-semibold text-amber-300 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Escalation Reasons / Flagged Conditions:
          </div>
          <ul className="list-disc list-inside space-y-0.5 pl-1">
            {safety.reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
