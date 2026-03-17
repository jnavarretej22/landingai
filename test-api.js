const http = require('http');

const data = JSON.stringify({
  messages: [
    { role: 'user', content: 'Quiero una landing page para mi negocio de pizza llamado Pizza Master. El color debe ser naranja y el numero de whatsapp es 123456789' }
  ],
  images: []
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/generate',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    try {
      if (body === '') {
        console.log('FAILURE: Empty response');
        return;
      }
      const json = JSON.parse(body);
      if (json.success) {
        console.log('SUCCESS: API responded correctly.');
        const hasWA = json.html.includes('wa.me/123456789') || json.html.includes('123456789');
        const hasFixed = json.html.includes('position:fixed');
        console.log('WhatsApp link found:', hasWA);
        console.log('Fixed position found:', hasFixed);
        
        if (hasWA && hasFixed) {
          console.log('TEST PASSED: WhatsApp button is guaranteed.');
        } else {
          console.log('TEST FAILED: WhatsApp button missing or broken.');
        }
      } else {
        console.log('FAILURE: API returned error:', json.error);
      }
    } catch (e) {
      console.log('FAILURE: Could not parse response:', body.substring(0, 100));
    }
  });
});

req.on('error', (e) => {
  console.error(`FAILURE: Request error (is the server running on port 3000?): ${e.message}`);
});

req.write(data);
req.end();
