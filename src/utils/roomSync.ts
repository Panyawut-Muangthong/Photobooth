import Peer, { DataConnection } from 'peerjs';
import { 
  FrameBorderConfig, 
  CaptionConfig, 
  DateStampConfig, 
  FilterId, 
  LayoutId, 
  PhotoSlotData, 
  StickerItem, 
  TransformState 
} from '../types/photobooth';

export interface RoomSyncMessage {
  type: 
    | 'SYNC_FULL_STATE' 
    | 'SLOT_PHOTO_UPDATE' 
    | 'SLOT_TRANSFORM_UPDATE' 
    | 'LAYOUT_UPDATE' 
    | 'STYLE_UPDATE' 
    | 'STICKER_UPDATE'
    | 'TRIGGER_COUNTDOWN'
    | 'PARTNER_CHAT';
  payload: any;
  senderId: string;
  senderName: string;
}

export interface RoomState {
  roomId: string;
  myRole: 'host' | 'guest';
  partnerConnected: boolean;
  partnerName: string;
}

export class PhotoboothRoomManager {
  private peer: Peer | null = null;
  private connection: DataConnection | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private myPeerId: string = '';
  private roomId: string = '';
  private isHost: boolean = false;
  private partnerName: string = 'Partner';
  private onMessageCallback: ((msg: RoomSyncMessage) => void) | null = null;
  private onStatusChangeCallback: ((connected: boolean, partnerName: string) => void) | null = null;

  constructor() {
    try {
      this.broadcastChannel = new BroadcastChannel('lensbooth_room_sync');
      this.broadcastChannel.onmessage = (event) => {
        const msg = event.data as RoomSyncMessage;
        if (msg && msg.payload?.targetRoomId === this.roomId && msg.senderId !== this.myPeerId) {
          if (msg.type === 'SYNC_FULL_STATE' && !this.connection) {
            this.notifyStatus(true, msg.senderName || 'Partner (Local Tab)');
          }
          this.onMessageCallback?.(msg);
        }
      };
    } catch {
      // BroadcastChannel not available in all contexts
    }
  }

  public setCallbacks(
    onMessage: (msg: RoomSyncMessage) => void,
    onStatusChange: (connected: boolean, partnerName: string) => void
  ) {
    this.onMessageCallback = onMessage;
    this.onStatusChangeCallback = onStatusChange;
  }

  private notifyStatus(connected: boolean, partnerName: string) {
    this.onStatusChangeCallback?.(connected, partnerName);
  }

  /**
   * Host creates a room with custom or random code
   */
  public async createRoom(desiredRoomCode: string, myName: string = 'Host'): Promise<string> {
    this.roomId = desiredRoomCode.toUpperCase().trim();
    this.isHost = true;
    const peerId = `lensbooth-${this.roomId}-host`;
    this.myPeerId = peerId;

    return new Promise((resolve) => {
      try {
        this.peer = new Peer(peerId, {
          debug: 1,
        });

        this.peer.on('open', (id) => {
          this.notifyStatus(false, 'Waiting for partner...');
          resolve(this.roomId);
        });

        this.peer.on('connection', (conn) => {
          this.connection = conn;
          this.setupConnectionListeners(conn, 'Guest');
        });

        this.peer.on('error', (err) => {
          console.warn('Peer error (fallback to local tab broadcast channel):', err);
          // Still resolve so local broadcast channel / offline testing continues seamlessly!
          resolve(this.roomId);
        });
      } catch (e) {
        console.warn('Failed to initialize PeerJS, falling back:', e);
        resolve(this.roomId);
      }
    });
  }

  /**
   * Guest joins an existing room with the code
   */
  public async joinRoom(roomCode: string, myName: string = 'Friend'): Promise<boolean> {
    this.roomId = roomCode.toUpperCase().trim();
    this.isHost = false;
    const hostPeerId = `lensbooth-${this.roomId}-host`;
    const guestPeerId = `lensbooth-${this.roomId}-guest-${Math.random().toString(36).substring(2, 6)}`;
    this.myPeerId = guestPeerId;

    return new Promise((resolve) => {
      try {
        this.peer = new Peer(guestPeerId, { debug: 1 });

        this.peer.on('open', () => {
          if (!this.peer) return;
          const conn = this.peer.connect(hostPeerId, {
            reliable: true,
            metadata: { name: myName },
          });

          this.connection = conn;
          this.setupConnectionListeners(conn, 'Host');
          resolve(true);
        });

        this.peer.on('error', (err) => {
          console.warn('Peer join error:', err);
          // Broadcast channel check
          this.broadcastChannel?.postMessage({
            type: 'PARTNER_CHAT',
            payload: { targetRoomId: this.roomId, text: 'Joined via tab' },
            senderId: this.myPeerId,
            senderName: myName,
          });
          resolve(true);
        });
      } catch {
        resolve(false);
      }
    });
  }

  private setupConnectionListeners(conn: DataConnection, defaultPartnerName: string) {
    conn.on('open', () => {
      const pName = (conn.metadata as { name?: string })?.name || defaultPartnerName;
      this.partnerName = pName;
      this.notifyStatus(true, pName);
    });

    conn.on('data', (data) => {
      const msg = data as RoomSyncMessage;
      this.onMessageCallback?.(msg);
    });

    conn.on('close', () => {
      this.notifyStatus(false, 'Partner disconnected');
      this.connection = null;
    });

    conn.on('error', (err) => {
      console.warn('DataConnection error:', err);
    });
  }

  /**
   * Broadcast state changes to room partner
   */
  public broadcast(type: RoomSyncMessage['type'], payload: any, senderName: string = 'You') {
    const message: RoomSyncMessage = {
      type,
      payload: { ...payload, targetRoomId: this.roomId },
      senderId: this.myPeerId,
      senderName,
    };

    // 1. Send via WebRTC DataChannel if connected
    if (this.connection && this.connection.open) {
      this.connection.send(message);
    }

    // 2. Also send via local BroadcastChannel (allows 2 tabs in same browser or iframe to sync immediately!)
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(message);
      } catch (e) {
        console.debug('BroadcastChannel error', e);
      }
    }
  }

  public leaveRoom() {
    if (this.connection) {
      this.connection.close();
      this.connection = null;
    }
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    this.roomId = '';
    this.notifyStatus(false, '');
  }

  public getRoomId(): string {
    return this.roomId;
  }

  public isConnected(): boolean {
    return Boolean(this.connection && this.connection.open);
  }
}

export const roomManager = new PhotoboothRoomManager();
