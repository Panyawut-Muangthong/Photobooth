import React, { useState } from 'react';
import { 
  Users, 
  X, 
  Copy, 
  Check, 
  Wifi, 
  Sparkles, 
  Share2, 
  LogOut, 
  HeartHandshake,
  MessageCircle,
  Camera
} from 'lucide-react';
import { roomManager } from '../utils/roomSync';

interface RoomModalProps {
  currentRoomId: string;
  isConnected: boolean;
  partnerName: string;
  userName: string;
  duoMode: 'shared' | 'alternating';
  onSetDuoMode: (mode: 'shared' | 'alternating') => void;
  onSetUserName: (name: string) => void;
  onCreateRoom: (code: string) => void;
  onJoinRoom: (code: string) => void;
  onLeaveRoom: () => void;
  onSendNudge: (emoji: string, text: string) => void;
  onClose: () => void;
}

export const RoomModal: React.FC<RoomModalProps> = ({
  currentRoomId,
  isConnected,
  partnerName,
  userName,
  duoMode,
  onSetDuoMode,
  onSetUserName,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
  onSendNudge,
  onClose,
}) => {
  const [tab, setTab] = useState<'create' | 'join'>(currentRoomId ? 'create' : 'create');
  const [inputCode, setInputCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [customCode, setCustomCode] = useState(() => `BOOTH-${Math.floor(1000 + Math.random() * 9000)}`);

  const handleCopyCode = () => {
    if (currentRoomId) {
      navigator.clipboard.writeText(currentRoomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCreate = () => {
    onCreateRoom(customCode);
  };

  const handleJoin = () => {
    if (inputCode.trim()) {
      onJoinRoom(inputCode.trim().toUpperCase());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-zinc-100 flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-rose-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 text-base flex items-center space-x-1.5">
                <span>Duo Photobooth Room</span>
                <span className="text-[10px] bg-rose-200 text-rose-800 font-mono font-bold px-1.5 py-0.2 rounded-full">
                  2 Peoples
                </span>
              </h3>
              <p className="text-xs text-zinc-500">
                Snap photos together in real-time with the same room code
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {currentRoomId ? (
            /* ACTIVE ROOM STATE */
            <div className="space-y-5 animate-in fade-in">
              {/* Room Code Banner */}
              <div className="bg-zinc-900 text-white rounded-2xl p-5 text-center relative overflow-hidden shadow-lg">
                <div className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                  Your Room Code
                </div>
                <div className="text-3xl font-black font-mono tracking-wider text-rose-400 my-1">
                  {currentRoomId}
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Share this code with your friend to connect instantly
                </p>

                <div className="mt-4 flex items-center justify-center space-x-2">
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center space-x-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-sm transition active:scale-95 border border-white/10"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied Code!' : 'Copy Code'}</span>
                  </button>
                </div>
              </div>

              {/* Connected Status Card */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                isConnected 
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' 
                  : 'bg-amber-50/70 border-amber-200 text-amber-900'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full animate-ping ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <div>
                    <div className="font-bold text-xs">
                      {isConnected ? '2 People in Room Connected! 🥳' : 'Waiting for Partner to Join...'}
                    </div>
                    <div className="text-[11px] opacity-80">
                      {isConnected ? `You & ${partnerName}` : `Ask friend to enter "${currentRoomId}"`}
                    </div>
                  </div>
                </div>
                <div className="text-xs font-mono font-bold bg-white/80 px-2.5 py-1 rounded-lg border border-black/5 shadow-2xs">
                  {isConnected ? '2 / 2' : '1 / 2'}
                </div>
              </div>

              {/* Duo Role Assignment Mode */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Duo Photo Assignment
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => onSetDuoMode('shared')}
                    className={`p-3 rounded-2xl border text-left transition ${
                      duoMode === 'shared' 
                        ? 'border-rose-500 bg-rose-50/50 ring-2 ring-rose-200' 
                        : 'border-zinc-200 bg-white hover:bg-zinc-50'
                    }`}
                  >
                    <div className="font-semibold text-xs text-zinc-800">Shared Co-Op</div>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      Either person can snap or edit any frame together
                    </p>
                  </button>

                  <button
                    onClick={() => onSetDuoMode('alternating')}
                    className={`p-3 rounded-2xl border text-left transition ${
                      duoMode === 'alternating' 
                        ? 'border-rose-500 bg-rose-50/50 ring-2 ring-rose-200' 
                        : 'border-zinc-200 bg-white hover:bg-zinc-50'
                    }`}
                  >
                    <div className="font-semibold text-xs text-zinc-800">Split Turns (1 & 2)</div>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      You take Odd frames (1 & 3), Partner takes Even (2 & 4)
                    </p>
                  </button>
                </div>
              </div>

              {/* Realtime Nudge Quick Reactions */}
              {isConnected && (
                <div className="space-y-2 bg-zinc-50 p-3.5 rounded-2xl border border-zinc-100">
                  <div className="text-xs font-bold text-zinc-600 flex items-center space-x-1">
                    <MessageCircle className="w-3.5 h-3.5 text-rose-500" />
                    <span>Send Quick Reaction to Partner:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      { emoji: '📸', text: 'Ready to snap!' },
                      { emoji: '✌️', text: 'Peace pose!' },
                      { emoji: '🫶', text: 'Heart cheek!' },
                      { emoji: '✨', text: 'Say Cheese!' },
                      { emoji: '💖', text: 'Love this photo!' }
                    ].map((n) => (
                      <button
                        key={n.text}
                        onClick={() => onSendNudge(n.emoji, n.text)}
                        className="flex items-center space-x-1 px-2.5 py-1.5 bg-white hover:bg-rose-50 text-zinc-700 text-xs rounded-xl border border-zinc-200 shadow-2xs transition active:scale-95"
                      >
                        <span>{n.emoji}</span>
                        <span className="text-[11px]">{n.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Leave Room Button */}
              <div className="pt-2">
                <button
                  onClick={onLeaveRoom}
                  className="w-full flex items-center justify-center space-x-1.5 py-2.5 bg-zinc-100 hover:bg-red-50 text-zinc-600 hover:text-red-600 rounded-xl text-xs font-semibold transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Leave Room</span>
                </button>
              </div>
            </div>
          ) : (
            /* CREATE OR JOIN TABS */
            <div className="space-y-4">
              {/* Tab Selector */}
              <div className="flex bg-zinc-100 p-1 rounded-2xl">
                <button
                  onClick={() => setTab('create')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                    tab === 'create' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  Create New Room
                </button>
                <button
                  onClick={() => setTab('join')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                    tab === 'join' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  Join with Code
                </button>
              </div>

              {/* Nickname input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-600">Your Nickname</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => onSetUserName(e.target.value)}
                  placeholder="e.g. Minji, Alex, Player 1"
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              {tab === 'create' ? (
                /* CREATE FORM */
                <div className="space-y-4 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-600">Generated Room Code</label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={customCode}
                        onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                        className="flex-1 px-3.5 py-2.5 font-mono font-bold text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 uppercase"
                      />
                      <button
                        onClick={() => setCustomCode(`BOOTH-${Math.floor(1000 + Math.random() * 9000)}`)}
                        className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold rounded-xl"
                      >
                        Randomize
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleCreate}
                    className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-500/20 transition active:scale-95 flex items-center justify-center space-x-2"
                  >
                    <HeartHandshake className="w-4 h-4" />
                    <span>Create 2-Player Room</span>
                  </button>
                </div>
              ) : (
                /* JOIN FORM */
                <div className="space-y-4 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-600">Enter Friend's Room Code</label>
                    <input
                      type="text"
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                      placeholder="e.g. BOOTH-4829"
                      className="w-full px-3.5 py-2.5 font-mono font-bold text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 uppercase"
                    />
                  </div>

                  <button
                    onClick={handleJoin}
                    disabled={!inputCode.trim()}
                    className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition active:scale-95 flex items-center justify-center space-x-2"
                  >
                    <Wifi className="w-4 h-4" />
                    <span>Join Room Now</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-100 bg-zinc-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 font-semibold text-xs rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
