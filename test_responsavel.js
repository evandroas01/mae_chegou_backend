const fetch = require('node-fetch'); // Use global fetch in Node 18+

async function test() {
  const baseUrl = 'http://127.0.0.1:3000/api';
  
  // Login as responsavel
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'responsavel@maechegou.com', password: 'responsavel123' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;

  console.log('Login responsavel token:', token ? 'OK' : 'FAIL');

  // Test status endpoint
  const statusRes = await fetch(`${baseUrl}/rotas/motorista/status`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('Status Res:', statusRes.status, await statusRes.text());

  // Test localizacao endpoint
  const locRes = await fetch(`${baseUrl}/rotas/localizacao-motorista`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('Localizacao Res:', locRes.status, await locRes.text());
}

test();
