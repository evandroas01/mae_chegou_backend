/**
 * Exemplo de como integrar o frontend com o backend
 * 
 * Este arquivo mostra como fazer chamadas à API do backend
 * Você pode criar um serviço similar no frontend React Native
 */

const API_BASE_URL = 'http://localhost:3000/api';

// Exemplo de serviço de autenticação
export const authService = {
  async login(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Erro ao fazer login');
    }

    const data = await response.json();
    // Salvar token no AsyncStorage
    // await AsyncStorage.setItem('@token', data.token);
    return data;
  },

  async register(userData: any) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error('Erro ao registrar');
    }

    return response.json();
  },

  async getMe(token: string) {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar usuário');
    }

    return response.json();
  },
};

// Exemplo de serviço de alunos
export const alunoService = {
  async getAll(token: string) {
    const response = await fetch(`${API_BASE_URL}/alunos`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar alunos');
    }

    return response.json();
  },

  async create(token: string, alunoData: any) {
    const response = await fetch(`${API_BASE_URL}/alunos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(alunoData),
    });

    if (!response.ok) {
      throw new Error('Erro ao criar aluno');
    }

    return response.json();
  },
};

// Exemplo de serviço de manutenções
export const manutencaoService = {
  async getAll(token: string, filters?: { status?: string; veiculoId?: string }) {
    const params = new URLSearchParams(filters as any);
    const response = await fetch(`${API_BASE_URL}/manutencoes?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar manutenções');
    }

    return response.json();
  },

  async create(token: string, manutencaoData: any) {
    const response = await fetch(`${API_BASE_URL}/manutencoes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(manutencaoData),
    });

    if (!response.ok) {
      throw new Error('Erro ao criar manutenção');
    }

    return response.json();
  },
};

// Exemplo de serviço de notificações
export const notificacaoService = {
  async getAll(token: string) {
    const response = await fetch(`${API_BASE_URL}/notificacoes`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar notificações');
    }

    return response.json();
  },

  async create(token: string, notificacaoData: any) {
    const response = await fetch(`${API_BASE_URL}/notificacoes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(notificacaoData),
    });

    if (!response.ok) {
      throw new Error('Erro ao criar notificação');
    }

    return response.json();
  },

  async getResponsaveisDisponiveis(token: string) {
    const response = await fetch(`${API_BASE_URL}/notificacoes/responsaveis/disponiveis`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar responsáveis');
    }

    return response.json();
  },
};

