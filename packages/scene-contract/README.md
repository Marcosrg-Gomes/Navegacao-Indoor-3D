# Contrato de cena 1.x

`scene_contract` usa somente a biblioteca padrão do Python, permitindo a mesma
validação no Blender e na API. `scene-catalog.schema.json` documenta a estrutura;
o validador Python também verifica referências cruzadas, transforms, distâncias,
tipos de transição, URLs permitidas e posições normalizadas.

O catálogo é produzido por `packages/shopping-3d/navigation.py` e enriquecido
com inventário, hash e tamanho pela exportação Blender. O publicador verifica os
dados contra o banco antes da ativação. Consulte `docs/publicacao-modelo-3d.md`.
