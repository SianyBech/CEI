# 🧪 Guia de Testes - Filtro de Data Inteligente

## 📋 Pré-requisitos

- Node.js 14+
- PostgreSQL com tabela de evidências populada
- Dados com datas em formato DD/MM/YYYY

---

## 🚀 Iniciando o Teste

### 1. Preparar o Ambiente
```bash
cd cerne-evidencias-mvp
npm install
```

### 2. Iniciar o Servidor
```bash
node server.js
```

**Esperado:**
```
Servidor rodando em http://localhost:3000
Database conectado ✓
```

### 3. Abrir a Aplicação
```
http://localhost:3000
```

---

## ✅ Checklist de Testes

### Teste 1: Renderização dos Seletores ⏰
**Objetivo:** Verificar se os seletores de data aparecem corretamente

1. Abra a aplicação
2. Localize a seção de filtros (logo abaixo da barra de busca)
3. Procure por dois grupos: "De" e "Até"
4. Cada grupo deve ter **3 seletores**: Dia, Mês, Ano

**Verificar:**
- [ ] Grupo "De" visível
- [ ] Grupo "Até" visível
- [ ] 3 seletores em cada grupo
- [ ] Todos os seletores com dropdown arrow SVG
- [ ] Labels "De" e "Até" visíveis

**Se falhar:** Abra DevTools (F12) → Console e procure por erros vermelhos

---

### Teste 2: População de Opções 📅
**Objetivo:** Verificar se os seletores têm dados corretos

1. Clique no seletor "Ano" do grupo "De"
2. Verifique a lista de anos

**Verificar:**
- [ ] Anos começam em 1900
- [ ] Anos terminam no ano atual (2024, 2025, etc)
- [ ] Lista é rolável
- [ ] Primeira opção é "(selecionar)"

**Se falhar:** Verifique console para erro em `populateYears()`

---

### Teste 3: Adaptação de Dias 📆
**Objetivo:** Verificar se os dias se adaptam conforme mês/ano

**Passo 1: Testar mês com 31 dias**
1. Grupo "De" → Mês: "Janeiro"
2. Grupo "De" → Ano: "2026"
3. Clique no seletor "Dia"
4. Verifique a lista

**Verificar:**
- [ ] Opções: 1, 2, ..., 31
- [ ] Máximo é 31

**Passo 2: Testar mês com 30 dias**
1. Grupo "De" → Mês: "Abril"
2. Grupo "De" → Ano: "2026"
3. Clique no seletor "Dia"

**Verificar:**
- [ ] Opções: 1, 2, ..., 30
- [ ] Máximo é 30 (não tem 31)

**Passo 3: Testar fevereiro - ano não bissexto**
1. Grupo "De" → Mês: "Fevereiro"
2. Grupo "De" → Ano: "2025"
3. Clique no seletor "Dia"

**Verificar:**
- [ ] Opções: 1, 2, ..., 28
- [ ] Máximo é 28

**Passo 4: Testar fevereiro - ano bissexto**
1. Grupo "De" → Mês: "Fevereiro"
2. Grupo "De" → Ano: "2024"
3. Clique no seletor "Dia"

**Verificar:**
- [ ] Opções: 1, 2, ..., 29
- [ ] Máximo é 29

**Se falhar:** Verifique função `updateDaysInMonth()` em SearchBar.js

---

### Teste 4: Filtragem por Ano 🎯
**Objetivo:** Testar se filtro funciona com apenas ano

**Setup:**
- Certifique-se que há dados em diferentes anos no banco
- Ex: 2024, 2025, 2026

**Execução:**
1. Grupo "De" → Selecione "Ano: 2026"
2. Deixe Dia e Mês vazios
3. Grupo "Até" → Deixe tudo vazio
4. Aguarde a tabela atualizar

**Verificar:**
- [ ] Tabela mostra apenas registros de 2026
- [ ] Atualização automática (sem clicar botão)
- [ ] Se já havia filtro, ele foi combinado corretamente

**Se não funcionar:** Verifique console para erro em `handleDateFilterChange()`

---

### Teste 5: Filtragem por Mês + Ano 📅
**Objetivo:** Testar se filtro funciona com mês + ano

**Execução:**
1. Limpe os filtros (botão X)
2. Grupo "De" → Mês: "Julho", Ano: "2026"
3. Deixe Dia vazio
4. Grupo "Até" → Deixe tudo vazio
5. Aguarde atualização

**Verificar:**
- [ ] Mostra apenas registros de julho de 2026
- [ ] Registros com datas entre 01/07/2026 e 31/07/2026

**Esperado:**
- Registros como 01/07/2026, 15/07/2026, 31/07/2026 → visíveis ✓
- Registros como 30/06/2026, 01/08/2026 → ocultos ✗

**Se falhar:** Verifique lógica de cálculo do último dia do mês

---

### Teste 6: Filtragem por Data Completa 📍
**Objetivo:** Testar se filtro funciona com dia + mês + ano

**Execução:**
1. Limpe os filtros
2. Grupo "De" → Dia: "15", Mês: "Julho", Ano: "2026"
3. Deixe Grupo "Até" vazio
4. Aguarde atualização

**Verificar:**
- [ ] Mostra apenas registros de 15/07/2026
- [ ] Outros dias não aparecem

**Esperado:**
- 15/07/2026 → visível ✓
- 14/07/2026 e 16/07/2026 → ocultos ✗

**Se falhar:** Verifique lógica de parsing em `parseDate()`

---

