import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import XLSX from 'xlsx';
import Tesseract from 'tesseract.js';
import PDFParser from 'pdf2json';
import { pdf } from 'pdf-to-img';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const MODELO_PADRAO = 'gemini-3.6-flash';

/**
 * Função Universal para ler e resumir QUALQUER arquivo.
 */
export async function resumirQualquerDocumento(caminhoArquivo) {
  try {
    // 0. VALIDAÇÃO DE ARQUIVO
    if (!fs.existsSync(caminhoArquivo)) {
      throw new Error(`Arquivo não encontrado no caminho: ${caminhoArquivo}`);
    }

    const stats = fs.statSync(caminhoArquivo);
    if (stats.size === 0) {
      throw new Error('O arquivo fornecido está vazio (0 bytes).');
    }

    const extensao = path.extname(caminhoArquivo).toLowerCase();
    let textoExtraido = '';

    // 1. IMAGENS (OCR via Tesseract.js)
    if (['.png', '.jpg', '.jpeg', '.webp'].includes(extensao)) {
      console.log('Executando OCR na imagem...');
      const resultado = await Tesseract.recognize(caminhoArquivo, 'por');
      textoExtraido = resultado.data.text;
    }

    // 2. PDF (Leitura resiliente de texto + Fallback com conversão para imagem/OCR)
    else if (extensao === '.pdf') {
      console.log('Tentando extrair texto direto do PDF...');
      
      try {
        textoExtraido = await new Promise((resolve, reject) => {
          const pdfParser = new PDFParser(null, 1);
          pdfParser.on('pdfParser_dataError', errData => reject(new Error(errData.parserError)));
          pdfParser.on('pdfParser_dataReady', () => {
            resolve(pdfParser.getRawTextContent());
          });
          pdfParser.loadPDF(caminhoArquivo);
        });
      } catch (pdfErr) {
        console.warn('Estrutura de texto do PDF indisponível. Convertendo páginas do PDF em imagem para OCR...');
      }

      // Se não encontrou texto (PDF digitalizado ou corrompido), converte em imagens e passa no OCR
      if (!textoExtraido || textoExtraido.trim().length === 0) {
        let contadorPaginas = 1;
        const document = await pdf(caminhoArquivo, { scale: 2 });

        for await (const image of document) {
          console.log(`Lendo página ${contadorPaginas} via OCR...`);
          const resultadoOcr = await Tesseract.recognize(image, 'por');
          textoExtraido += `\n--- PÁGINA ${contadorPaginas} ---\n` + resultadoOcr.data.text;
          contadorPaginas++;
        }
      }
    }

    // 3. WORD (.docx)
    else if (extensao === '.docx') {
      const resultado = await mammoth.extractRawText({ path: caminhoArquivo });
      textoExtraido = resultado.value;
    }

    // 4. EXCEL (.xlsx, .xls, .csv)
    else if (['.xlsx', '.xls'].includes(extensao)) {
  const fileBuffer = fs.readFileSync(caminhoArquivo);
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  
  let textoPlanilha = '';
  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    const csvData = XLSX.utils.sheet_to_csv(worksheet);
    if (csvData.trim()) {
      textoPlanilha += `--- Aba: ${sheetName} ---\n${csvData}\n\n`;
    }
  });

  textoExtraido = textoPlanilha;
}

    // 5. TEXTO PLANO (.txt)
    else if (extensao === '.txt') {
      textoExtraido = fs.readFileSync(caminhoArquivo, 'utf-8');
    }

    else {
      throw new Error(`Formato de arquivo não suportado: ${extensao}`);
    }

    // Valida se o texto extraído é válido
    if (!textoExtraido || textoExtraido.trim().length === 0) {
      throw new Error('Não foi possível extrair nenhum texto legível do arquivo.');
    }

    console.log('Texto extraído com sucesso. Enviando para o Gemini...');
    return await resumirTextoSimples(textoExtraido);

  } catch (error) {
    console.error(`Erro ao processar o arquivo ${caminhoArquivo}:`, error.message);
    throw error;
  }
}

/**
 * Envia o texto extraído para a IA
 */
export async function resumirTextoSimples(texto) {
  const response = await ai.models.generateContent({
    model: MODELO_PADRAO,
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `Você é um assistente especializado em análise de documentos. 
Leia o texto extraído a seguir e gere um resumo claro, direto e estruturado com os pontos principais:

Conteúdo:
${texto}`,
          },
        ],
      },
    ],
  });

  return response.text;
}

// --- TESTE ---
// async function testar() {
  // console.log('--- TESTANDO LEITURA LOCAL + GEMINI ---');
  //try {
   // const caminhoDoArquivo = './ata_de_reuniao_test.pdf'; 

   // console.log(`Analisando o arquivo: ${caminhoDoArquivo}...`);
   // const resumo = await resumirQualquerDocumento(caminhoDoArquivo);

   // console.log('\n--- RESUMO GERADO ---');
   // console.log(resumo);
//  } catch (err) {
 //   console.error('Falha no teste:', err.message);
  // }
// }

// testar();