# Guia de execução da parte prática

Use este roteiro para demonstrar a aplicação localmente. Ele não substitui a
homologação em aparelhos e no SENAI, descrita em
[teste-fisico-visitante.md](teste-fisico-visitante.md).

## Pré-requisitos

- Python 3.11+;
- Node.js 22+ e npm;
- navegador com WebGL para a visualização 3D;
- MySQL somente quando for necessário manter dados entre execuções.

Docker não é necessário para a demonstração local. Blender só é necessário se
o modelo espacial precisar ser regenerado.

## Instalação

Na raiz do repositório:

```powershell
python -m venv .venv
.\\.venv\\Scripts\\python.exe -m pip install -r services/api/requirements.txt ruff
npm ci --prefix apps/visitor
npm ci --prefix apps/admin
```

## Demonstração isolada

Esse modo cria um SQLite temporário, executa a seed do Mini Shopping e publica
o catálogo atual sem tocar em `.env`, MySQL ou bancos já existentes.

```powershell
npm run build:web --prefix apps/visitor
npm run build --prefix apps/admin
.\\.venv\\Scripts\\python.exe services/api/mini_server.py --port 8766
```

Endereços:

- visitante: `http://127.0.0.1:8766/?qr=MINI-ENTRADA-PRINCIPAL`;
- painel: `http://127.0.0.1:8766/admin/`;
- saúde: `http://127.0.0.1:8766/health`.

A chave de demonstração do painel é exibida no README. Ela é exclusiva desse
servidor local e não deve ser reutilizada fora dele.

## Demonstração sugerida

1. Abra o visitante com o QR da entrada.
2. Pesquise **BURGER KING** e selecione rota sem escadas.
3. Confirme que as instruções indicam o elevador e a troca para o mezanino.
4. Inicie a demonstração de percurso; ela move apenas o marcador simulado.
5. Abra o painel em `/admin/` para consultar o catálogo e a validação da cena.

## Desenvolvimento com banco persistente

Para MySQL, copie `services/api/.env.example` para `services/api/.env` e use
credenciais próprias. Em seguida:

```powershell
Set-Location services/api
..\\..\\.venv\\Scripts\\python.exe seed_mini_shopping.py
..\\..\\.venv\\Scripts\\python.exe publish_scene.py ../../assets/models/mini-shopping/scene-catalog-v1.json
..\\..\\.venv\\Scripts\\python.exe -m uvicorn app.main:app --reload
```

Em outros terminais, `npm start --prefix apps/visitor` abre o Expo e
`npm run dev --prefix apps/admin` inicia o Vite em
`http://localhost:5173/admin/`. Para um celular, configure
`EXPO_PUBLIC_API_URL` com o IP local acessível pela rede; `localhost` aponta
para o próprio aparelho.

## Limites que exigem SENAI

Não considerar homologados sem execução presencial: câmera e QR físico,
Android/iOS, TalkBack/VoiceOver, escala de fonte nativa, caminhada, rede móvel,
MySQL institucional e navegadores adicionais. Registre cada tentativa no
roteiro físico antes de marcá-la como aprovada.
