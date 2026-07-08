#!/bin/bash
# Quick Test Script for Smart Date Filter

echo "🧪 Testando Filtro de Data Inteligente"
echo "======================================"
echo ""

# Test 1: Check SearchBar structure
echo "✓ Verificando estrutura do SearchBar..."
grep -q "date-filter-group" src/components/SearchBar.js && echo "  ✓ date-filter-group encontrado" || echo "  ✗ ERRO: date-filter-group não encontrado"
grep -q "filter-day-from" src/components/SearchBar.js && echo "  ✓ Seletores de dia encontrados" || echo "  ✗ ERRO: Seletores não encontrados"
grep -q "updateDaysInMonth" src/components/SearchBar.js && echo "  ✓ Função updateDaysInMonth encontrada" || echo "  ✗ ERRO: Função não encontrada"
echo ""

# Test 2: Check CSS styles
echo "✓ Verificando estilos CSS..."
grep -q ".date-filter-group" src/index.css && echo "  ✓ Estilos de date-filter-group encontrados" || echo "  ✗ ERRO: Estilos não encontrados"
grep -q ".date-select" src/index.css && echo "  ✓ Estilos de date-select encontrados" || echo "  ✗ ERRO: Estilos não encontrados"
grep -q "clear-date-btn" src/index.css && echo "  ✓ Estilos do botão de limpeza encontrados" || echo "  ✗ ERRO: Estilos não encontrados"
echo ""

# Test 3: Check app.js logic
echo "✓ Verificando lógica de app.js..."
grep -q "dayFrom.*monthFrom.*yearFrom" src/app.js && echo "  ✓ State de dateFilters encontrado" || echo "  ✗ ERRO: State não encontrado"
grep -q "handleDateFilterChange" src/app.js && echo "  ✓ Função handleDateFilterChange encontrada" || echo "  ✗ ERRO: Função não encontrada"
grep -q "parseDate" src/app.js && echo "  ✓ Função parseDate encontrada" || echo "  ✗ ERRO: Função não encontrada"
echo ""

# Test 4: Check dependencies
echo "✓ Verificando dependências..."
grep -q '"flatpickr"' package.json && echo "  ✗ ERRO: Flatpickr ainda no package.json" || echo "  ✓ Flatpickr removido corretamente"
echo ""

# Test 5: Run npm install
echo "✓ Instalando dependências..."
npm install --silent > /dev/null 2>&1 && echo "  ✓ npm install completado" || echo "  ✗ ERRO ao executar npm install"
echo ""

echo "✅ Testes concluídos!"
echo ""
echo "Para iniciar o servidor, execute:"
echo "  npm run dev"
echo "  ou"
echo "  node server.js"
