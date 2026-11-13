# Navegação Indoor 3D — execução local

Este guia descreve os comandos existentes no monorepo. O [README](README.md)
é a referência para arquitetura, validação e publicação do catálogo espacial.

## Requisitos

- Python 3.11 ou superior;
- Node.js 22 ou superior e npm;
- Blender 4.5.14 LTS somente para regenerar o modelo 3D;
- MySQL somente para a execução persistente. A demonstração isolada abaixo usa
  SQLite temporário e não requer Docker nem altera bancos existentes.

## Instalação

Na raiz do repositório:

```powershell
python -m venv .venv
.\\.venv\\Scripts\\python.exe -m pip install -r services/api/requirements.txt ruff
npm ci --prefix apps/visitor
npm ci --prefix apps/admin
```

Cada aplicação possui seu próprio `package.json`; não há um `package.json` na
raiz para executar `npm install`.

## Demonstração local isolada

Para servir a aplicação visitante e o painel pela API local, gere os estáticos
pelos comandos oficiais e inicie o servidor descartável:

```powershell
npm run build:web --prefix apps/visitor
npm run build --prefix apps/admin
.\\.venv\\Scripts\\python.exe services/api/mini_server.py --port 8766
```

Abra `http://127.0.0.1:8766/?qr=MINI-ENTRADA-PRINCIPAL` e
`http://127.0.0.1:8766/admin/`. O banco é criado em diretório temporário a
cada execução. Não edite os diretórios estáticos manualmente.

## Desenvolvimento por componente

Para a API persistente, copie `services/api/.env.example` para
`services/api/.env`, preencha credenciais próprias e execute a seed e a
publicação conforme o README:

```powershell
Set-Location services/api
..\\..\\.venv\\Scripts\\python.exe seed_mini_shopping.py
..\\..\\.venv\\Scripts\\python.exe publish_scene.py ../../assets/models/mini-shopping/scene-catalog-v1.json
..\\..\\.venv\\Scripts\\python.exe -m uvicorn app.main:app --reload
```

Em terminais separados:

```powershell
npm start --prefix apps/visitor
npm run dev --prefix apps/admin
```

O Vite atende o painel em `http://localhost:5173/admin/` e encaminha `/api` e
`/static` para a API em `127.0.0.1:8000`. O Expo usa
`EXPO_PUBLIC_API_URL` de `apps/visitor/.env` quando definido; em dispositivo
físico essa URL deve apontar para o IP acessível da máquina, nunca `localhost`.

## Limites da validação local

Leitura óptica de QR, câmera, dispositivos móveis, TalkBack/VoiceOver,
navegadores adicionais, caminhada presencial e MySQL institucional seguem o
roteiro em [docs/teste-fisico-visitante.md](docs/teste-fisico-visitante.md).
