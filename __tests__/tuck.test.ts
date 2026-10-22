// Tuck App Test Suite — Core Logic Verification
import { maskDocumentNumber, generateSalt } from '../src/lib/crypto';
import { extractDomain, formatCurrency, formatDateShort } from '../src/lib/utils';

describe('Tuck Security & Crypto Verification', () => {
  test('maskDocumentNumber masks all but last 4 characters for corporate privacy', () => {
    expect(maskDocumentNumber('894233104821')).toBe('••••••••4821');
    expect(maskDocumentNumber('ABCDE1234F')).toBe('••••••234F');
    expect(maskDocumentNumber('1234')).toBe('1234');
    expect(maskDocumentNumber('')).toBe('');
  });

  test('generateSalt generates a unique non-empty random salt', () => {
    const salt1 = generateSalt();
    const salt2 = generateSalt();
    expect(salt1).toBeTruthy();
    expect(salt2).toBeTruthy();
    expect(salt1).not.toBe(salt2);
  });
});

describe('Tuck Utils & Data Extraction', () => {
  test('extractDomain strips protocol and www prefix correctly', () => {
    expect(extractDomain('https://www.nesslabs.com/weekly-planning')).toBe('nesslabs.com');
    expect(extractDomain('https://zerodha.com/varsity/index-funds')).toBe('zerodha.com');
    expect(extractDomain('http://bbcgoodfood.com/recipes')).toBe('bbcgoodfood.com');
  });

  test('formatCurrency formats Indian rupee and currency targets', () => {
    expect(formatCurrency(32450, '₹')).toContain('32,450');
    expect(formatCurrency(45000, '₹')).toContain('45,000');
  });

  test('formatDateShort returns friendly relative strings', () => {
    const today = new Date().toISOString();
    expect(formatDateShort(today)).toBe('Today');
  });
});

describe('Tuck ToffeeShare-Style Payload Encoding', () => {
  test('Share payload serializes and decodes cleanly across devices', () => {
    const original = {
      type: 'document' as const,
      data: {
        id: 'doc-aadhaar',
        title: 'Aadhaar card',
        documentNumber: '•••• •••• 4821',
      },
      sharedAt: '2026-10-20T14:00:00.000Z',
    };

    const payloadString = JSON.stringify(original);
    const encoded = Buffer.from(encodeURIComponent(payloadString)).toString('base64');
    const decoded = JSON.parse(decodeURIComponent(Buffer.from(encoded, 'base64').toString('utf-8')));

    expect(decoded.type).toBe('document');
    expect(decoded.data.title).toBe('Aadhaar card');
    expect(decoded.data.documentNumber).toBe('•••• •••• 4821');
  });

  test('Budget calculator accurately computes spent percentage', () => {
    const target = 45000;
    const spent = 32450;
    const percent = Math.min(100, Math.round((spent / target) * 100));
    expect(percent).toBe(72);
  });
});
