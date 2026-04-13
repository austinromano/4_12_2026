import { useState, useRef } from 'react';
import type { Invitation, AppNotification } from '@ghost/types';
import { api } from '../../lib/api';

export type { Invitation, AppNotification as Notification };

export default function NotificationPopup({ invitations, onAccept, onDecline, notifications, onMarkRead, loopMessages, onRemoveLoop }: {
  invitations: Invitation[];
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  notifications: AppNotification[];
  onMarkRead: () => void;
  loopMessages?: { id: string; from: string; loopName: string; timestamp: string }[];
  onRemoveLoop?: (id: string) => void;
}) {
  return (
    <div className="absolute right-14 top-12 w-80 bg-[#111214] rounded-lg shadow-popup animate-popup z-50 border border-white/5 max-h-96 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
      {invitations.length > 0 && (
        <>
          <div className="p-3 pb-1">
            <span className="text-[12px] font-semibold text-ghost-text-secondary uppercase tracking-wide">Invitations</span>
          </div>
          <div>
            {invitations.map((inv) => (
              <div key={inv.id} className="p-3 border-b border-ghost-border/50">
                <p className="text-xs font-bold text-ghost-green">{inv.inviterName}</p>
                <p className="text-[10px] text-ghost-text-muted mt-0.5">invited you to <span className="text-ghost-text-secondary">{inv.projectName}</span></p>
                <div className="flex gap-1.5 mt-2">
                  <button onClick={() => onAccept(inv.id)} className="px-3 py-1 text-[10px] font-semibold bg-ghost-green/10 text-ghost-green border border-ghost-green/30 rounded hover:bg-ghost-green/20">Accept</button>
                  <button onClick={() => onDecline(inv.id)} className="px-2 py-1 text-[10px] font-semibold text-ghost-text-muted hover:text-ghost-error-red">X</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {notifications.length > 0 && (
        <>
          <div className="p-3 pb-1 flex items-center justify-between">
            <span className="text-[12px] font-semibold text-ghost-text-secondary uppercase tracking-wide">Messages</span>
            <button onClick={onMarkRead} className="text-[11px] text-ghost-purple hover:text-ghost-purple/80 font-medium">Mark all read</button>
          </div>
          <div>
            {notifications.map((n) => (
              <NotificationItem key={n.id} notification={n} />
            ))}
          </div>
        </>
      )}

      {loopMessages && loopMessages.length > 0 && (
        <>
          <div className="p-3 pb-1">
            <span className="text-[12px] font-semibold text-ghost-text-secondary uppercase tracking-wide">Loops Received</span>
          </div>
          <div>
            {loopMessages.map((lm) => (
              <div key={lm.id} className="px-3 py-2 border-b border-ghost-border/50 flex gap-2 items-center">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                  <span className="text-[14px]">🎵</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] text-white font-medium truncate">{lm.loopName}</p>
                  <p className="text-[10px] text-ghost-text-muted">from <span className="text-ghost-green">{lm.from}</span></p>
                </div>
                {onRemoveLoop && (
                  <button onClick={() => onRemoveLoop(lm.id)} className="text-white/30 hover:text-red-400 transition-colors shrink-0">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {invitations.length === 0 && notifications.length === 0 && (!loopMessages || loopMessages.length === 0) && (
        <div className="p-4 text-center text-[13px] text-ghost-text-muted italic">No new notifications</div>
      )}
    </div>
  );
}

/* Notification item with play and accept for loop messages */
function NotificationItem({ notification }: { notification: AppNotification }) {
  const [playing, setPlaying] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [declined, setDeclined] = useState(false);
  const isLoop = notification.message.includes('🎵');

  // Extract loop name from message like "🎵 Loop received: My Cool Loop"
  const loopName = isLoop ? notification.message.replace(/🎵\s*Loop received:\s*/i, '').trim() : '';

  const handleAccept = async () => {
    try {
      const projectName = loopName || 'Received Loop';
      await api.createProject({ name: projectName });
      setAccepted(true);
      await api.markNotificationsRead();
      window.dispatchEvent(new CustomEvent('ghost-refresh-project'));
    } catch (e) {
      console.error('Accept loop failed', e);
    }
  };

  if (declined) return null;

  return (
    <div className="px-3 py-2.5 border-b border-ghost-border/50">
      <div className="flex gap-2 items-center">
        {isLoop ? (
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
            <span className="text-[14px]">🎵</span>
          </div>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5865F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[12px] text-white font-medium leading-snug">{isLoop ? loopName : notification.message}</p>
          <p className="text-[10px] text-ghost-text-muted mt-0.5">
            {new Date(notification.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
          </p>
        </div>
      </div>
      {isLoop && !accepted && (
        <div className="flex gap-1.5 mt-2 ml-10">
          <button onClick={handleAccept} className="px-3 py-1 text-[10px] font-semibold bg-ghost-green/10 text-ghost-green border border-ghost-green/30 rounded hover:bg-ghost-green/20 transition-colors">
            Accept
          </button>
          <button onClick={() => setDeclined(true)} className="px-3 py-1 text-[10px] font-semibold text-white/40 hover:text-red-400 transition-colors">
            Decline
          </button>
        </div>
      )}
      {isLoop && accepted && (
        <p className="text-[10px] text-ghost-green mt-1.5 ml-10">Saved as new project</p>
      )}
    </div>
  );
}

export function BellIcon({ count }: { count: number }) {
  return (
    <div className="relative">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
          {count}
        </span>
      )}
    </div>
  );
}
