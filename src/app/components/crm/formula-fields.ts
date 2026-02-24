/**
 * Formula Fields — Available fields & demo context for the Formula Builder.
 */

import type { FieldSchema, FormulaContext } from "./formula-engine";

/* ================================================================== */
/*  Available fields for the formula builder                           */
/* ================================================================== */

export const FORMULA_AVAILABLE_FIELDS: FieldSchema[] = [
  // Lead fields
  { key: "valor_estimado", label: "Valor Estimado", type: "currency", objectGroup: "lead" },
  { key: "probabilidade", label: "Probabilidade (%)", type: "percentage", objectGroup: "lead" },
  { key: "desconto", label: "Desconto (%)", type: "percentage", objectGroup: "lead" },
  { key: "quantidade", label: "Quantidade", type: "number", objectGroup: "lead" },
  { key: "preco_unitario", label: "Preco Unitario", type: "currency", objectGroup: "lead" },
  { key: "nome", label: "Nome", type: "text", objectGroup: "lead" },
  { key: "email", label: "Email", type: "text", objectGroup: "lead" },
  { key: "empresa", label: "Empresa", type: "text", objectGroup: "lead" },
  { key: "created_at", label: "Data Criacao", type: "date", objectGroup: "lead" },

  // Oportunidade fields
  { key: "valor_proposta", label: "Valor da Proposta", type: "currency", objectGroup: "oportunidade" },
  { key: "mrr", label: "MRR", type: "currency", objectGroup: "oportunidade" },
  { key: "meses_contrato", label: "Meses de Contrato", type: "number", objectGroup: "oportunidade" },
  { key: "comissao_pct", label: "Comissao (%)", type: "percentage", objectGroup: "oportunidade" },

  // Contato fields
  { key: "telefone", label: "Telefone", type: "text", objectGroup: "contato" },
  { key: "cargo", label: "Cargo", type: "text", objectGroup: "contato" },

  // Conta fields
  { key: "receita_anual", label: "Receita Anual", type: "currency", objectGroup: "conta" },
  { key: "num_funcionarios", label: "Num. Funcionarios", type: "number", objectGroup: "conta" },
];

/* ================================================================== */
/*  Demo context for live formula preview                              */
/* ================================================================== */

export const FORMULA_DEMO_CONTEXT: FormulaContext = {
  valor_estimado: 25000,
  probabilidade: 75,
  desconto: 10,
  quantidade: 3,
  preco_unitario: 8500,
  nome: "Joao Silva",
  email: "joao@empresa.com",
  empresa: "Acme Corp",
  created_at: "2025-06-15",
  valor_proposta: 42000,
  mrr: 3500,
  meses_contrato: 12,
  comissao_pct: 8,
  telefone: "(11) 99999-0000",
  cargo: "Diretor de Marketing",
  receita_anual: 5000000,
  num_funcionarios: 120,
};
