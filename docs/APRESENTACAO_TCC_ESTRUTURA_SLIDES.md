# Estrutura dos Slides — Apresentação do TCC Navegação Indoor 3D

**Data da apresentação:** 26/11/2026
**Instituição:** UTFPR — Curso Superior de Tecnologia em Análise e Desenvolvimento de Sistemas
**Título:** Navegação Indoor 3D — Sistema de orientação interna para shopping centers com mapas 2D e 3D, cálculo de rotas e painel administrativo integrado
**Formato:** 16:9, profissional
**Tempo estimado:** 15-20 minutos de apresentação + 10 minutos de perguntas da banca
**Total de slides:** 18

## Resumo da Estrutura

| Slide | Título | Tempo | Objetivo |
|-------|--------|-------|----------|
| 1 | Capa | 0:30 | Identificação do trabalho, autor, orientador, instituição |
| 2 | Introdução / Problema | 1:00 | Por que navegação indoor é necessária, limitações do GPS |
| 3 | Justificativa e Objetivos | 1:00 | Relevância do tema, objetivo geral e específicos |
| 4 | Metodologia | 1:00 | Abordagem de desenvolvimento, monorepo, fases |
| 5 | Fundamentação Teórica | 1:00 | Navegação indoor, QR Codes, grafos, Dijkstra |
| 6 | Arquitetura do Sistema | 1:30 | Monorepo, separação API/Blender, contrato de cena |
| 7 | Tecnologias Utilizadas | 1:00 | FastAPI, Expo, React/Vite, Blender, Three.js, SQLite/MySQL |
| 8 | Backend e APIs (FastAPI) | 1:00 | Endpoints, Dijkstra, revisão do shopping, bloqueios |
| 9 | Banco de Dados e Persistência | 0:45 | Entidades, relacionamentos, SQLite demo / MySQL produção |
| 10 | Aplicativo do Visitante (Expo) | 1:30 | Telas, QR Code, mapas 2D/3D, navegação, simulação |
| 11 | Mapas 2D e 3D — Navegação | 1:00 | SVG 2D, GLB 3D, rota, marcadores, norte para cima |
| 12 | Rotas Acessíveis e Troca de Pisos | 0:45 | Elevador, sem escadas, conectores verticais |
| 13 | Painel Administrativo | 0:45 | Cadastro, validação de cena, auditoria |
| 14 | Testes e Validação | 1:00 | Testes automatizados, integração, limites |
| 15 | Resultados Obtidos | 0:45 | Demonstração de funcionalidades, exemplo de rota |
| 16 | Limitações e Trabalhos Futuros | 0:45 | O que não foi validado, próximos passos |
| 17 | Conclusão e Contribuições | 0:30 | Síntese do trabalho, principais contribuições |
| 18 | Perguntas da Banca | — | Espaço para perguntas e respostas |

## Orientações de Formato

- Fonte: Arial ou similar, sem serifa
- Títulos: 28-32 pt, Corpo: 18-24 pt
- Cores: azul institucional (#1F4E79) + cinza neutro + branco
- Cada slide deve ter no máximo 6 bullet points
- Use imagens da pasta `evidence/` para ilustrar mapas, rotas e painel
- Não inclua animações complexas; use transições simples
- Numere os slides e inclua rodapé com o título do TCC
