import { NextResponse } from 'next/server';
import os from 'os';

export async function GET() {
  const interfaces = os.networkInterfaces();
  let localIp = '127.0.0.1';

  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        // Prefer standard Wi-Fi or LAN addresses like 192.168.* or 10.*
        if (net.address.startsWith('192.168.') || net.address.startsWith('10.')) {
          localIp = net.address;
          break;
        }
        if (localIp === '127.0.0.1') {
          localIp = net.address;
        }
      }
    }
  }

  return NextResponse.json({
    ip: localIp,
    port: 3000,
    origin: `http://${localIp}:3000`,
  });
}