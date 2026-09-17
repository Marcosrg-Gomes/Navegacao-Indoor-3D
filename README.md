# Shopping 3D — automação procedural em Blender Python

Projeto acadêmico que cria um mini shopping interno navegável usando Python e a API `bpy` do Blender. As unidades são metros (`1 unidade Blender = 1 m`).

## Ambiente reproduzível

- Blender alvo: **4.5.14 LTS**. O projeto usa `bpy`, `bmesh` e `mathutils` que vêm com o Blender; Python comum não executa a geração da cena.
- Python para as verificações puras: **3.11+**. Não há dependências de execução fora do Blender; a única ferramenta de desenvolvimento é `ruff`.
- O render usa EEVEE Next quando disponível, EEVEE nas versões anteriores e Cycles como último fallback. O gerenciamento de cores tenta AgX e faz fallback para Filmic.
- A compatibilidade com Blender 3.6 LTS e 4.x foi mantida em trechos com fallback, mas a validação automatizada é feita na versão alvo 4.5.14 LTS.

## Execução

Na interface do Blender, abra `main.py` na área **Scripting** e use **Run Script** (`Alt + P`).

Para gerar e renderizar sem interface, a partir da raiz do repositório:

```powershell
& "C:\caminho\para\blender.exe" --background --factory-startup --python scripts\render_headless.py
```

O comando recria apenas as collections do projeto, renderiza as câmeras estáticas em `renders/` a 640×360 e grava `renders/shopping_validado.blend`. O modo headless não abre viewport; a inspeção é feita nos PNGs gerados.

## Desenvolvimento e validação

```powershell
python -m pip install ruff
ruff check tests scripts utils/mesh_data.py config.py utils/geometry.py
ruff format --check tests scripts utils/mesh_data.py
python -m compileall -q .
python -m unittest discover -s tests -v
```

Os testes de `tests/` validam o layout derivado e malhas puras sem importar `bpy`. A adaptação dessas malhas para `bmesh` permanece em `utils/geometry.py`. O GitHub Actions executa essas verificações e também roda a geração da cena com Blender headless 4.5.14 LTS.

## Estrutura

- `main.py`: orquestra a geração da cena.
- `config.py`: valores e layout derivados.
- `utils/mesh_data.py`: malhas testáveis, sem dependência do Blender.
- `architecture/`, `stores/`, `areas/`, `furniture/`, `lighting/` e `cameras/`: construtores por domínio.
- `scripts/`: pontos de entrada para geração e smoke test headless.
- `renders/`: artefatos de validação visual.

`config.py` continua centralizado porque os domínios ainda compartilham muitas dimensões. Quando os conflitos de edição ou as configurações específicas crescerem, a divisão recomendada é `config/architecture.py`, `config/stores.py`, `config/lighting.py` e um módulo pequeno de composição/validação. Essa migração não foi antecipada para não alterar a API atual.
