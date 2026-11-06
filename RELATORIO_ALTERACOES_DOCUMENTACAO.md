# Relatório de Alterações — Documentação do TCC Navegação Indoor 3D

## 1. Documento gerado

**Arquivo:** `TCC_Navegacao_Indoor_3D_Final.docx`  
**Formato:** DOCX (Microsoft Word)  
**Normas aplicadas:** ABNT NBR 14724:2011 (apresentação de trabalhos acadêmicos)  
**Fonte:** Arial, tamanho 12, texto preto, parágrafos justificados, espaçamento 1,5  
**Total de parágrafos:** 308  
**Total de tabelas:** 4  

## 2. Estrutura do documento

### Elementos pré-textuais
- Capa (instituição, curso, título, subtítulo, autor, orientador, local/data)
- Resumo (em português, com palavras-chave)
- Sumário (organizado por seções)
- Lista de Figuras (12 entradas)
- Lista de Tabelas (6 entradas)
- Lista de Abreviaturas e Siglas (15 entradas)

### Capítulos do texto
1. **Introdução** — problema e justificativa, objetivos (geral e específicos), metodologia
2. **Fundamentação Teórica** — navegação indoor, tecnologias utilizadas (Tabela 1), trabalhos relacionados
3. **Desenvolvimento do Sistema** — arquitetura/monorepo, backend/APIs, banco de dados, aplicativo visitante, painel administrativo, modelagem 3D/Blender, mapas 2D/3D e simulação
4. **Testes e Validação** — testes automatizados (Tabela 2), validação de integração, limites da validação
5. **Resultados Obtidos** — resumo dos resultados e exemplo de rota (Entrada → NATURA → ANACAPRI)
6. **Limitações** — 8 itens identificados com base nas evidências
7. **Conclusão e Trabalhos Futuros** — contribuições e 6 itens de trabalhos futuros

### Elementos pós-textuais
- Referências bibliográficas (8 entradas, conforme ABNT NBR 6023:2018)
- Anexo A — Estrutura do Monorepo
- Anexo B — Pisos e QR Codes do Mini Shopping (tabelas)
- Anexo C — Evidências de Teste

## 3. Alinhamento com o estado real do projeto

Todas as informações contidas no documento foram extraídas dos seguintes arquivos reais do repositório:

| Fonte | Conteúdo utilizado |
|-------|-------------------|
| `README.md` | Estrutura do monorepo, tecnologias, fluxo de uso, comandos de execução, validação |
| `Rodar.md` | Guia de instalação, execução, endereços, roteiro de demonstração |
| `docs/arquitetura-integracao.md` | Arquitetura, contratos, rotas, apresentação, tecnologias |
| `docs/requisitos-e-regras.md` | RF/RN implementados, requisitos não funcionais, contratos adicionais |
| `docs/validacao-integracao.md` | Resultados de testes, evidências, limites |
| `docs/validacao-ux-visitante.md` | Validação da interface, cobertura de melhorias |
| `docs/validacao-layout-acessibilidade.md` | 12 melhorias de layout, resultados automatizados |
| `docs/validacao-regras-negocio.md` | Resultados das regras de negócio |
| `docs/referencias.md` | Proveniência, referências mantidas fora do produto |
| `docs/coordenadas-e-ancoras.md` | Sistema de coordenadas, circulação, correção física |
| `docs/publicacao-modelo-3d.md` | Processo de publicação versionada de cena |
| `docs/plano-integracao.md` | Plano detalhado de integração, critérios de aceite |
| `docs/plano-implementacao-simulacao.md` | Plano de navegação simulada, requisitos S01-S12 |
| `docs/wayfinding-ux.md` | Diretório, orientação, percurso, cobertura das 20 melhorias |
| `docs/melhorias-front-end.md` | Backlog de front-end, direção visual |
| `docs/COMO_EXECUTAR_PARTE_PRATICA.md` | Guia de execução da parte prática |
| `evidence/` | Capturas de tela e relatórios JSON de testes |
| `AGENTS.md` | Diretrizes de trabalho do projeto |

**Nenhuma funcionalidade foi inventada.** Quando uma informação não pôde ser confirmada (ex.: validação física, MySQL local, navegadores não-Chromium), ela foi sinalizada como limitação ou pendência no Capítulo 6.

## 4. Informações que ainda precisam de confirmação

