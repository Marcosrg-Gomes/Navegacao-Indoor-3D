# Implementação oficial e aceite

A única implementação integrada do produto é formada por `backend/`, `mobile/`
e `admin-panel/`. Alterações funcionais, testes, builds e entregas devem atingir
esses diretórios. `Waypoint-main/`, `QRNav-master/`, `indrz-be-main/`,
`indoor-wayfinder-main/` e
`indoor-navigation-system-qrcode-augmented-reality-master/` são apenas
referências/upstreams: não fazem parte do build, do deploy ou da validação do
MVP.

## Gates automatizados

O workflow `.github/workflows/ci.yml` executa:

- os testes Python em SQLite e, separadamente, MySQL 8 efêmero;
- typecheck e export web do `mobile/`;
- typecheck/build do `admin-panel/`;
- E2E Chromium disponíveis contra o servidor de auditoria isolado.

Para executar a homologação MySQL local, crie um banco descartável e defina
`TEST_DATABASE_URL`; a variável é usada somente pelos testes e nunca deve
apontar para dados de desenvolvimento ou produção.

```powershell
$env:TEST_DATABASE_URL = 'mysql+pymysql://usuario:senha@localhost:3306/navegacao_indoor_test'
cd backend
pytest tests/ -v
Remove-Item Env:TEST_DATABASE_URL
```

## Aceites que exigem ambiente físico

O CI não fecha requisitos que dependem de condições externas. Registre em
`evidence/` a data, responsável, modelo/versão do aparelho e resultado de cada
execução antes de marcar estes itens como aceitos:

1. Android/iOS: instalar ou abrir o export nativo, conceder câmera, ler QR
   físico válido e inválido e confirmar o fallback manual.
2. Rede local: configurar `EXPO_PUBLIC_API_URL` com o IP LAN do backend e
   repetir QR, mapa, rota e painel a partir de outro dispositivo.
3. RNF08: executar os fluxos nas duas últimas versões reais de Chrome, Safari,
   Firefox e Edge; WebKit do Playwright não substitui Safari.
4. Carga multiusuário: cinco usuários ou sessões simultâneas, em MySQL, devem
   consultar mapa e calcular rota sem erro; anotar concorrência, duração,
   latências e falhas.
5. RNF09: cinco participantes sem treinamento, sem erros críticos, com dados
   anonimizados de conclusão, ajuda e observações.
