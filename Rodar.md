# Navegação Indoor 3D

## Guia de instalação e execução da parte prática

Este documento apresenta os procedimentos necessários para configurar e executar a aplicação Navegação Indoor 3D, desenvolvida como parte do Trabalho de Conclusão de Curso (TCC).

O sistema tem como objetivo auxiliar visitantes na localização de estabelecimentos e na navegação pelos ambientes internos de shopping centers, oferecendo orientação por meio de mapas e rotas internas.

---

# 1. Tecnologias utilizadas

O projeto utiliza diferentes tecnologias para implementar seus componentes:

- **Python / FastAPI:** desenvolvimento da API e gerenciamento das operações do sistema.
- **React Native / Expo:** desenvolvimento da aplicação destinada aos visitantes.
- **React / Vite:** desenvolvimento do painel administrativo.
- **TypeScript:** tipagem e organização do código.
- **MySQL:** gerenciamento e armazenamento de dados, conforme a configuração do ambiente.
- **Docker:** execução de serviços e infraestrutura.
- **Blender:** criação e preparação de elementos tridimensionais dos ambientes.
- **Git:** controle de versão do projeto.

# 2. Requisitos para execução

Antes de iniciar, verifique se os seguintes programas estão instalados:

| Programa           | Finalidade                                              |
| ------------------ | ------------------------------------------------------- |
| Node.js e npm      | Executar as aplicações JavaScript                     |
| Python             | Executar o backend                                      |
| Git                | Gerenciar o código-fonte                               |
| Docker Desktop     | Executar serviços conteinerizados, quando necessários |
| Visual Studio Code | Editar e visualizar o código                           |
| Expo Go            | Testar a aplicação em dispositivo móvel              |

As versões e dependências devem respeitar os arquivos de configuração do projeto.

# 3. Obter o código-fonte

Abra o CMD ou PowerShell e execute:

```cmd
git clone https://github.com/Marcosrg-Gomes/Navegacao-Indoor-3D.git
```

Entre na pasta:

```cmd
cd Navegacao-Indoor-3D
```

Caso o projeto já esteja instalado:

```cmd
git pull
```

# 4. Configuração inicial

Verifique os arquivos de configuração:

- `package.json`
- `requirements.txt` ou `pyproject.toml`
- `.env.example`
- Arquivos de configuração do Docker.

Configure as variáveis de ambiente conforme os exemplos disponibilizados pelo projeto.

**Importante:** não compartilhe arquivos `.env` com senhas, tokens ou credenciais.

# 5. Instalação das dependências

Na pasta principal do projeto, consulte os scripts disponíveis:

```cmd
npm run
```

Instale as dependências conforme a organização dos pacotes:

```cmd
npm install
```

Para o backend Python, utilize o ambiente virtual configurado no projeto.

Exemplo:

```cmd
python -m venv .venv
```

Ative o ambiente:

```cmd
.venv\Scripts\activate
```

Instale as dependências utilizando o arquivo de requisitos correspondente, caso exista:

```cmd
pip install -r requirements.txt
```

# 6. Inicialização do sistema

O sistema possui diferentes componentes que podem precisar ser iniciados separadamente.

## 6.1 Backend – FastAPI

O backend é responsável pelo processamento das requisições, gerenciamento dos dados, identificação da origem da navegação e cálculo das rotas.

Acesse a pasta principal do projeto, ative o ambiente virtual e execute o comando Uvicorn correspondente ao módulo principal da API.

Exemplo de formato:

```cmd
python -m uvicorn CAMINHO_DO_MODULO:app --reload
```

A documentação interativa da API poderá ser acessada em:

```text
http://127.0.0.1:8000/docs
```

## 6.2 Aplicação do visitante – Expo

A aplicação do visitante permite acessar os recursos de navegação interna, selecionar destinos e acompanhar trajetos.

Entre na pasta correspondente:

```cmd
cd apps\visitor
```

Consulte os scripts disponíveis:

```cmd
npm run
```

Execute o script de desenvolvimento configurado no `package.json`.

Caso seja uma aplicação Expo, o comando normalmente é:

```cmd
npx expo start
```

## 6.3 Painel administrativo – React/Vite

O painel administrativo permite gerenciar os dados e cadastros utilizados pelo sistema.

Entre na pasta:

```cmd
cd apps\admin
```

Consulte os scripts:

```cmd
npm run
```

Execute o script de desenvolvimento configurado para o painel.

Em projetos Vite, normalmente:

```cmd
npm run dev
```

# 7. Banco de dados e infraestrutura

Caso o ambiente utilize MySQL e Docker, os serviços necessários deverão ser iniciados antes de executar as funcionalidades que dependem deles.

Na pasta que contém o arquivo `docker-compose.yml`, consulte os serviços configurados:

```cmd
docker compose config --services
```

Para iniciar os serviços:

```cmd
docker compose up -d
```

Para verificar o funcionamento:

```cmd
docker compose ps
```

Para visualizar os registros:

```cmd
docker compose logs -f
```

A configuração de conexão com o banco deverá respeitar as variáveis de ambiente do backend.

# 8. Fluxo de utilização do sistema

Após iniciar os componentes necessários, o fluxo geral de utilização é:

1. Acessar a aplicação do visitante.
2. Identificar a localização inicial por meio da leitura de um QR Code disponível no ambiente.
3. Selecionar o estabelecimento ou destino desejado.
4. Solicitar a geração da rota.
5. Visualizar o trajeto apresentado pelo sistema.
6. Acompanhar a navegação interna até o destino.

O painel administrativo é utilizado para gerenciar as informações necessárias à operação da plataforma.

# 9. Encerramento dos serviços

Para encerrar os servidores de desenvolvimento:

```text
Ctrl + C
```

Para parar os serviços Docker:

```cmd
docker compose down
```

Esse comando encerra os contêineres sem remover os volumes persistentes.

# 10. Solução de problemas

| Problema                         | Verificação                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------ |
| npm não reconhecido             | Verificar instalação e PATH do Node.js                                       |
| Python não reconhecido          | Verificar instalação e PATH do Python                                        |
| Erro de conexão com API         | Conferir endereço, porta e disponibilidade do backend                         |
| Banco indisponível              | Verificar MySQL e variáveis de ambiente                                       |
| Docker não inicia               | Verificar Docker Desktop e WSL                                                 |
| Expo não conecta ao dispositivo | Conferir rede, endereço da API e conexão do dispositivo                      |
| Dependências ausentes           | Conferir os arquivos de dependências e executar a instalação correspondente |

# 11. Observações importantes

- Os comandos definitivos de inicialização devem corresponder aos scripts e módulos existentes no repositório.
- Os serviços devem ser iniciados na ordem exigida pelas dependências do sistema.
- O endereço da API utilizado pelo aplicativo deve ser compatível com o ambiente de execução.
- Em dispositivos físicos, `localhost` não representa automaticamente o computador que está executando o backend.
- Testes de leitura de QR Code, navegação física e integração com dispositivos devem ser realizados no ambiente apropriado.

---

**Projeto:** Navegação Indoor 3D
**Finalidade:** Trabalho de Conclusão de Curso (TCC)
**Repositório:** https://github.com/Marcosrg-Gomes/Navegacao-Indoor-3D
