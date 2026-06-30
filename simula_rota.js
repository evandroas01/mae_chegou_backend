const baseUrl = 'http://127.0.0.1:3000/api';

async function simular() {
  console.log('🚗 Iniciando simulador de motorista...');

  try {
    // 1. Faz Login como Motorista
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'motorista@maechegou.com', password: 'motorista123' })
    });
    
    if (!loginRes.ok) {
      throw new Error(`Falha no login: ${await loginRes.text()}`);
    }
    
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('✅ Login realizado com sucesso! (motorista@maechegou.com)');

    // 2. Aperta o botão "Ficar Online"
    const onlineRes = await fetch(`${baseUrl}/rotas/online`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    // 409 significa que já estava online, tudo bem.
    if (!onlineRes.ok && onlineRes.status !== 409) {
      throw new Error(`Falha ao ficar online: ${await onlineRes.text()}`);
    }
    console.log('✅ Motorista agora está ONLINE no sistema');

    // ID do veículo gerado no banco pelo seed (normalmente 1)
    const veiculoId = 1;

    // 3. Ponto de partida (Centro de São Paulo, aprox.)
    let lat = -23.55052;
    let lng = -46.633308;

    console.log('🛣️  Enviando coordenadas do GPS a cada 2 segundos... Pressione Ctrl+C para parar.');
    
    // 4. Loop de movimentação contínua
    setInterval(async () => {
      // Simula a van andando quarteirões de forma fluida (aprox. 40 km/h)
      lat -= 0.00015;
      lng += 0.00015;

      try {
        const locRes = await fetch(`${baseUrl}/rotas/localizacao`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({
            veiculoId,
            latitude: lat,
            longitude: lng,
            velocidade: 45, // Km/h fictício
            direcao: 90
          })
        });
        
        if (locRes.ok) {
          console.log(`📍 Ping de GPS enviado: [Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}]`);
        } else {
          console.error('❌ Erro no ping:', await locRes.text());
        }
      } catch (err) {
        console.error('❌ Erro de rede ao enviar ping:', err.message);
      }
    }, 2000); // Roda a cada 2 segundos
    
  } catch (error) {
    console.error('Erro fatal no simulador:', error.message);
  }
}

simular();
