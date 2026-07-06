# Sistema de Gestão de Evidências CERNE

Este projeto é uma aplicação web que permite o upload de arquivos (PDF, imagens, DOCX, PPTX), extração de texto via OCR, geração de metadados e visualização de evidências.

## Uso para equipe em rede

### 1. Preparar o servidor

- Copie este projeto para a pasta da rede acessível pelos computadores.
- Escolha um computador que irá rodar o servidor.
- Nesse computador, abra um terminal e vá até a pasta do projeto.

### 2. Instalar dependências

```powershell
npm install
```

### 3. Configurar variáveis de ambiente

- Copie o arquivo `.env.example` para `.env`:

```powershell
copy .env.example .env
```

- Edite `.env` se desejar usar uma pasta de rede compartilhada para o armazenamento.

Exemplo no Windows:

```text
STORAGE_PATH=\\SERVIDOR\Compartilhamento\cerne-storage
DB_PATH=\\SERVIDOR\Compartilhamento\cerne-storage\db\evidences.db
```

Se não quiser usar pasta de rede, o sistema cria `storage/` dentro do projeto.

### 4. Iniciar o servidor

Execute:

```powershell
npm start
```

ou use o arquivo `start-server.bat`:

```powershell
start-server.bat
```

### 5. Acessar pelo navegador

- Abra um navegador em qualquer computador da rede.
- Use a URL:

```text
http://<IP-do-computador-que-rodou-o-servidor>:3000
```

Se `HOST` estiver configurado como `0.0.0.0`, o servidor aceitará conexões de outras máquinas.

## Configuração de rede recomendada

- Use um computador com IP fixo ou hostname válido.
- Certifique-se de que o firewall permite a porta 3000.
- Se quiser maior estabilidade, mantenha o servidor rodando sempre no mesmo computador.

## Uso do sistema

- Faça upload de um arquivo.
- O servidor extrai texto e gera metadados automaticamente.
- Revise e finalize a evidência.
- Todos os dados ficam disponíveis para os demais usuários via navegador.

## Se quiser IA real

- Defina `OPENAI_API_KEY` no `.env`.
- O sistema tentará gerar metadados usando OpenAI.
- Caso não tenha chave, usa classificações padrão locais.
