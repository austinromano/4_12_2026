import { useState } from 'react';
import { api } from '../../lib/api';

interface LoopNotification {
  id: string;
  message: string;
  createdAt: string;
}

export default function InboxPopup({ loopNotifications, onMarkRead, onRefresh }: {
  loopNotifications: LoopNotification[];
  onMarkRead: () => void;
  onRefresh: () => void;
}) {
  return (
    <div className="absolute right-14 top-12 w-80 bg-[#111214] rounded-lg shadow-popup animate-popup z-50 border border-white/5 max-h-96 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
      <div className="p-3 pb-1 flex items-center justify-between">
        <span className="text-[12px] font-semibold text-ghost-text-secondary uppercase tracking-wide">Loops Received</span>
        {loopNotifications.length > 0 && (
          <button onClick={onMarkRead} className="text-[11px] text-ghost-purple hover:text-ghost-purple/80 font-medium">Clear all</button>
        )}
      </div>
      {loopNotifications.length === 0 && (
        <div className="p-4 text-center text-[13px] text-ghost-text-muted italic">No loops received</div>
      )}
      <div>
        {loopNotifications.map((n) => (
          <LoopInboxItem key={n.id} notification={n} onRefresh={onRefresh} />
        ))}
      </div>
    </div>
  );
}

function LoopInboxItem({ notification, onRefresh }: { notification: LoopNotification; onRefresh: () => void }) {
  const [accepted, setAccepted] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [playing, setPlaying] = useState(false);

  // Parse loop name — try multiple formats
  const msg = notification.message || '';
  let loopName = msg.replace(/🎵\s*Loop received:\s*/i, '').replace(/🎵\s*/g, '').trim();
  if (!loopName) loopName = msg.replace(/[^\w\s\-_.]/g, '').trim() || 'Received Loop';

  const handleAccept = async () => {
    try {
      const projectName = loopName || 'Received Loop';
      console.log('[Inbox] Creating project:', projectName);
      await api.createProject({ name: projectName });
      setAccepted(true);
      window.dispatchEvent(new CustomEvent('ghost-refresh-project'));
    } catch (e: any) {
      console.error('Accept loop failed:', e?.message || e);
      // Show error to user
      alert('Failed to create project: ' + (e?.message || 'Unknown error'));
    }
  };

  const handlePlay = () => {
    setPlaying(!playing);
    // Visual feedback — actual audio playback would need the file
    if (!playing) {
      setTimeout(() => setPlaying(false), 3000);
    }
  };

  if (declined) return null;

  return (
    <div className="px-3 py-3 border-b border-ghost-border/50">
      <div className="flex gap-2.5 items-center">
        <button onClick={handlePlay} className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all ${playing ? 'bg-purple-500 scale-105' : 'bg-purple-500/20 hover:bg-purple-500/30'}`}>
          {playing ? (
            <svg width="12" height="12" viewBox="0 0 12 14" fill="white"><rect x="1" y="1" width="3.5" height="12" rx="1" /><rect x="7.5" y="1" width="3.5" height="12" rx="1" /></svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 10 12" fill="white" className="ml-0.5"><polygon points="0,0 10,6 0,12" /></svg>
          )}
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] text-white font-medium truncate">{loopName}</p>
          <p className="text-[10px] text-ghost-text-muted mt-0.5">
            {new Date(notification.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
          </p>
        </div>
      </div>
      {!accepted ? (
        <div className="flex gap-2 mt-2.5 ml-[46px]">
          <button onClick={handleAccept} className="px-4 py-1.5 text-[11px] font-semibold bg-ghost-green/15 text-ghost-green border border-ghost-green/30 rounded-lg hover:bg-ghost-green/25 transition-colors">
            Accept
          </button>
          <button onClick={() => setDeclined(true)} className="px-4 py-1.5 text-[11px] font-semibold text-white/30 hover:text-red-400 rounded-lg transition-colors">
            Decline
          </button>
        </div>
      ) : (
        <p className="text-[11px] text-ghost-green mt-2 ml-[46px] font-medium">Saved as new project</p>
      )}
    </div>
  );
}
