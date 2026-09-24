# Publicação versionada de cena

O GLB, o catálogo e as plantas SVG do repositório são os artefatos canônicos. A cópia servida em
`services/api/app/static/models` é gerada e ignorada pelo Git.

1. Ajustar `packages/shopping-3d/config.py` e executar os testes puros.
2. Gerar em staging com um número de release novo:

```powershell
blender --background --factory-startup --python-exit-code 1 --python packages/shopping-3d/scripts/export_navigation_scene.py -- --release 2 --output .work/scene-v2
blender --background --factory-startup --python-exit-code 1 --python packages/shopping-3d/scripts/validate_navigation_geometry.py
blender --background --factory-startup --python-exit-code 1 --python packages/shopping-3d/scripts/render_headless.py -- CAM_Aerea CAM_Mezanino
```

3. Inspecionar os renders e o GLB. O exportador seleciona apenas a coleção
   `MINI_SHOPPING`, exclui câmera/luzes/âncoras, preserva nomes e metadados dos
   objetos, comprime malhas com Draco e exige tamanho máximo de 25 MiB.
   Os materiais procedurais avançados do Blender não são integralmente portáveis
   ao glTF; o visualizador usa os materiais PBR exportáveis.
4. Copiar os artefatos aprovados de staging para `assets/models/mini-shopping`.
   Não substituir uma versão já publicada. `version` identifica o contrato;
   `release` identifica a revisão do GLB. SHA-256 e tamanho vinculam catálogo e modelo.
   As plantas seguem o mesmo release: `terreo-v2.svg` e `mezanino-v2.svg`.
5. Aplicar a seed do catálogo candidato em banco configurado. Ela só acrescenta
   registros ausentes. Alterações de layout em dados existentes devem ser revistas
   e aplicadas explicitamente; a publicação recusa âncoras antigas divergentes.
   Em pisos existentes, atualize também `imagem_planta_url` para o SVG da nova
   versão durante essa revisão. A seed preserva configurações existentes.
6. Em `services/api`, executar:

```powershell
python publish_scene.py ../../assets/models/mini-shopping/scene-catalog-v2.json
```

O publicador valida catálogo, cabeçalho e inventário real do GLB, hash/tamanho, correspondência dos
códigos, coordenadas e conectividade de todos os destinos nas duas modalidades.
Só então escreve os arquivos e substitui atomicamente `published-scenes.json`.
Plantas ausentes e arquivos versionados existentes com conteúdo diferente são rejeitados. A versão
anterior é conservada. Repetir a mesma publicação é permitido e conserva a data.
Executar `navigation.py` diretamente apenas valida o catálogo em memória; a
exportação canônica é responsabilidade do exportador Blender.

7. Executar backend, builds, E2E e inspeção visual. O CI gera outra cópia em
   staging para testar exportação headless sem sobrescrever o artefato publicado.

O script não envia arquivos a um provedor externo. A implantação do serviço em
produção deve servir os estáticos locais junto à API. O ambiente de produção,
domínio e credenciais não estão definidos neste repositório.

Os sete QR Codes em `assets/qr` podem ser regenerados com
`node scripts/generate-qrs.cjs` depois de `npm ci --prefix apps/admin`. Eles codificam
tokens independentes do domínio. Abra `assets/qr/mini-shopping-qrs.html` e imprima
em escala de 100%; instalação e leitura por câmera exigem ensaio físico.
