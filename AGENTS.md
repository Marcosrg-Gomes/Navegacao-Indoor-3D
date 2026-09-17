# AGENTS.md — Shopping 3D

## Visão geral

Projeto acadêmico de geração procedural de um mini shopping interno usando
Python e a API `bpy` do Blender. Execute `main.py` pelo Blender; o Python comum
não possui `bpy`, `bmesh` e `mathutils`.

## Arquitetura

- `config.py`: fonte central de dimensões, recursos e opções de execução.
- `main.py`: orquestra a criação da cena e recarrega módulos durante o
  desenvolvimento.
- `scene_setup.py` e `materials.py`: limpeza seletiva, coleções e materiais.
- `architecture/`, `stores/`, `areas/`, `furniture/`, `lighting/` e `cameras/`:
  construtores modulares da cena.
- `utils/geometry.py`: primitivas e malhas reutilizáveis; preserve orientação
  de faces e normais externas.
- `renders/`: imagens geradas para referência; não comprovam o código atual
  sem nova renderização.

Consulte `README.md` e `AUDITORIA.md` antes de alterações de layout, geometria
ou requisitos de validação.

## Diretrizes de implementação

- Centralize valores configuráveis em `config.py`; evite medidas mágicas em
  construtores.
- Use os helpers existentes para coleções, vínculos, materiais e rotações.
- Todo objeto criado deve ter nome previsível e pertencer à coleção correta.
- Ao alterar malhas, valide vértices, faces, normais e ausência de sobreposição
  visual; mantenha unidades em metros e as dimensões derivadas consistentes.
- Preserve a limpeza seletiva da cena: não exclua coleções ou objetos externos
  ao escopo do projeto.
- Não altere materiais, iluminação, câmera ou resolução global como efeito
  colateral de uma mudança local, salvo quando isso for a tarefa.

## Validação

- Verifique sintaxe Python e `git diff --check` para mudanças de código.
- Para validar de fato, execute `main.py` no Blender suportado, inspecione a
  cena no viewport e regenere renders representativos quando a geometria,
  iluminação ou câmeras mudarem.
- Ao não haver Blender disponível, deixe explícito que a validação é estática e
  não afirme que a geração ou renderização foi aprovada.

## Higiene do repositório

- Não versione `__pycache__/`, arquivos `.pyc`, arquivos temporários do Blender
  ou renders descartáveis.
- Atualize o README e a auditoria quando a execução, configurações, estrutura
  ou limitações conhecidas mudarem.
- Não apague, reverta ou formate alterações locais alheias à tarefa.
- Não faça commits, pushes, merges, resets ou operações destrutivas sem pedido
  explícito.
