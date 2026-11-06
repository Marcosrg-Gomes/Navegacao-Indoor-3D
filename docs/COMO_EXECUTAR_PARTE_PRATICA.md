# Guia de Execução da Parte Prática — TCC Navegação Indoor 3D

Este documento orienta, passo a passo, a preparação, execução e demonstração da parte prática do projeto **Navegação Indoor 3D** no ambiente local Windows.

---

## A. Pré-requisitos do Ambiente

Antes de iniciar os serviços, verifique se as ferramentas estão instaladas e disponíveis no terminal:

1. **Python 3.11+ ou 3.13**
   - Verificar no terminal: `python --version`
   - O ambiente virtual `.venv` na raiz do projeto já deve estar criado com as dependências instaladas.
2. **Node.js (v18+ ou v20+) e npm**
   - Verificar: `node -v` e `npm -v`
3. **MySQL Server 8.0+**
   - Serviço em execução localmente em `127.0.0.1:3306`.
   - Acesso com usuário administrativo (ex.: `root`).
4. **Navegador Web Moderno**
   - Google Chrome, Microsoft Edge ou Mozilla Firefox com aceleração de hardware / WebGL ativa.

---

## B. Preparação Inicial e Banco de Dados

### 1. Entrar na pasta do projeto e ativar o ambiente virtual

Abra o Prompt de Comando (CMD) ou PowerShell e navegue até a raiz do repositório:

```cmd
cd C:\Users\Dev_2o_Ano\Documents\Marcos\Navegacao-Indoor-3D
.venv\Scripts\activate
```

*(No PowerShell: `.\.venv\Scripts\Activate.ps1`)*

### 2. Configuração do `.env`

O arquivo de configuração do backend fica em `services\api\.env`. Ele já possui as chaves de segurança necessárias.

Exemplo de formato esperado (sem valores sensíveis reais):
```env
DATABASE_URL=mysql+pymysql://<USUARIO>:<SENHA>@127.0.0.1:3306/navegacao_indoor
ADMIN_API_KEY=<CHAVE_HEXADECIMAL_COM_PELO_MENOS_32_CARACTERES>
SECRET_KEY=<CHAVE_JWT_SEGURA>
DEBUG=True
```

### 3. Criação e Carga do Banco MySQL Local

Caso o banco de dados `navegacao_indoor` ainda não exista ou esteja vazio:

1. **Criar o banco de dados via Python/SQLAlchemy (sem alterar outros bancos do servidor):**
   ```cmd
   python -c "from dotenv import dotenv_values; from sqlalchemy import create_engine, text; import re; cfg = dotenv_values('services/api/.env'); m = re.match(r'(mysql\+pymysql://[^/]+)/([^?]+)(.*)', cfg['DATABASE_URL']); engine = create_engine(m.group(1) + m.group(3)); engine.connect().execute(text('CREATE DATABASE IF NOT EXISTS `' + m.group(2) + '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;'))"
   ```

2. **Carregar a base e o catálogo do Mini Shopping:**
   Navegue até `services\api` com o ambiente virtual ativo e execute:
   ```cmd
   cd services\api
   python seed_mini_shopping.py
   ```
   *Esse script é idempotente: ele cria o shopping, os 2 pisos (Térreo e Mezanino), as categorias, as 27 lojas/destinos, 79 nós, 87 arestas e 7 tokens de QR Code, preservando dados caso já existam.*

3. **Publicar e validar o release 3D oficial:**
   ```cmd
   python publish_scene.py ..\..\assets\models\mini-shopping\scene-catalog-v1.json
   ```
   *Valida a integridade do modelo GLB (`mini-shopping-v1.glb`), a conectividade de todos os nós/destinos e publica os ativos estáticos para consumo do frontend.*

---

## C. Execução das Aplicações

O sistema pode ser executado de duas formas:
- **Modo Integrado (Recomendado para demonstração):** A API FastAPI serve o backend, os endpoints REST, os arquivos 3D e as SPAs compiladas do Visitante e do Admin na mesma porta (`8000`).
- **Modo Desenvolvimento Individual:** Cada aplicação roda com seu próprio servidor de recarregamento dinâmico (`Uvicorn`, `Vite` e `Expo Web`).

---

### Opção 1: Modo Integrado (FastAPI unificado — Recomendado)

Após gerar os builds dos frontends:

1. **Build do Painel Admin (se necessário atualizar):**
   ```cmd
   cd C:\Users\Dev_2o_Ano\Documents\Marcos\Navegacao-Indoor-3D\apps\admin
   npm run build
   ```
   *(Gera o build estático em `services/api/app/static/admin`)*

2. **Build da Aplicação Visitante Web (se necessário atualizar):**
   ```cmd
   cd C:\Users\Dev_2o_Ano\Documents\Marcos\Navegacao-Indoor-3D\apps\visitor
   npm run build:web
   ```
   *(Gera o build estático em `services/api/app/static/visitor`)*

3. **Iniciar o Backend FastAPI:**
   ```cmd
   cd C:\Users\Dev_2o_Ano\Documents\Marcos\Navegacao-Indoor-3D\services\api
   ..\..\.venv\Scripts\activate
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

