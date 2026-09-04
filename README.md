# Navegação Indoor - Backend

Este projeto consiste na API para o sistema de navegação indoor.

## Requisitos

- Python 3.11+
- MySQL 8.x
- Node.js 18+ (para os projetos de front-end / mobile)

## Setup do Backend

1. Crie um ambiente virtual (virtualenv):
   ```bash
   python -m venv venv
   source venv/bin/activate  # ou venv\Scripts\activate no Windows
   ```

2. Instale as dependências:
   ```bash
   pip install -r backend/requirements.txt
   ```

3. Configure as variáveis de ambiente. Copie o arquivo `.env.example` para `.env` e preencha com suas informações.

4. Crie o banco de dados no MySQL:
   ```sql
   CREATE DATABASE navegacao_indoor;
   ```

5. Rode o script de seed para popular os dados iniciais:
   ```bash
   python backend/seed.py
   ```

6. Inicie o servidor FastAPI a partir da pasta `backend`:
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```

7. Acesse a documentação do Swagger UI gerada pelo FastAPI:
   [http://localhost:8000/docs](http://localhost:8000/docs)

## Exemplos de uso da API

Aqui estão alguns exemplos usando o `curl`:

- **Listar shoppings**
  ```bash
  curl -X GET "http://localhost:8000/shoppings/"
  ```

- **Listar pisos de um shopping**
  ```bash
  curl -X GET "http://localhost:8000/shoppings/1/pisos/"
  ```

- **Obter grafo de um piso**
  ```bash
  curl -X GET "http://localhost:8000/pisos/1/grafo/"
  ```

- **Calcular rota**
  ```bash
  curl -X GET "http://localhost:8000/rota/?origem_id=1&destino_id=18"
  ```

- **Buscar Pontos de Interesse (POIs)**
  ```bash
  curl -X GET "http://localhost:8000/busca/?query=alimentação"
  ```

- **Resolver QR Code**
  ```bash
  curl -X GET "http://localhost:8000/qrcode/ENTRADA-PRINCIPAL"
  ```

- **Endpoints de Admin (usando API Key)**
  ```bash
  curl -X POST "http://localhost:8000/admin/lojas/" -H "X-API-Key: sua-chave-secreta" -d '{"nome":"Nova Loja"}'
  ```

## Painel administrativo

```bash
cd admin
npm install
npm run dev
```

Abra http://localhost:5173 e use a `ADMIN_API_KEY` do backend. Detalhes em `admin/README.md`.

## Estrutura do Projeto

```
navegacao-indoor/
├── backend/
│   ├── app/
│   ├── seed.py
│   └── requirements.txt
├── admin/          # painel web (Vite + React)
├── DECISOES.md
└── README.md
```

## Tecnologias

- **FastAPI** (Python)
- **SQLAlchemy** (ORM)
- **Pydantic** (Validação)
- **MySQL** (Banco de dados via pymysql)
- **Uvicorn** (Servidor ASGI)
