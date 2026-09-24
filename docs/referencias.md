# Proveniência e referências

Importação local efetuada em 18/09/2026, sem modificar os repositórios de origem.
Os históricos foram incorporados com `git subtree add`, sem `--squash`. Para os
módulos de Navegação Indoor, `git subtree split` foi executado em um clone isolado.
Os hashes dos commits filtrados mudam, preservando autores, datas e mensagens.

| Origem | Revisão de origem | Destino |
|---|---|---|
| Navegacao-indoor/backend | `fdbf583`, split `eee0f9a` | `services/api` |
| Navegacao-indoor/mobile | `fdbf583`, split `c91e02f` | `apps/visitor` |
| Navegacao-indoor/admin-panel | `fdbf583`, split `d88dc99` | `apps/admin` |
| Shopping-3d | `3bd7c4f` | `packages/shopping-3d` |

Os commits de importação no TCC são `66b10de`, `4d610c0`, `623ffcb` e `7eef0cd`.
O script `scripts/import-history.sh` registra o procedimento de importação única;
não deve ser executado novamente sobre este repositório já inicializado.

Documentação anterior da navegação foi preservada em `docs/origens/navegacao`.
Seus caminhos e relatórios se referem ao repositório original, não constituem
evidência de aprovação desta integração. A documentação histórica do Blender
permanece em `packages/shopping-3d`. As diretrizes atuais estão no AGENTS da raiz.

## Referências mantidas fora do produto

Estas pastas continuam no repositório original `SENAI/Navegacao-indoor`. Nenhuma
foi importada como aplicação do monorepo.

| Pasta de origem | Identificação observada | Licença observada na cópia local |
|---|---|---|
| `indoor-wayfinder-main` | Pathpal / Indoor Wayfinder; README referencia OpenIndoorMaps | README declara MIT; arquivo LICENSE não localizado |
| `Waypoint-main` | Waypoint, sistema offline de checkpoints/navpack | Apache-2.0 em LICENSE; núcleo Decimen vendorizado sob MIT |
| `QRNav-master/QRNav-master` | QR Navigation; Lhakpa Lama, William Gao e Kenichi Yamamoto; mentores Zhigang Zhu e Feng Hu | LICENSE não localizado; não presumir licença |
| `indrz-be-main` | Monorepo indrz, Django + Vue/Nuxt | FCL-1.0-ALv2, conforme LICENSE local (2026 Michael Diener) |
| `indoor-navigation-system-qrcode-augmented-reality-master` | Referência Android/Java com API e Web Admin | LICENSE/README não localizado nos caminhos inspecionados |

Não foi acrescentada uma licença ao código do TCC: a titularidade e a licença de
distribuição dos módulos próprios precisam ser definidas pelo autor. Marcas e
nomes comerciais das 22 lojas já constavam do catálogo acadêmico do Shopping 3D.

## Documentação técnica consultada

- [React Three Fiber — instalação e versões de React](https://r3f.docs.pmnd.rs/getting-started/installation)
- [Three.js — GLTFLoader e Draco](https://threejs.org/docs/pages/GLTFLoader.html)
- [Blender — operadores de exportação](https://docs.blender.org/api/main/bpy.ops.export_scene.html)

Os decodificadores Draco distribuídos com Three.js conservam seus avisos de
copyright. Dependências permanecem sob as respectivas licenças nos pacotes npm.