Tudo estará acessível em:
- **Aplicativo Visitante:** `http://127.0.0.1:8000/`
- **Painel Administrativo:** `http://127.0.0.1:8000/admin/`
- **Documentação Interativa Swagger:** `http://127.0.0.1:8000/docs`

---

### Opção 2: Modo Desenvolvimento (Servidores Separados)

Se desejar alterar código e ver atualizações em tempo real com hot-reload:

1. **Terminal 1 — Backend FastAPI:**
   ```cmd
   cd C:\Users\Dev_2o_Ano\Documents\Marcos\Navegacao-Indoor-3D\services\api
   ..\..\.venv\Scripts\activate
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

2. **Terminal 2 — Painel Administrativo (Vite):**
   ```cmd
   cd C:\Users\Dev_2o_Ano\Documents\Marcos\Navegacao-Indoor-3D\apps\admin
   npm run dev
   ```
   *Acesso em: `http://localhost:5173/admin/` (Vite já faz proxy das rotas `/api` e `/static` para `127.0.0.1:8000`)*

3. **Terminal 3 — Aplicativo Visitante (Expo Web):**
   ```cmd
   cd C:\Users\Dev_2o_Ano\Documents\Marcos\Navegacao-Indoor-3D\apps\visitor
   npx expo start --web --port 8081
   ```
   *Acesso em: `http://localhost:8081` (o app redireciona chamadas da API automaticamente para `http://localhost:8000`)*

---

## D. Endereços de Acesso

| Aplicação / Serviço | Modo Integrado (FastAPI) | Modo Dev (Hot-Reload) | Descrição |
| :--- | :--- | :--- | :--- |
| **App Visitante** | `http://127.0.0.1:8000/` | `http://localhost:8081/` | Interface do usuário visitante com mapa 3D, rotas e simulação |
| **Painel Admin** | `http://127.0.0.1:8000/admin/` | `http://localhost:5173/admin/` | Gestão de lojas, nós, rotas, auditoria e bloqueios |
| **API Swagger** | `http://127.0.0.1:8000/docs` | `http://127.0.0.1:8000/docs` | Testes de endpoints e catálogo OpenAPI |
| **Health Check** | `http://127.0.0.1:8000/health` | `http://127.0.0.1:8000/health` | Status de saúde da API |

> [!NOTE]
> Para testar em um smartphone na mesma rede Wi-Fi, substitua `127.0.0.1` pelo IP local do computador (ex.: `192.168.1.15:8000`) e configure `EXPO_PUBLIC_API_URL=http://<SEU_IP>:8000` no app visitante.

---

## E. Roteiro Prático de Demonstração

Para demonstrar o funcionamento completo da solução para a banca avaliadora:

