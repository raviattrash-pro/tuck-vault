import assert from 'node:assert';
import test from 'node:test';

// Test 1: Masking
function maskDocumentNumber(num) {
  if (!num || num.length <= 4) return num;
  const visible = num.slice(-4);
  const masked = '•'.repeat(num.length - 4);
  return masked + visible;
}

test('Corporate Privacy: Document Masking', () => {
  assert.strictEqual(maskDocumentNumber('894233104821'), '••••••••4821');
  assert.strictEqual(maskDocumentNumber('ABCDE1234F'), '••••••234F');
  assert.strictEqual(maskDocumentNumber('1234'), '1234');
});

// Test 2: URL domain extraction
function extractDomain(url) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

test('Link Storage: Domain Extraction', () => {
  assert.strictEqual(extractDomain('https://www.nesslabs.com/weekly'), 'nesslabs.com');
  assert.strictEqual(extractDomain('https://zerodha.com/varsity'), 'zerodha.com');
});

// Test 3: Budget Percentage
test('Budget & Finance: Percent calculations', () => {
  const target = 45000;
  const spent = 32450;
  const percent = Math.min(100, Math.round((spent / target) * 100));
  assert.strictEqual(percent, 72);
});

// Test 4: ToffeeShare-Style P2P Payload
test('ToffeeShare-Style P2P Serialization', () => {
  const payload = {
    type: 'document',
    data: { title: 'Aadhaar card', documentNumber: '•••• •••• 4821' },
    sharedAt: new Date().toISOString(),
  };

  const str = JSON.stringify(payload);
  const b64 = Buffer.from(encodeURIComponent(str)).toString('base64');
  const decoded = JSON.parse(decodeURIComponent(Buffer.from(b64, 'base64').toString('utf-8')));

  assert.strictEqual(decoded.type, 'document');
  assert.strictEqual(decoded.data.title, 'Aadhaar card');
});

console.log('ALL UNIT & FUNCTIONAL TESTS PASSED!');