| Item | Status | Observação |
|------|--------|------------|
| Validação física em aparelhos reais (Android/iPhone) | Pendente | Roteiro preparado em `docs/teste-fisico-visitante.md` |
| Homologação MySQL | Pendente | Matriz configurada no CI, não executada localmente |
| Leitura óptica de QR Codes com câmera real | Pendente | Não executada |
| TalkBack/VoiceOver | Pendente | Não testado em aparelhos físicos |
| Navegadores Firefox, WebKit, Edge | Pendente | Apenas Chromium testado |
| Hardening de dependências (29 vulnerabilidades visitor, 4 painel) | Pendente | Não tratadas neste trabalho |
| Hospedagem, domínio, credenciais de produção | Pendente | Não definidos no repositório |
| Titularidade e licença do código do TCC | Pendente | A definir pelo autor |

## 5. Requisitos institucionais atendidos e pendentes

### Atendidos
- Fonte Arial, tamanho 12
- Texto preto
- Parágrafos justificados
- Espaçamento 1,5 linhas
- Margens adequadas (3 cm superior/esquerda, 2 cm inferior/direita)
- Hierarquia de títulos (níveis 1, 2, 3)
- Numeração progressiva de seções
- Capa e elementos pré-textuais
- Sumário organizado
- Legendas de figuras e tabelas
- Referências bibliográficas (NBR 6023:2018)
- Estrutura ABNT (pré-textual, texto, pós-textual)

### Pendentes (dependem da instituição)
- Paginação automática (números de página) — não implementada no DOCX gerado
- Elementos pré-textuais específicos da instituição (ficha catalográfica, termos de aprovação) — não disponíveis no repositório
- Formatação específica de capa da instituição — modelo genérico utilizado

## 6. Imagens e diagramas

O documento referencia as seguintes figuras (não embutidas como imagens binárias, mas listadas na Lista de Figuras):

1. Estrutura do monorepo
2. Diagrama de arquitetura do sistema
3. Fluxo de navegação do visitante
4. Fluxo de leitura do QR Code
5. Modelo conceitual do banco de dados
6. Tela inicial do aplicativo do visitante
7. Mapa 2D do piso
8. Mapa 3D da cena
9. Painel de navegação Waze
10. Painel administrativo - Login
11. Painel administrativo - Dashboard
12. Capturas de evidências de teste

**Capturas existentes em `evidence/` que podem ser incorporadas:**
- `visitor-explore-360.png`, `visitor-explore-1280.png` (Explorar)
- `visitor-ground-route.png` (rota no térreo)
- `visitor-upper-accessible.png` (rota acessível mezanino)
- `admin-scene-validation.png` (validação painel)
- `map-controls-2d.png`, `map-controls-3d.png` (controles)
- `map-2d-mobile-pinch.png`, `map-3d-mobile-pinch.png` (pinça mobile)
- `visitor-large-text-360.png` (texto ampliado)
- `final-chrome-map-360.png`, `final-chrome-map-414.png` (mapa final)
- `final-chrome-arrival-360.png` (chegada final)

**Nota:** As imagens não foram embutidas binariamente no DOCX para evitar dependência de caminhos relativos. Elas podem ser inseridas manualmente a partir da pasta `evidence/`.

## 7. Avaliação final de consistência

| Aspecto | Status | Comentário |
|---------|--------|------------|
| Arquitetura descrita vs implementada | Consistente | Monorepo, API como fonte de verdade, Blender como fonte de geometria |
| Tecnologias listadas vs usadas | Consistente | FastAPI, Expo, React/Vite, Three.js, Blender, TypeScript |
| Testes reportados vs evidências | Consistente | Números correspondem aos relatórios em `evidence/` e docs de validação |
| Funcionalidades afirmadas vs código | Consistente | Nenhuma funcionalidade sem evidência foi declarada como concluída |
| Limitações identificadas | Coerente | 8 limitações listadas, todas confirmadas na documentação |
| Normas ABNT aplicadas | Parcial | Estrutura, formatação e referências conforme NBR; paginação e elementos institucionais específicos não incluídos |

O documento está pronto para revisão final antes da apresentação da banca do TCC.

## 8. Arquivos preservados

- Todos os arquivos originais do repositório foram preservados (não sobrescritos).
- Nenhum commit ou push foi realizado.
- Nenhum código-fonte foi alterado.
- O documento DOCX é um arquivo novo, adicionado ao working tree.