1. **Apresentação da API e Catálogo:**
   - Abra `http://127.0.0.1:8000/docs`.
   - Mostre os endpoints `/api/shoppings`, `/api/pois`, `/api/routes` e `/api/qr-codes/{token}`.
   - Execute o endpoint `GET /api/shoppings/1/scene` para evidenciar a entrega do modelo GLB e contrato espacial.

2. **Abertura do Aplicativo Visitante:**
   - Acesse `http://127.0.0.1:8000/`.
   - O mapa tridimensional do **Mini Shopping** é carregado, exibindo a planta e os pontos de interesse.

3. **Simulação de Leitura de QR Code (Origem):**
   - O sistema possui 7 pontos de QR Code pré-cadastrados.
   - Na aplicação visitante ou informando a URL/parâmetro, posicione a origem na **Entrada Principal** (`token: MINI-ENTRADA-PRINCIPAL`) ou em **Mezanino Central** (`token: MINI-MEZANINO-CENTRAL`).
   - A planta baixa sincroniza a posição inicial e foca no nó de entrada.

4. **Seleção de Destino:**
   - Na barra de busca de lojas / POIs, selecione um destino, como por exemplo:
     - **ADIDAS** (Térreo)
     - **BURGER KING** (Mezanino — exige deslocamento vertical via escada/elevador)
     - **Banheiro Feminino / Família**

5. **Cálculo e Exibição de Rota:**
   - O sistema traça a rota ideal em tempo real sobre o grafo de nós.
   - O painel exibe a distância total em metros, tempo estimado e instruções passo a passo (ex.: *"Siga em frente por 2.6 metros"*, *"Vire à esquerda por 11.1 metros"*).
   - O percurso é desenhado sobre o modelo 3D.

6. **Demonstração de Simulação de Caminhada:**
   - Clique em **"Iniciar demonstração"** no painel de navegação.
   - O indicador de posição percorre os corredores e etapas do percurso até chegar ao destino selecionado.

7. **Apresentação do Painel Administrativo:**
   - Acesse `http://127.0.0.1:8000/admin/`.
   - Autentique-se com a `ADMIN_API_KEY` cadastrada no `.env`.
   - Demonstre a visualização das lojas, status operacional (aberto/fechado), cadastro de nós e a auditoria de alterações.

---

## F. Solução de Problemas Comuns

- **Erro `(1049, "Unknown database 'navegacao_indoor'")`:**
  - O banco ainda não foi criado. Execute o comando de criação do banco descrito na Seção B.3.
- **Erro de integridade de esquema ou colunas faltantes:**
  - Execute `python seed_mini_shopping.py`, que roda automaticamente o `upgrade_schema()`.
- **CORS error no navegador em modo dev:**
  - A API já está configurada com CORS liberado para qualquer origem local (`allow_origins=["*"]`). Verifique se a porta `8000` está em execução.
- **Porta 8000 já em uso:**
  - Encerre o processo anterior ou use `python -m uvicorn app.main:app --port 8001` (lembrando de atualizar as URLs dos frontends).
- **Câmera não abre no navegador desktop:**
  - A leitura de QR Code física via câmera requer dispositivo móvel ou webcam com permissão HTTPS/localhost. No desktop, a simulação direta por token ou clique na interface supre a validação.

---

## G. Encerramento dos Serviços

Para parar a execução:
- No terminal onde o Uvicorn / Vite / Expo estiver rodando, pressione `Ctrl + C`.
- O banco de dados MySQL manterá todos os dados gravados normalmente para a próxima execução.

---

## H. Limitações Conhecidas e Dependências Físicas

1. **Leitura Física de QR Code por Câmera:**
   - A leitura via sensor ótico de câmera exige teste em dispositivo móvel físico (Android/iOS via Expo Go ou build nativo) ou navegador com câmera conectada e permissão de mídia.
2. **WebGL e Renderização 3D:**
   - Depende de placa de vídeo ou aceleração de hardware ativa no navegador.
3. **Ambiente de Rede Externa:**
   - Para uso fora da máquina de desenvolvimento (ex.: tablets do SENAI), é necessário que o dispositivo esteja na mesma rede local ou com túnel HTTP configurado.