### Teste 7: Filtragem com Intervalo 📊
**Objetivo:** Testar range de datas

**Execução:**
1. Limpe os filtros
2. Grupo "De" → Mês: "Julho", Ano: "2026"
3. Grupo "Até" → Mês: "Setembro", Ano: "2026"
4. Aguarde atualização

**Verificar:**
- [ ] Mostra todos os registros de julho, agosto e setembro de 2026
- [ ] Nada antes de 01/07/2026 ou depois de 30/09/2026

**Esperado:**
- 01/07/2026 → visível ✓
- 31/08/2026 → visível ✓
- 30/09/2026 → visível ✓
- 30/06/2026 e 01/10/2026 → ocultos ✗

**Se falhar:** Verifique lógica de "Até" com cálculo de último dia

---

### Teste 8: Botão Limpar ✖️
**Objetivo:** Verificar se botão reseta todos os filtros

**Execução:**
1. Defina alguns filtros (data, tipo, categoria, etc)
2. Clique no botão "X" (perto dos filtros de data)
3. Aguarde atualização

**Verificar:**
- [ ] Todos os seletores de data voltam a "(selecionar)"
- [ ] Tabela mostra todos os registros novamente
- [ ] Outros filtros (Tipo, Categoria) NÃO são afetados

**Se não funcionar:** Verifique listener do botão em SearchBar.js

---

### Teste 9: Combinação com Outros Filtros 🔗
**Objetivo:** Verificar se filtro de data funciona com outros filtros

**Execução:**
1. Selecione "Tipo: Folha"
2. Selecione "Categoria: Legal"
3. Selecione "De: Ano 2026"
4. Aguarde atualização

**Verificar:**
- [ ] Mostra apenas registros que combinam TODOS os filtros
- [ ] Se nenhum registro atende os critérios, table fica vazia
- [ ] Filtros trabalham em conjunto (AND logic)

**Se falhar:** Verifique se renderList() aplica todos os filtros

---

### Teste 10: Responsividade 📱
**Objetivo:** Verificar se interface adapta ao tamanho da tela

**Desktop (>1200px):**
1. Maximize a janela do navegador
2. Verifique se todos os filtros ficam em uma linha

**Tablet (768px):**
1. Redimensione para ~768px de largura
2. Verifique se filters se reorganizam

**Mobile (<768px):**
1. Redimensione para ~480px de largura
2. Verifique se:
   - [ ] Cada grupo "De"/"Até" cabe na tela
   - [ ] Seletores não ficam sobrepostos
   - [ ] Botão "Limpar" permanece acessível

**Se elementos se sobrepõem:** Ajuste em index.css media queries

---

## 🔍 Debug / Troubleshooting

### Console DevTools (F12 → Console)

**Comando 1: Verificar State**
```javascript
console.log(window.CerneApp.state.dateFilters);
```

Deve mostrar:
```javascript
{
  dayFrom: "",
  monthFrom: "",
  yearFrom: "",
  dayTo: "",
  monthTo: "",
  yearTo: ""
}
```

**Comando 2: Testar Parsing**
```javascript
window.CerneApp.state.mockFilterData = { data: '15/07/2026' };
// Depois chamar renderList() manualmente
```

**Comando 3: Verificar Elementos**
```javascript
document.querySelectorAll('.date-filter-group').length // Deve ser 2
document.querySelectorAll('.date-select').length // Deve ser 6
```

---

## 📊 Dados de Teste Recomendados

Se o banco estiver vazio, execute:

```sql
INSERT INTO evidences ("data", "tipo", "categoria", "responsavel", "titulo") VALUES
('01/01/2024', 'Folha', 'Legal', 'João Silva', 'Documento 1'),
('15/07/2024', 'Folha', 'Legal', 'Maria Santos', 'Documento 2'),
('30/09/2024', 'Foto', 'Financeiro', 'João Silva', 'Documento 3'),
('01/01/2025', 'Vídeo', 'Técnico', 'Pedro Costa', 'Documento 4'),
('15/07/2025', 'Folha', 'Legal', 'Maria Santos', 'Documento 5'),
('30/09/2025', 'Foto', 'Financeiro', 'João Silva', 'Documento 6'),
('01/01/2026', 'Vídeo', 'Técnico', 'Pedro Costa', 'Documento 7'),
('15/07/2026', 'Folha', 'Legal', 'Maria Santos', 'Documento 8'),
('30/09/2026', 'Foto', 'Financeiro', 'João Silva', 'Documento 9');
```

---

## 📞 Relatório de Bugs

Se encontrar problemas, documente:
1. **Reprodução:** Passos exatos para reproduzir
2. **Esperado:** O que deveria acontecer
3. **Atual:** O que realmente acontece
4. **Console:** Copie erros do DevTools
5. **Ambiente:** OS, navegador, versão Node

Exemplo:
```
Bug: Fevereiro mostrando 29 dias em ano não bissexto
Reprodução: 1. Mês=Fevereiro 2. Ano=2025 3. Clica em Dia
Esperado: Máximo 28 dias
Atual: Máximo 29 dias
Console: [sem erros]
Ambiente: Windows 10, Chrome 120, Node 18
```

---

## ✅ Conclusão

Se todos os testes passarem:
- ✅ Implementação está correta
- ✅ Pronta para produção
- ✅ Documentação criada

Se algum teste falhar:
- 📖 Consulte este guia
- 🔧 Verifique a seção relevante
- 🐛 Documente o bug conforme instruções acima
