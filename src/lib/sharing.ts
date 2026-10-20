// ============================================================================
// Tuck App — P2P Sharing (ToffeeShare-style WebRTC)
// Direct device-to-device data transfer using WebRTC data channels
// ============================================================================

import type { SharePayload } from '@/types';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

type OnDataCallback = (data: SharePayload) => void;
type OnStatusCallback = (status: string) => void;

/**
 * Create an offer (sender side) and return the SDP offer string
 * that can be shared via QR code or link.
 */
export async function createSenderConnection(
  payload: SharePayload,
  onStatus: OnStatusCallback
): Promise<{ offer: string; waitForAnswer: (answer: string) => void }> {
  const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
  const channel = pc.createDataChannel('tuck-share', { ordered: true });

  let resolveIce: () => void;
  const iceComplete = new Promise<void>(r => (resolveIce = r));

  const iceCandidates: RTCIceCandidate[] = [];
  pc.onicecandidate = (e) => {
    if (e.candidate) iceCandidates.push(e.candidate);
    else resolveIce();
  };

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  await iceComplete;

  const fullOffer = JSON.stringify({
    sdp: pc.localDescription,
    candidates: iceCandidates,
  });

  onStatus('Waiting for receiver...');

  channel.onopen = () => {
    onStatus('Connected! Sending data...');
    const jsonStr = JSON.stringify(payload);
    // Send in chunks if large
    const CHUNK_SIZE = 16384;
    for (let i = 0; i < jsonStr.length; i += CHUNK_SIZE) {
      channel.send(jsonStr.slice(i, i + CHUNK_SIZE));
    }
    channel.send('__TUCK_EOF__');
    onStatus('Data sent successfully!');
  };

  return {
    offer: btoa(fullOffer),
    waitForAnswer: async (answerBase64: string) => {
      const answerData = JSON.parse(atob(answerBase64));
      await pc.setRemoteDescription(answerData.sdp);
      for (const candidate of answerData.candidates) {
        await pc.addIceCandidate(candidate);
      }
    },
  };
}

/**
 * Accept an offer (receiver side) and return the SDP answer string
 */
export async function createReceiverConnection(
  offerBase64: string,
  onData: OnDataCallback,
  onStatus: OnStatusCallback
): Promise<string> {
  const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
  const offerData = JSON.parse(atob(offerBase64));

  let resolveIce: () => void;
  const iceComplete = new Promise<void>(r => (resolveIce = r));

  const iceCandidates: RTCIceCandidate[] = [];
  pc.onicecandidate = (e) => {
    if (e.candidate) iceCandidates.push(e.candidate);
    else resolveIce();
  };

  let receivedData = '';

  pc.ondatachannel = (event) => {
    const channel = event.channel;
    onStatus('Connected! Receiving data...');

    channel.onmessage = (msg) => {
      if (msg.data === '__TUCK_EOF__') {
        try {
          const payload: SharePayload = JSON.parse(receivedData);
          onData(payload);
          onStatus('Data received successfully!');
        } catch {
          onStatus('Error: Invalid data received');
        }
      } else {
        receivedData += msg.data;
      }
    };
  };

  await pc.setRemoteDescription(offerData.sdp);
  for (const candidate of offerData.candidates) {
    await pc.addIceCandidate(candidate);
  }

  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  await iceComplete;

  const fullAnswer = JSON.stringify({
    sdp: pc.localDescription,
    candidates: iceCandidates,
  });

  return btoa(fullAnswer);
}

/**
 * Generate a share URL containing the offer (for simple link-based sharing)
 */
export function generateShareUrl(offerBase64: string): string {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/share?offer=${encodeURIComponent(offerBase64)}`;
}
