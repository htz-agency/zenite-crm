/**
 * CRM Settings — Todos Campos
 *
 * Full field manager for Lead and Opportunity fields.
 * Grouped by section (grupos de campos), each field shows label, type badge,
 * visibility toggle and required toggle.
 */

import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Textbox,
  MagnifyingGlass,
  Eye,
  Asterisk,
  CaretDown,
  TextT,
  Hash,
  Phone,
  EnvelopeSimple,
  Calendar,
  Link as LinkIcon,
  UserCircle,
  ToggleLeft,
  MapPin,
  Tag,
  ListBullets,
  Function as FnIcon,
  Fingerprint,
  Timer,
  CurrencyDollar,
  Percent,
  TextAlignLeft,
  TreeStructure,
  CaretCircleUpDown,
  Shapes,
  DotsSixVertical,
  Plus,
  Trash,
} from "@phosphor-icons/react";
import { ZeniteToggle } from "../zenite-toggle";
import { PillButton } from "../pill-button";
import { getFieldConfig, patchFieldConfig, listCustomFields, deleteCustomField, type CustomFieldDef } from "./crm-api";
import { toast } from "sonner";

/* ================================================================== */
/*  Shared styles                                                      */
/* ================================================================== */

const fontFeature = { fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" };

/* ================================================================== */
/*  Field type definitions                                             */
/* ================================================================== */

export type FieldType =
  | "text"
  | "textarea"
  | "phone"
  | "email"
  | "link"
  | "user"
  | "boolean"
  | "date"
  | "time"
  | "datetime"
  | "number"
  | "percentage"
  | "currency"
  | "duration"
  | "association"
  | "address"
  | "type"
  | "multipicklist"
  | "combobox"
  | "calculated"
  | "id"
  | "contextual";

export interface NativeField {
  key: string;
  label: string;
  fieldType: FieldType;
  section: string;
  editable: boolean;       // user-editable (not system-locked)
  required: boolean;       // default required state
  visible: boolean;        // default visible state
  description?: string;
  /** Pre-defined options for type / multipicklist / combobox fields */
  options?: { value: string; label: string; color: string }[];
}

type ObjectType = "lead" | "oportunidade" | "contato" | "conta" | "atividade";

/* ================================================================== */
/*  Field type display helpers                                         */
/* ================================================================== */

const FIELD_TYPE_META: Record<FieldType, { label: string; color: string; bg: string; icon: React.ComponentType<any> }> = {
  text:          { label: "Texto",          color: "#4e6987", bg: "#f0f2f5", icon: TextT },
  textarea:      { label: "Texto Longo",    color: "#4e6987", bg: "#f0f2f5", icon: TextAlignLeft },
  phone:         { label: "Telefone",       color: "#3ccea7", bg: "#d9f8ef", icon: Phone },
  email:         { label: "Email",          color: "#07abde", bg: "#dcf0ff", icon: EnvelopeSimple },
  link:          { label: "Link",           color: "#07abde", bg: "#dcf0ff", icon: LinkIcon },
  user:          { label: "Usuário",        color: "#07abde", bg: "#dcf0ff", icon: UserCircle },
  boolean:       { label: "Booleano",       color: "#3ccea7", bg: "#d9f8ef", icon: ToggleLeft },
  date:          { label: "Data",           color: "#eac23d", bg: "#feedca", icon: Calendar },
  time:          { label: "Hora",           color: "#eac23d", bg: "#feedca", icon: Timer },
  datetime:      { label: "Data e Hora",    color: "#eac23d", bg: "#feedca", icon: Calendar },
  number:        { label: "Número",         color: "#8c8cd4", bg: "#e8e8fd", icon: Hash },
  percentage:    { label: "Porcentagem",    color: "#8c8cd4", bg: "#e8e8fd", icon: Percent },
  currency:      { label: "Moeda",          color: "#3ccea7", bg: "#d9f8ef", icon: CurrencyDollar },
  duration:      { label: "Duração",        color: "#eac23d", bg: "#feedca", icon: Timer },
  association:   { label: "Associação",     color: "#07abde", bg: "#dcf0ff", icon: TreeStructure },
  address:       { label: "Endereço",       color: "#4e6987", bg: "#f0f2f5", icon: MapPin },
  type:          { label: "Etiqueta",       color: "#ff8c76", bg: "#ffedeb", icon: Tag },
  multipicklist: { label: "Multi-seleção",  color: "#ff8c76", bg: "#ffedeb", icon: ListBullets },
  combobox:      { label: "Combobox",       color: "#ff8c76", bg: "#ffedeb", icon: CaretCircleUpDown },
  calculated:    { label: "Calculado",      color: "#8C8CD4", bg: "#e8e8fd", icon: FnIcon },
  id:            { label: "ID",             color: "#98989d", bg: "#f0f2f5", icon: Fingerprint },
  contextual:    { label: "Contextual",     color: "#8C8CD4", bg: "#e8e8fd", icon: Shapes },
};

/* ================================================================== */
/*  Lead fields                                                        */
/* ================================================================== */

export const LEAD_FIELDS: NativeField[] = [
  // Detalhes do Lead
  { key: "lead_owner",             label: "Proprietário",              fieldType: "user",          section: "Detalhes do Lead",       editable: true,  required: true,  visible: true },
  { key: "lead_type",              label: "Tipo de Lead",              fieldType: "type",          section: "Detalhes do Lead",       editable: true,  required: false, visible: true, description: "Pessoa Física, Pessoa Jurídica, Parceiro", options: [
    { value: "Pessoa Física", label: "Pessoa Física", color: "#07abde" },
    { value: "Pessoa Jurídica", label: "Pessoa Jurídica", color: "#3ccea7" },
    { value: "Parceiro", label: "Parceiro", color: "#8c8cd4" },
  ] },
  { key: "lead_name",              label: "Nome",                      fieldType: "text",          section: "Detalhes do Lead",       editable: true,  required: true,  visible: true },
  { key: "lead_lastname",         label: "Sobrenome",                 fieldType: "text",          section: "Detalhes do Lead",       editable: true,  required: false, visible: true },
  { key: "lead_phone",             label: "Telefone",                  fieldType: "phone",         section: "Detalhes do Lead",       editable: true,  required: false, visible: true },
  { key: "lead_role",              label: "Cargo",                     fieldType: "text",          section: "Detalhes do Lead",       editable: true,  required: false, visible: true },
  { key: "lead_email",             label: "Email",                     fieldType: "email",         section: "Detalhes do Lead",       editable: true,  required: true,  visible: true },
  { key: "lead_company",           label: "Empresa",                   fieldType: "text",          section: "Detalhes do Lead",       editable: true,  required: false, visible: true, description: "Texto livre (não vinculado a Conta)" },
  { key: "lead_stage_complement",  label: "Complemento do Estágio",    fieldType: "contextual",    section: "Detalhes do Lead",       editable: true,  required: false, visible: true, description: "Opções dinâmicas por estágio" },
  { key: "lead_origin",            label: "Origem",                    fieldType: "text",          section: "Detalhes do Lead",       editable: true,  required: false, visible: true },
  { key: "lead_address",           label: "Endereço",                  fieldType: "address",       section: "Detalhes do Lead",       editable: true,  required: false, visible: true },
  { key: "lead_segment",           label: "Segmento",                  fieldType: "text",          section: "Detalhes do Lead",       editable: true,  required: false, visible: true },

  // Campos estendidos
  { key: "lead_website",           label: "Website",                   fieldType: "link",          section: "Campos Estendidos",      editable: true,  required: false, visible: true },
  { key: "lead_preferred_contact", label: "Contato Preferencial",      fieldType: "combobox",      section: "Campos Estendidos",      editable: true,  required: false, visible: true, description: "Email, Telefone, WhatsApp, Presencial", options: [
    { value: "Email", label: "Email", color: "#07abde" },
    { value: "Telefone", label: "Telefone", color: "#3ccea7" },
    { value: "WhatsApp", label: "WhatsApp", color: "#3eb370" },
    { value: "Presencial", label: "Presencial", color: "#eac23d" },
  ] },
  { key: "lead_annual_revenue",    label: "Receita Anual",             fieldType: "currency",      section: "Campos Estendidos",      editable: true,  required: false, visible: true },
  { key: "lead_conversion_rate",   label: "Taxa de Conversão",         fieldType: "calculated",    section: "Campos Estendidos",      editable: false, required: false, visible: true, description: "leads_convertidos / total_leads * 100" },
  { key: "lead_employee_count",    label: "Nº Funcionários",           fieldType: "number",        section: "Campos Estendidos",      editable: true,  required: false, visible: true },
  { key: "lead_is_active",         label: "Lead Ativo",                fieldType: "boolean",       section: "Campos Estendidos",      editable: true,  required: false, visible: true },
  { key: "lead_tags",              label: "Tags",                      fieldType: "multipicklist", section: "Campos Estendidos",      editable: true,  required: false, visible: true, description: "Inbound, Outbound, Marketing Digital, Indicação...", options: [
    { value: "inbound", label: "Inbound", color: "#3CCEA7" },
    { value: "outbound", label: "Outbound", color: "#8C8CD4" },
    { value: "marketing-digital", label: "Marketing Digital", color: "#07ABDE" },
    { value: "indicacao", label: "Indicação", color: "#EAC23D" },
    { value: "urgente", label: "Urgente", color: "#B13B00" },
    { value: "vip", label: "VIP", color: "#6868B1" },
    { value: "novo-cliente", label: "Novo Cliente", color: "#0483AB" },
    { value: "recontato", label: "Recontato", color: "#D4A017" },
  ] },
  { key: "lead_notes",             label: "Observações",               fieldType: "textarea",      section: "Campos Estendidos",      editable: true,  required: false, visible: true },

  // Campos calculados
  { key: "lead_days_no_contact",   label: "Dias Sem Contato",          fieldType: "calculated",    section: "Campos Calculados",      editable: false, required: false, visible: true, description: "DAYS_SINCE([lastActivityDate])" },
  { key: "lead_rev_per_employee",  label: "Receita por Funcionário",   fieldType: "calculated",    section: "Campos Calculados",      editable: false, required: false, visible: true, description: "[annualRevenue] / [employeeCount]" },
  { key: "lead_inactivity_alert",  label: "Alerta de Inatividade",     fieldType: "calculated",    section: "Campos Calculados",      editable: false, required: false, visible: true, description: "IF(DAYS_SINCE > 30, Crítico, ...)" },
  { key: "lead_classification",    label: "Classificação do Lead",     fieldType: "calculated",    section: "Campos Calculados",      editable: false, required: false, visible: true, description: "IF([score] >= 80, Lead quente, ...)" },
  { key: "lead_commission",        label: "Comissão do Vendedor",      fieldType: "calculated",    section: "Campos Calculados",      editable: false, required: false, visible: true, description: "[annualRevenue] * 0.05" },
  { key: "lead_score_normalized",  label: "Score Normalizado",         fieldType: "calculated",    section: "Campos Calculados",      editable: false, required: false, visible: true, description: "[score]" },

  // Qualificação
  { key: "lead_qual_progress",     label: "Progresso de Qualificação", fieldType: "percentage",    section: "Qualificação do Lead",   editable: false, required: false, visible: true, description: "Powered by HTZ-AI" },

  // Dados de Marketing
  { key: "lead_mkt_campanha",      label: "Campanha",                  fieldType: "text",          section: "Dados de Marketing",     editable: true,  required: false, visible: true },
  { key: "lead_mkt_grupo",         label: "Grupo de Anúncios",         fieldType: "text",          section: "Dados de Marketing",     editable: true,  required: false, visible: true },
  { key: "lead_mkt_anuncio",       label: "Anúncio",                   fieldType: "text",          section: "Dados de Marketing",     editable: true,  required: false, visible: true },
  { key: "lead_mkt_conversao",     label: "Última Conversão",          fieldType: "datetime",      section: "Dados de Marketing",     editable: true,  required: false, visible: true },
  { key: "lead_mkt_canal",         label: "Canal",                     fieldType: "type",          section: "Dados de Marketing",     editable: true,  required: false, visible: true, description: "Google Ads, Meta Ads, LinkedIn Ads", options: [
    { value: "Google Ads", label: "Google Ads", color: "#07abde" },
    { value: "Meta Ads", label: "Meta Ads", color: "#3ccea7" },
    { value: "LinkedIn Ads", label: "LinkedIn Ads", color: "#8c8cd4" },
  ] },

  // Informações do Lead
  { key: "lead_updated_at",        label: "Última Atualização",        fieldType: "datetime",      section: "Informações do Lead",    editable: false, required: false, visible: true },
  { key: "lead_created_at",        label: "Criado Em",                 fieldType: "datetime",      section: "Informações do Lead",    editable: false, required: false, visible: true },
  { key: "lead_updated_by",        label: "Última Atualização Feita Por", fieldType: "user",       section: "Informações do Lead",    editable: false, required: false, visible: true },
  { key: "lead_created_by",        label: "Criado Por",                fieldType: "user",          section: "Informações do Lead",    editable: false, required: false, visible: true },

  // Informações do Sistema
  { key: "lead_id",                label: "ID do Registro",            fieldType: "id",            section: "Informações do Sistema", editable: false, required: false, visible: true },
  { key: "lead_last_ref",          label: "Última Referência",         fieldType: "datetime",      section: "Informações do Sistema", editable: false, required: false, visible: false },
  { key: "lead_is_deleted",        label: "Na Lixeira",                fieldType: "boolean",       section: "Informações do Sistema", editable: false, required: false, visible: false },
  { key: "lead_system_modstamp",   label: "System Modstamp",           fieldType: "datetime",      section: "Informações do Sistema", editable: false, required: false, visible: false },
  { key: "lead_last_viewed",       label: "Última Visualização",       fieldType: "datetime",      section: "Informações do Sistema", editable: false, required: false, visible: false },
  { key: "lead_time_in_stage",     label: "Tempo no Estágio",          fieldType: "calculated",    section: "Informações do Sistema", editable: false, required: false, visible: true, description: "CONCAT(DAYS_SINCE([stageLastChangedAt]), \" dias\")" },
];

/* ================================================================== */
/*  Opportunity fields                                                 */
/* ================================================================== */

export const OPPORTUNITY_FIELDS: NativeField[] = [
  // Detalhes da Oportunidade
  { key: "op_owner",               label: "Proprietário",              fieldType: "user",          section: "Detalhes da Oportunidade", editable: true,  required: true,  visible: true },
  { key: "op_type_op",             label: "Tipo de OP",                fieldType: "type",          section: "Detalhes da Oportunidade", editable: true,  required: false, visible: true, description: "Pessoa Física, Pessoa Jurídica, Novo negócio", options: [
    { value: "Pessoa Física", label: "Pessoa Física", color: "#07abde" },
    { value: "Pessoa Jurídica", label: "Pessoa Jurídica", color: "#3ccea7" },
    { value: "Novo negócio", label: "Novo negócio", color: "#eac23d" },
  ] },
  { key: "op_decisor",             label: "Decisor",                   fieldType: "user",          section: "Detalhes da Oportunidade", editable: true,  required: false, visible: true },
  { key: "op_account",             label: "Conta",                     fieldType: "association",   section: "Detalhes da Oportunidade", editable: true,  required: false, visible: true, description: "Associação com Conta" },
  { key: "op_stage_complement",    label: "Complemento do Estágio",    fieldType: "contextual",    section: "Detalhes da Oportunidade", editable: true,  required: false, visible: true, description: "Opções dinâmicas por estágio" },
  { key: "op_type",                label: "Tipo",                      fieldType: "type",          section: "Detalhes da Oportunidade", editable: true,  required: false, visible: true, description: "Novo negócio, Renovação, Upsell", options: [
    { value: "Novo negócio", label: "Novo negócio", color: "#3ccea7" },
    { value: "Renovação", label: "Renovação", color: "#07abde" },
    { value: "Upsell", label: "Upsell", color: "#eac23d" },
  ] },

  // Probabilidade de compra
  { key: "op_most_recent",         label: "OP Mais Recente",           fieldType: "boolean",       section: "Probabilidade de Compra",  editable: true,  required: false, visible: true },

  // Levantamento de necessidades
  { key: "op_needs_objective",     label: "Objetivo",                  fieldType: "textarea",      section: "Levantamento de Necessidades", editable: true,  required: false, visible: true },
  { key: "op_needs_situation",     label: "Situação Atual",            fieldType: "textarea",      section: "Levantamento de Necessidades", editable: true,  required: false, visible: true },
  { key: "op_needs_challenges",    label: "Desafios",                  fieldType: "textarea",      section: "Levantamento de Necessidades", editable: true,  required: false, visible: true },
  { key: "op_needs_budget",        label: "Orçamento Previsto",        fieldType: "text",          section: "Levantamento de Necessidades", editable: true,  required: false, visible: true },
  { key: "op_needs_timeline",      label: "Prazo / Timeline",          fieldType: "text",          section: "Levantamento de Necessidades", editable: true,  required: false, visible: true },
  { key: "op_needs_notes",         label: "Observações",               fieldType: "textarea",      section: "Levantamento de Necessidades", editable: true,  required: false, visible: true },

  // Dados de Marketing
  { key: "op_origin",              label: "Origem",                    fieldType: "text",          section: "Dados de Marketing",       editable: true,  required: false, visible: true },
  { key: "op_mkt_campanha",        label: "Campanha",                  fieldType: "text",          section: "Dados de Marketing",       editable: true,  required: false, visible: true },
  { key: "op_mkt_grupo",           label: "Grupo de Anúncios",         fieldType: "text",          section: "Dados de Marketing",       editable: true,  required: false, visible: true },
  { key: "op_mkt_anuncio",         label: "Anúncio",                   fieldType: "text",          section: "Dados de Marketing",       editable: true,  required: false, visible: true },
  { key: "op_mkt_conversao",       label: "Última Conversão",          fieldType: "datetime",      section: "Dados de Marketing",       editable: true,  required: false, visible: true },
  { key: "op_mkt_canal",           label: "Canal",                     fieldType: "type",          section: "Dados de Marketing",       editable: true,  required: false, visible: true, description: "Google Ads, Meta Ads, LinkedIn Ads", options: [
    { value: "Google Ads", label: "Google Ads", color: "#07abde" },
    { value: "Meta Ads", label: "Meta Ads", color: "#3ccea7" },
    { value: "LinkedIn Ads", label: "LinkedIn Ads", color: "#8c8cd4" },
  ] },

  // Informações da Oportunidade
  { key: "op_updated_at",          label: "Última Atualização",        fieldType: "datetime",      section: "Informações da Oportunidade", editable: false, required: false, visible: true },
  { key: "op_created_at",          label: "Criado Em",                 fieldType: "datetime",      section: "Informações da Oportunidade", editable: false, required: false, visible: true },
  { key: "op_updated_by",          label: "Última Atualização Feita Por", fieldType: "user",       section: "Informações da Oportunidade", editable: false, required: false, visible: true },
  { key: "op_created_by",          label: "Criado Por",                fieldType: "user",          section: "Informações da Oportunidade", editable: false, required: false, visible: true },

  // Informações do Sistema
  { key: "op_id",                  label: "ID do Registro",            fieldType: "id",            section: "Informações do Sistema",   editable: false, required: false, visible: true },
  { key: "op_close_date",          label: "Data de Fechamento",        fieldType: "date",          section: "Informações do Sistema",   editable: false, required: false, visible: true },
  { key: "op_time_in_stage",       label: "Tempo no Estágio",          fieldType: "calculated",    section: "Informações do Sistema",   editable: false, required: false, visible: true, description: "CONCAT(DAYS_SINCE([stageLastChangedAt]), \" dias\")" },
];

/* ================================================================== */
/*  Contact fields                                                     */
/* ================================================================== */

export const CONTACT_FIELDS: NativeField[] = [
  { key: "ct_owner",             label: "Proprietário",           fieldType: "user",          section: "Detalhes do Contato",    editable: true,  required: true,  visible: true },
  { key: "ct_name",              label: "Nome",                   fieldType: "text",          section: "Detalhes do Contato",    editable: true,  required: true,  visible: true },
  { key: "ct_last_name",         label: "Sobrenome",              fieldType: "text",          section: "Detalhes do Contato",    editable: true,  required: true,  visible: true },
  { key: "ct_account",           label: "Conta",                  fieldType: "association",   section: "Detalhes do Contato",    editable: true,  required: false, visible: true, description: "Associação com Conta" },
  { key: "ct_role",              label: "Cargo",                  fieldType: "text",          section: "Detalhes do Contato",    editable: true,  required: false, visible: true },
  { key: "ct_department",        label: "Departamento",           fieldType: "text",          section: "Detalhes do Contato",    editable: true,  required: false, visible: true },
  { key: "ct_origin",            label: "Origem",                 fieldType: "type",          section: "Detalhes do Contato",    editable: true,  required: false, visible: true, description: "Prospecção, Indicação, Email, Rede Social, Evento, Site", options: [
    { value: "Prospecção", label: "Prospecção", color: "#07abde" },
    { value: "Indicação", label: "Indicação", color: "#3ccea7" },
    { value: "Email", label: "Email", color: "#eac23d" },
    { value: "Rede Social", label: "Rede Social", color: "#8c8cd4" },
    { value: "Evento", label: "Evento", color: "#ff8c76" },
    { value: "Site", label: "Site", color: "#3eb370" },
  ] },
  { key: "ct_birth_date",        label: "Data de Nascimento",     fieldType: "date",          section: "Detalhes do Contato",    editable: true,  required: false, visible: true },
  { key: "ct_cpf",               label: "CPF",                    fieldType: "text",          section: "Detalhes do Contato",    editable: true,  required: false, visible: true },
  { key: "ct_phone",             label: "Telefone",               fieldType: "phone",         section: "Informações de Contato", editable: true,  required: false, visible: true },
  { key: "ct_mobile",            label: "Celular",                fieldType: "phone",         section: "Informações de Contato", editable: true,  required: false, visible: true },
  { key: "ct_email",             label: "Email",                  fieldType: "email",         section: "Informações de Contato", editable: true,  required: true,  visible: true },
  { key: "ct_linkedin",          label: "LinkedIn",               fieldType: "link",          section: "Informações de Contato", editable: true,  required: false, visible: true },
  { key: "ct_website",           label: "Website",                fieldType: "link",          section: "Informações de Contato", editable: true,  required: false, visible: true },
  { key: "ct_address",           label: "Endereço",               fieldType: "address",       section: "Informações de Contato", editable: true,  required: false, visible: true },
  { key: "ct_preferred_contact", label: "Contato Preferencial",   fieldType: "combobox",      section: "Informações de Contato", editable: true,  required: false, visible: true, description: "Email, Telefone, WhatsApp, LinkedIn, Presencial", options: [
    { value: "Email", label: "Email", color: "#07abde" },
    { value: "Telefone", label: "Telefone", color: "#3ccea7" },
    { value: "WhatsApp", label: "WhatsApp", color: "#3eb370" },
    { value: "LinkedIn", label: "LinkedIn", color: "#8c8cd4" },
    { value: "Presencial", label: "Presencial", color: "#eac23d" },
  ] },
  { key: "ct_do_not_contact",    label: "Não Perturbe",           fieldType: "boolean",       section: "Informações de Contato", editable: true,  required: false, visible: true },
  { key: "ct_tags",              label: "Tags",                   fieldType: "multipicklist", section: "Dados Complementares",   editable: true,  required: false, visible: true, description: "Cliente VIP, Decisor, Influenciador...", options: [
    { value: "Cliente VIP", label: "Cliente VIP", color: "#eac23d" },
    { value: "Decisor", label: "Decisor", color: "#07abde" },
    { value: "Influenciador", label: "Influenciador", color: "#8c8cd4" },
    { value: "Técnico", label: "Técnico", color: "#3ccea7" },
    { value: "Financeiro", label: "Financeiro", color: "#3eb370" },
  ] },
  { key: "ct_notes",             label: "Observações",            fieldType: "textarea",      section: "Dados Complementares",   editable: true,  required: false, visible: true },
  { key: "ct_updated_at",        label: "Última Atualização",     fieldType: "datetime",      section: "Informações do Contato", editable: false, required: false, visible: true },
  { key: "ct_created_at",        label: "Criado Em",              fieldType: "datetime",      section: "Informações do Contato", editable: false, required: false, visible: true },
  { key: "ct_updated_by",        label: "Última Atualização Por", fieldType: "user",          section: "Informações do Contato", editable: false, required: false, visible: true },
  { key: "ct_created_by",        label: "Criado Por",             fieldType: "user",          section: "Informações do Contato", editable: false, required: false, visible: true },
  { key: "ct_id",                label: "ID do Registro",         fieldType: "id",            section: "Informações do Sistema", editable: false, required: false, visible: true },
  { key: "ct_last_viewed",       label: "Última Visualização",    fieldType: "datetime",      section: "Informações do Sistema", editable: false, required: false, visible: false },
  { key: "ct_last_ref",          label: "Última Referência",      fieldType: "datetime",      section: "Informações do Sistema", editable: false, required: false, visible: false },
  { key: "ct_is_deleted",        label: "Na Lixeira",             fieldType: "boolean",       section: "Informações do Sistema", editable: false, required: false, visible: false },
  { key: "ct_system_modstamp",   label: "System Modstamp",        fieldType: "datetime",      section: "Informações do Sistema", editable: false, required: false, visible: false },
];

/* ================================================================== */
/*  Account fields                                                     */
/* ================================================================== */

export const ACCOUNT_FIELDS: NativeField[] = [
  { key: "ac_type_conta",        label: "Tipo de Conta",              fieldType: "type",          section: "Dados da Conta",          editable: true,  required: true,  visible: true, description: "Empresa, Pessoal", options: [
    { value: "Empresa", label: "Empresa", color: "#07abde" },
    { value: "Pessoal", label: "Pessoal", color: "#eac23d" },
  ] },
  { key: "ac_name",              label: "Nome da Conta",              fieldType: "text",          section: "Dados da Conta",          editable: true,  required: true,  visible: true },
  { key: "ac_account_number",    label: "Número da Conta",            fieldType: "text",          section: "Dados da Conta",          editable: true,  required: false, visible: true },
  { key: "ac_owner",             label: "Responsável",                fieldType: "user",          section: "Dados da Conta",          editable: true,  required: true,  visible: true },
  { key: "ac_type",              label: "Tipo",                       fieldType: "type",          section: "Dados da Conta",          editable: true,  required: false, visible: true, description: "Cliente, Parceiro, Concorrente, Prospect, Outro", options: [
    { value: "Cliente", label: "Cliente", color: "#3ccea7" },
    { value: "Parceiro", label: "Parceiro", color: "#07abde" },
    { value: "Concorrente", label: "Concorrente", color: "#ff8c76" },
    { value: "Prospect", label: "Prospect", color: "#eac23d" },
    { value: "Outro", label: "Outro", color: "#4e6987" },
  ] },
  { key: "ac_sector",            label: "Setor",                      fieldType: "type",          section: "Dados da Conta",          editable: true,  required: false, visible: true, description: "Tecnologia, Consultoria, Indústria, Varejo...", options: [
    { value: "Tecnologia", label: "Tecnologia", color: "#07abde" },
    { value: "Consultoria", label: "Consultoria", color: "#8c8cd4" },
    { value: "Indústria", label: "Indústria", color: "#4e6987" },
    { value: "Varejo", label: "Varejo", color: "#3ccea7" },
    { value: "Financeiro", label: "Financeiro", color: "#eac23d" },
    { value: "SaaS", label: "SaaS", color: "#07abde" },
    { value: "Marketing", label: "Marketing", color: "#ff8c76" },
    { value: "Educação", label: "Educação", color: "#8c8cd4" },
    { value: "Logística", label: "Logística", color: "#4e6987" },
    { value: "Serviços", label: "Serviços", color: "#3eb370" },
    { value: "Saúde", label: "Saúde", color: "#e85d75" },
  ] },
  { key: "ac_website",           label: "Website",                    fieldType: "link",          section: "Dados da Conta",          editable: true,  required: false, visible: true },
  { key: "ac_phone",             label: "Telefone",                   fieldType: "phone",         section: "Dados da Conta",          editable: true,  required: false, visible: true },
  { key: "ac_fax",               label: "Fax",                        fieldType: "text",          section: "Dados da Conta",          editable: true,  required: false, visible: true },
  { key: "ac_cnpj",              label: "CNPJ",                       fieldType: "text",          section: "Dados da Conta",          editable: true,  required: false, visible: true },
  { key: "ac_site",              label: "Unidade / Site",             fieldType: "type",          section: "Dados da Conta",          editable: true,  required: false, visible: true, description: "Matriz, Filial, Unidade única", options: [
    { value: "Matriz", label: "Matriz", color: "#07abde" },
    { value: "Filial", label: "Filial", color: "#3ccea7" },
    { value: "Unidade única", label: "Unidade única", color: "#eac23d" },
  ] },
  { key: "ac_origin",            label: "Origem",                     fieldType: "type",          section: "Dados da Conta",          editable: true,  required: false, visible: true, description: "Prospecção, Indicação, Anúncio, Evento, Site", options: [
    { value: "Prospecção", label: "Prospecção", color: "#07abde" },
    { value: "Indicação", label: "Indicação", color: "#3ccea7" },
    { value: "Anúncio", label: "Anúncio", color: "#eac23d" },
    { value: "Evento", label: "Evento", color: "#ff8c76" },
    { value: "Site", label: "Site", color: "#8c8cd4" },
  ] },
  { key: "ac_preferred_contact", label: "Contato Preferencial",       fieldType: "combobox",      section: "Dados da Conta",          editable: true,  required: false, visible: true, description: "Email, Telefone, WhatsApp, Presencial", options: [
    { value: "Email", label: "Email", color: "#07abde" },
    { value: "Telefone", label: "Telefone", color: "#3ccea7" },
    { value: "WhatsApp", label: "WhatsApp", color: "#3eb370" },
    { value: "Presencial", label: "Presencial", color: "#eac23d" },
  ] },
  { key: "ac_do_not_contact",    label: "Não Perturbe",               fieldType: "boolean",       section: "Dados da Conta",          editable: true,  required: false, visible: true },
  { key: "ac_annual_revenue",    label: "Receita Anual",              fieldType: "currency",      section: "Financeiro",              editable: true,  required: false, visible: true },
  { key: "ac_employees",         label: "Nº Funcionários",            fieldType: "number",        section: "Financeiro",              editable: true,  required: false, visible: true },
  { key: "ac_currency",          label: "Moeda",                      fieldType: "text",          section: "Financeiro",              editable: true,  required: false, visible: true },
  { key: "ac_ownership",         label: "Estrutura Societária",       fieldType: "type",          section: "Financeiro",              editable: true,  required: false, visible: true, description: "Privada, Pública, S/A, Ltda", options: [
    { value: "Privada", label: "Privada", color: "#07abde" },
    { value: "Pública", label: "Pública", color: "#3ccea7" },
    { value: "S/A", label: "S/A", color: "#eac23d" },
    { value: "Ltda", label: "Ltda", color: "#8c8cd4" },
  ] },
  { key: "ac_rating",            label: "Classificação",              fieldType: "type",          section: "Financeiro",              editable: true,  required: false, visible: true, description: "Quente, Morna, Fria", options: [
    { value: "Quente", label: "Quente", color: "#ff8c76" },
    { value: "Morna", label: "Morna", color: "#eac23d" },
    { value: "Fria", label: "Fria", color: "#07abde" },
  ] },
  { key: "ac_billing_street",    label: "Rua (Cobrança)",             fieldType: "text",          section: "Endereço de Cobrança",    editable: true,  required: false, visible: true },
  { key: "ac_billing_city",      label: "Cidade (Cobrança)",          fieldType: "text",          section: "Endereço de Cobrança",    editable: true,  required: false, visible: true },
  { key: "ac_billing_state",     label: "Estado / UF (Cobrança)",     fieldType: "text",          section: "Endereço de Cobrança",    editable: true,  required: false, visible: true },
  { key: "ac_billing_zip",       label: "CEP (Cobrança)",             fieldType: "text",          section: "Endereço de Cobrança",    editable: true,  required: false, visible: true },
  { key: "ac_billing_country",   label: "País (Cobrança)",            fieldType: "text",          section: "Endereço de Cobrança",    editable: true,  required: false, visible: true },
  { key: "ac_shipping_street",   label: "Rua (Entrega)",              fieldType: "text",          section: "Endereço de Entrega",     editable: true,  required: false, visible: true },
  { key: "ac_shipping_city",     label: "Cidade (Entrega)",           fieldType: "text",          section: "Endereço de Entrega",     editable: true,  required: false, visible: true },
  { key: "ac_shipping_state",    label: "Estado / UF (Entrega)",      fieldType: "text",          section: "Endereço de Entrega",     editable: true,  required: false, visible: true },
  { key: "ac_shipping_zip",      label: "CEP (Entrega)",              fieldType: "text",          section: "Endereço de Entrega",     editable: true,  required: false, visible: true },
  { key: "ac_shipping_country",  label: "País (Entrega)",             fieldType: "text",          section: "Endereço de Entrega",     editable: true,  required: false, visible: true },
  { key: "ac_parent_account",    label: "Conta Pai",                  fieldType: "association",   section: "Relacionamento",          editable: true,  required: false, visible: true, description: "Associação com Conta" },
  { key: "ac_partner_account",   label: "Conta Parceira",             fieldType: "boolean",       section: "Relacionamento",          editable: true,  required: false, visible: true },
  { key: "ac_sic_code",          label: "Código SIC",                 fieldType: "text",          section: "Relacionamento",          editable: true,  required: false, visible: true },
  { key: "ac_ticker",            label: "Código de Negociação",       fieldType: "text",          section: "Relacionamento",          editable: true,  required: false, visible: true },
  { key: "ac_description",       label: "Descrição da Conta",         fieldType: "textarea",      section: "Descrição",               editable: true,  required: false, visible: true },
  { key: "ac_tags",              label: "Tags",                       fieldType: "multipicklist", section: "Dados Complementares",     editable: true,  required: false, visible: true, description: "Enterprise, Tecnologia, Premium, Estratégico, Parceiro, Risco", options: [
    { value: "Enterprise", label: "Enterprise", color: "#07abde" },
    { value: "Tecnologia", label: "Tecnologia", color: "#8c8cd4" },
    { value: "Premium", label: "Premium", color: "#3ccea7" },
    { value: "Estratégico", label: "Estratégico", color: "#eac23d" },
    { value: "Parceiro", label: "Parceiro", color: "#ff8c76" },
    { value: "Risco", label: "Risco", color: "#f56233" },
    { value: "Novo", label: "Novo", color: "#3eb370" },
  ] },
  { key: "ac_notes",             label: "Observações",                fieldType: "textarea",      section: "Dados Complementares",     editable: true,  required: false, visible: true },
  { key: "ac_days_no_contact",   label: "Dias Sem Contato",           fieldType: "calculated",    section: "Dados Complementares",     editable: false, required: false, visible: true, description: "DAYS_SINCE([lastActivityDate])" },
  { key: "ac_rev_per_employee",  label: "Receita por Funcionário",    fieldType: "calculated",    section: "Dados Complementares",     editable: false, required: false, visible: true, description: "[annualRevenue] / [employeeCount]" },
  { key: "ac_inactivity_alert",  label: "Alerta de Inatividade",      fieldType: "calculated",    section: "Dados Complementares",     editable: false, required: false, visible: true, description: "IF(DAYS_SINCE > 30, Crítico, ...)" },
  { key: "ac_mkt_campanha",      label: "Campanha",                   fieldType: "text",          section: "Dados de Marketing",       editable: true,  required: false, visible: true },
  { key: "ac_mkt_grupo",         label: "Grupo de Anúncios",          fieldType: "text",          section: "Dados de Marketing",       editable: true,  required: false, visible: true },
  { key: "ac_mkt_anuncio",       label: "Anúncio",                    fieldType: "text",          section: "Dados de Marketing",       editable: true,  required: false, visible: true },
  { key: "ac_mkt_conversao",     label: "Última Conversão",           fieldType: "datetime",      section: "Dados de Marketing",       editable: true,  required: false, visible: true },
  { key: "ac_mkt_canal",         label: "Canal",                      fieldType: "type",          section: "Dados de Marketing",       editable: true,  required: false, visible: true, description: "Google Ads, Meta Ads, LinkedIn Ads", options: [
    { value: "Google Ads", label: "Google Ads", color: "#07abde" },
    { value: "Meta Ads", label: "Meta Ads", color: "#3ccea7" },
    { value: "LinkedIn Ads", label: "LinkedIn Ads", color: "#8c8cd4" },
  ] },
  { key: "ac_updated_at",        label: "Última Atualização",         fieldType: "datetime",      section: "Informações da Conta",     editable: false, required: false, visible: true },
  { key: "ac_created_at",        label: "Criado Em",                  fieldType: "datetime",      section: "Informações da Conta",     editable: false, required: false, visible: true },
  { key: "ac_updated_by",        label: "Última Atualização Feita Por", fieldType: "user",        section: "Informações da Conta",     editable: false, required: false, visible: true },
  { key: "ac_created_by",        label: "Criado Por",                 fieldType: "user",          section: "Informações da Conta",     editable: false, required: false, visible: true },
  { key: "ac_id",                label: "ID do Registro",             fieldType: "id",            section: "Informações do Sistema",   editable: false, required: false, visible: true },
  { key: "ac_time_in_stage",     label: "Tempo no Estágio",           fieldType: "calculated",    section: "Informações do Sistema",   editable: false, required: false, visible: true, description: "CONCAT(DAYS_SINCE([stageLastChangedAt]), \" dias\")" },
  { key: "ac_last_viewed",       label: "Última Visualização",        fieldType: "datetime",      section: "Informações do Sistema",   editable: false, required: false, visible: false },
  { key: "ac_last_ref",          label: "Última Referência",          fieldType: "datetime",      section: "Informações do Sistema",   editable: false, required: false, visible: false },
  { key: "ac_is_deleted",        label: "Na Lixeira",                 fieldType: "boolean",       section: "Informações do Sistema",   editable: false, required: false, visible: false },
  { key: "ac_system_modstamp",   label: "System Modstamp",            fieldType: "datetime",      section: "Informações do Sistema",   editable: false, required: false, visible: false },
];

/* ================================================================== */
/*  Activity fields                                                    */
/* ================================================================== */

export const ACTIVITY_FIELDS: NativeField[] = [
  // ── Campos Gerais ──
  { key: "at_type",              label: "Tipo de Atividade",          fieldType: "type",          section: "Campos Gerais",              editable: true,  required: true,  visible: true, description: "compromisso, tarefa, ligacao, nota, mensagem, email", options: [
    { value: "compromisso", label: "Compromisso", color: "#FF8C76" },
    { value: "tarefa", label: "Tarefa", color: "#8C8CD4" },
    { value: "ligacao", label: "Ligação", color: "#3CCEA7" },
    { value: "nota", label: "Nota", color: "#EAC23D" },
    { value: "mensagem", label: "Mensagem", color: "#07ABDE" },
    { value: "email", label: "Email", color: "#4E6987" },
  ] },
  { key: "at_subject",           label: "Assunto",                    fieldType: "text",          section: "Campos Gerais",              editable: true,  required: true,  visible: true },
  { key: "at_description",       label: "Descrição",                  fieldType: "textarea",      section: "Campos Gerais",              editable: true,  required: false, visible: true },
  { key: "at_status",            label: "Status",                     fieldType: "contextual",    section: "Campos Gerais",              editable: true,  required: false, visible: true, description: "Varia por tipo de atividade", options: [
    { value: "agendado", label: "Agendado", color: "#07abde" },
    { value: "confirmado", label: "Confirmado", color: "#3ccea7" },
    { value: "em_andamento", label: "Em Andamento", color: "#eac23d" },
    { value: "concluido", label: "Concluído", color: "#3eb370" },
    { value: "cancelado", label: "Cancelado", color: "#ff8c76" },
    { value: "nao_iniciada", label: "Não Iniciada", color: "#98989d" },
    { value: "aguardando", label: "Aguardando", color: "#8c8cd4" },
    { value: "nao_atendida", label: "Não Atendida", color: "#f56233" },
    { value: "rascunho", label: "Rascunho", color: "#98989d" },
    { value: "publicada", label: "Publicada", color: "#3ccea7" },
    { value: "enviada", label: "Enviada", color: "#07abde" },
    { value: "entregue", label: "Entregue", color: "#3eb370" },
    { value: "lida", label: "Lida", color: "#8c8cd4" },
    { value: "falha", label: "Falha", color: "#f56233" },
  ] },
  { key: "at_priority",          label: "Prioridade",                 fieldType: "type",          section: "Campos Gerais",              editable: true,  required: false, visible: true, description: "Baixa, Normal, Alta", options: [
    { value: "baixa", label: "Baixa", color: "#98989d" },
    { value: "normal", label: "Normal", color: "#07abde" },
    { value: "alta", label: "Alta", color: "#ff8c76" },
  ] },
  { key: "at_owner",             label: "Proprietário",               fieldType: "user",          section: "Campos Gerais",              editable: true,  required: false, visible: true },
  { key: "at_assigned_to",       label: "Atribuído a",                fieldType: "user",          section: "Campos Gerais",              editable: true,  required: false, visible: true },
  { key: "at_body",              label: "Corpo / Conteúdo",           fieldType: "textarea",      section: "Campos Gerais",              editable: true,  required: false, visible: true, description: "Corpo de notas, mensagens e emails" },
  { key: "at_tags",              label: "Tags",                       fieldType: "multipicklist", section: "Campos Gerais",              editable: true,  required: false, visible: true, description: "Importante, Follow-up, Urgente, Interno", options: [
    { value: "importante", label: "Importante", color: "#ff8c76" },
    { value: "follow-up", label: "Follow-up", color: "#07abde" },
    { value: "urgente", label: "Urgente", color: "#f56233" },
    { value: "interno", label: "Interno", color: "#8c8cd4" },
  ] },

  // ── Datas e Horários ──
  { key: "at_start_date",        label: "Data/Hora de Início",        fieldType: "datetime",      section: "Datas e Horários",           editable: true,  required: false, visible: true },
  { key: "at_end_date",          label: "Data/Hora de Término",       fieldType: "datetime",      section: "Datas e Horários",           editable: true,  required: false, visible: true },
  { key: "at_due_date",          label: "Data de Vencimento",         fieldType: "datetime",      section: "Datas e Horários",           editable: true,  required: false, visible: true },
  { key: "at_completed_at",      label: "Concluído Em",               fieldType: "datetime",      section: "Datas e Horários",           editable: false, required: false, visible: true },
  { key: "at_all_day",           label: "Dia Inteiro",                fieldType: "boolean",       section: "Datas e Horários",           editable: true,  required: false, visible: true },
  { key: "at_is_private",        label: "Privado",                    fieldType: "boolean",       section: "Datas e Horários",           editable: true,  required: false, visible: true },

  // ── Vínculo com Entidades ──
  { key: "at_related_to_type",   label: "Tipo de Entidade Vinculada", fieldType: "type",          section: "Vínculo com Entidades",      editable: true,  required: false, visible: true, description: "Lead, Oportunidade, Conta, Contato", options: [
    { value: "lead", label: "Lead", color: "#07abde" },
    { value: "oportunidade", label: "Oportunidade", color: "#3ccea7" },
    { value: "conta", label: "Conta", color: "#eac23d" },
    { value: "contato", label: "Contato", color: "#8c8cd4" },
  ] },
  { key: "at_related_to_id",     label: "ID da Entidade Vinculada",   fieldType: "text",          section: "Vínculo com Entidades",      editable: true,  required: false, visible: true },
  { key: "at_related_to_name",   label: "Nome da Entidade Vinculada", fieldType: "text",          section: "Vínculo com Entidades",      editable: true,  required: false, visible: false },
  { key: "at_contact_id",        label: "ID do Contato",              fieldType: "text",          section: "Vínculo com Entidades",      editable: true,  required: false, visible: true },
  { key: "at_contact_name",      label: "Nome do Contato",            fieldType: "text",          section: "Vínculo com Entidades",      editable: true,  required: false, visible: true },
  { key: "at_location",          label: "Localização",                fieldType: "text",          section: "Vínculo com Entidades",      editable: true,  required: false, visible: true },

  // ── Compromisso (Google Calendar / Meet) ──
  { key: "at_meet_link",         label: "Link do Google Meet",        fieldType: "link",          section: "Compromisso",                editable: true,  required: false, visible: true },
  { key: "at_google_event_id",   label: "ID Evento Google Calendar",  fieldType: "text",          section: "Compromisso",                editable: false, required: false, visible: true },
  { key: "at_timezone",          label: "Fuso Horário",               fieldType: "text",          section: "Compromisso",                editable: true,  required: false, visible: true, description: "Ex: America/Sao_Paulo" },
  { key: "at_recurrence",        label: "Recorrência",                fieldType: "combobox",      section: "Compromisso",                editable: true,  required: false, visible: true, description: "Diário, Semanal, Mensal", options: [
    { value: "Diário", label: "Diário", color: "#07abde" },
    { value: "Semanal", label: "Semanal", color: "#3ccea7" },
    { value: "Quinzenal", label: "Quinzenal", color: "#8c8cd4" },
    { value: "Mensal", label: "Mensal", color: "#eac23d" },
  ] },
  { key: "at_is_recurring",      label: "É Recorrente",               fieldType: "boolean",       section: "Compromisso",                editable: true,  required: false, visible: true },
  { key: "at_recurrence_interval", label: "Intervalo de Recorrência", fieldType: "number",        section: "Compromisso",                editable: true,  required: false, visible: false },
  { key: "at_attendees",         label: "Participantes",              fieldType: "multipicklist", section: "Compromisso",                editable: true,  required: false, visible: true, description: "JSONB [{name, email, organizer?, rsvp?}]" },
  { key: "at_reminder",          label: "Lembrete",                   fieldType: "combobox",      section: "Compromisso",                editable: true,  required: false, visible: true, description: "Tempo antes do evento", options: [
    { value: "5 minutos antes", label: "5 minutos antes", color: "#07abde" },
    { value: "15 minutos antes", label: "15 minutos antes", color: "#3ccea7" },
    { value: "30 minutos antes", label: "30 minutos antes", color: "#eac23d" },
    { value: "1 hora antes", label: "1 hora antes", color: "#8c8cd4" },
    { value: "1 dia antes", label: "1 dia antes", color: "#ff8c76" },
  ] },
  { key: "at_busy_status",       label: "Disponibilidade",            fieldType: "type",          section: "Compromisso",                editable: true,  required: false, visible: true, description: "Ocupado, Livre, Provisório", options: [
    { value: "ocupado", label: "Ocupado", color: "#ff8c76" },
    { value: "livre", label: "Livre", color: "#3ccea7" },
    { value: "provisório", label: "Provisório", color: "#eac23d" },
  ] },
  { key: "at_visibility",        label: "Visibilidade do Evento",     fieldType: "type",          section: "Compromisso",                editable: true,  required: false, visible: true, description: "Padrão, Privado, Público", options: [
    { value: "padrao", label: "Padrão", color: "#07abde" },
    { value: "privado", label: "Privado", color: "#8c8cd4" },
    { value: "publico", label: "Público", color: "#3ccea7" },
  ] },
  { key: "at_calendar_name",     label: "Nome do Calendário",         fieldType: "text",          section: "Compromisso",                editable: true,  required: false, visible: true, description: "Ex: Zenite CRM" },

  // ── Ligação ──
  { key: "at_phone",             label: "Telefone",                   fieldType: "phone",         section: "Ligação",                    editable: true,  required: false, visible: true },
  { key: "at_call_type",         label: "Tipo de Ligação",            fieldType: "type",          section: "Ligação",                    editable: true,  required: false, visible: true, description: "Entrada, Saída, Interna", options: [
    { value: "entrada", label: "Entrada", color: "#3ccea7" },
    { value: "saida", label: "Saída", color: "#07abde" },
    { value: "interna", label: "Interna", color: "#8c8cd4" },
  ] },
  { key: "at_call_direction",    label: "Direção",                    fieldType: "type",          section: "Ligação",                    editable: true,  required: false, visible: true, description: "Entrada, Saída", options: [
    { value: "entrada", label: "Entrada", color: "#3ccea7" },
    { value: "saida", label: "Saída", color: "#07abde" },
  ] },
  { key: "at_call_duration",     label: "Duração (segundos)",         fieldType: "number",        section: "Ligação",                    editable: true,  required: false, visible: true },
  { key: "at_call_result",       label: "Resultado da Ligação",       fieldType: "text",          section: "Ligação",                    editable: true,  required: false, visible: true },

  // ── Mensagem ──
  { key: "at_channel",           label: "Canal",                      fieldType: "type",          section: "Mensagem",                   editable: true,  required: false, visible: true, description: "WhatsApp, SMS, Chat Interno, Telegram", options: [
    { value: "whatsapp", label: "WhatsApp", color: "#3eb370" },
    { value: "sms", label: "SMS", color: "#07abde" },
    { value: "chat_interno", label: "Chat Interno", color: "#8c8cd4" },
    { value: "telegram", label: "Telegram", color: "#07abde" },
  ] },
  { key: "at_recipient",         label: "Destinatário",               fieldType: "text",          section: "Mensagem",                   editable: true,  required: false, visible: true },
  { key: "at_recipient_phone",   label: "Telefone do Destinatário",   fieldType: "phone",         section: "Mensagem",                   editable: true,  required: false, visible: true },
  { key: "at_sent_at",           label: "Enviado Em",                 fieldType: "datetime",      section: "Mensagem",                   editable: false, required: false, visible: true },
  { key: "at_read_at",           label: "Lido Em",                    fieldType: "datetime",      section: "Mensagem",                   editable: false, required: false, visible: true },

  // ── Nota ──
  { key: "at_note_visibility",   label: "Visibilidade da Nota",       fieldType: "type",          section: "Nota",                       editable: true,  required: false, visible: true, description: "Pública, Privada", options: [
    { value: "publica", label: "Pública", color: "#3ccea7" },
    { value: "privada", label: "Privada", color: "#8c8cd4" },
  ] },
  { key: "at_shared_with",       label: "Compartilhado Com",          fieldType: "multipicklist", section: "Nota",                       editable: true,  required: false, visible: true, description: "JSONB — array de user IDs" },
  { key: "at_version",           label: "Versão",                     fieldType: "number",        section: "Nota",                       editable: false, required: false, visible: true },

  // ── Informações da Atividade ──
  { key: "at_updated_at",        label: "Última Atualização",         fieldType: "datetime",      section: "Informações da Atividade",   editable: false, required: false, visible: true },
  { key: "at_created_at",        label: "Criado Em",                  fieldType: "datetime",      section: "Informações da Atividade",   editable: false, required: false, visible: true },
  { key: "at_updated_by",        label: "Última Atualização Por",     fieldType: "user",          section: "Informações da Atividade",   editable: false, required: false, visible: true },
  { key: "at_created_by",        label: "Criado Por",                 fieldType: "user",          section: "Informações da Atividade",   editable: false, required: false, visible: true },

  // ── Informações do Sistema ──
  { key: "at_id",                label: "ID do Registro",             fieldType: "id",            section: "Informações do Sistema",      editable: false, required: false, visible: true },
  { key: "at_entity_type",       label: "Entity Type (Legacy)",       fieldType: "text",          section: "Informações do Sistema",      editable: false, required: false, visible: false },
  { key: "at_entity_id",         label: "Entity ID (Legacy)",         fieldType: "text",          section: "Informações do Sistema",      editable: false, required: false, visible: false },
  { key: "at_label",             label: "Label (Legacy)",             fieldType: "text",          section: "Informações do Sistema",      editable: false, required: false, visible: false },
  { key: "at_date",              label: "Date (Legacy)",              fieldType: "text",          section: "Informações do Sistema",      editable: false, required: false, visible: false },
  { key: "at_group",             label: "Group (Legacy)",             fieldType: "text",          section: "Informações do Sistema",      editable: false, required: false, visible: false },
];

/* ================================================================== */
/*  HorizontalDivider                                                  */
/* ================================================================== */

function HorizontalDivider() {
  return (
    <svg className="w-full h-[1.5px] shrink-0" fill="none" preserveAspectRatio="none" viewBox="0 0 100 1.5">
      <line x1="0" y1="0.75" x2="100" y2="0.75" stroke="#C8CFDB" strokeOpacity="0.6" strokeWidth="1" />
    </svg>
  );
}

/* ================================================================== */
/*  Backend column name helper                                         */
/* ================================================================== */

/** Table name for each object type */
const OBJECT_TABLE: Record<ObjectType, string> = {
  lead: "crm_leads",
  oportunidade: "crm_opportunities",
  contato: "crm_contacts",
  conta: "crm_accounts",
  atividade: "crm_activities",
};

/** Key prefix per object type */
const OBJECT_PREFIX: Record<ObjectType, string> = {
  lead: "lead_",
  oportunidade: "op_",
  contato: "ct_",
  conta: "ac_",
  atividade: "at_",
};

/** Overrides where the column name doesn't match "key minus prefix" */
const COLUMN_OVERRIDES: Record<string, string> = {
  // Leads
  lead_mkt_grupo: "mkt_grupo_anuncios",
  lead_mkt_conversao: "mkt_ultima_conversao",
  lead_last_viewed: "last_viewed_date",
  lead_last_ref: "last_referenced_date",
  lead_qual_progress: "qualification_progress",
  lead_score_normalized: "score",
  // Opportunities
  op_type_op: "tipo",
  op_needs_situation: "needs_current_situation",
  op_mkt_grupo: "mkt_grupo_anuncios",
  op_mkt_conversao: "mkt_ultima_conversao",
  // Contacts
  ct_last_viewed: "last_viewed_date",
  ct_last_ref: "last_referenced_date",
  // Accounts
  ac_type_conta: "type",
  ac_mkt_grupo: "mkt_grupo_anuncios",
  ac_mkt_conversao: "mkt_ultima_conversao",
  ac_last_viewed: "last_viewed_date",
  ac_last_ref: "last_referenced_date",
  // Activities
  at_id: "id",
  at_type: "type",
  at_group: "group",
};

/** Derive Supabase column name from settings key. Calculated fields return null. */
function getBackendColumn(key: string, fieldType: FieldType, objectType: ObjectType): string | null {
  // Calculated/formula fields have no direct DB column
  if (fieldType === "calculated") return null;
  // Check overrides
  if (COLUMN_OVERRIDES[key]) return COLUMN_OVERRIDES[key];
  // Strip prefix
  const prefix = OBJECT_PREFIX[objectType];
  if (key.startsWith(prefix)) return key.slice(prefix.length);
  return key;
}

/* ================================================================== */
/*  Inline FieldTypeBadge                                              */
/* ================================================================== */

function FieldTypeBadge({ fieldType }: { fieldType: FieldType }) {
  const meta = FIELD_TYPE_META[fieldType];
  const Icon = meta.icon;
  return (
    <div
      className="flex items-center gap-[5px] h-[24px] px-[8px] rounded-[6px] shrink-0"
      style={{ backgroundColor: meta.bg }}
    >
      <Icon size={12} weight="bold" style={{ color: meta.color }} />
      <span
        className="uppercase whitespace-nowrap"
        style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, color: meta.color, ...fontFeature }}
      >
        {meta.label}
      </span>
    </div>
  );
}

/* ================================================================== */
/*  Section component (collapsible group)                              */
/* ================================================================== */

function FieldSection({
  title,
  fields,
  search,
  objectType,
  onToggleVisible,
  onToggleRequired,
  onFieldClick,
}: {
  title: string;
  fields: (NativeField & { _visible: boolean; _required: boolean; _labelOverride?: string; _fieldTypeOverride?: string })[];
  search: string;
  objectType: ObjectType;
  onToggleVisible: (key: string) => void;
  onToggleRequired: (key: string) => void;
  onFieldClick?: (fieldKey: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  // filter by search
  const filtered = useMemo(() => {
    if (!search) return fields;
    const q = search.toLowerCase();
    return fields.filter(
      (f) =>
        (f._labelOverride || f.label).toLowerCase().includes(q) ||
        f.label.toLowerCase().includes(q) ||
        FIELD_TYPE_META[f.fieldType].label.toLowerCase().includes(q) ||
        (f.description && f.description.toLowerCase().includes(q)) ||
        (getBackendColumn(f.key, f.fieldType, objectType) ?? "").toLowerCase().includes(q)
    );
  }, [fields, search, objectType]);

  if (filtered.length === 0) return null;

  return (
    <div>
      {/* Section header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-[8px] w-full py-[10px] px-[4px] cursor-pointer group hover:bg-[#f6f7f9] rounded-[8px] transition-colors"
      >
        <motion.div
          animate={{ rotate: expanded ? 0 : -90 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
        >
          <CaretDown size={14} weight="bold" className="text-[#98989d]" />
        </motion.div>
        <span
          className="text-[#28415c]"
          style={{ fontSize: 13, fontWeight: 700, letterSpacing: -0.3, ...fontFeature }}
        >
          {title}
        </span>
        <span
          className="text-[#98989d] bg-[#f0f2f5] px-[5px] py-[1px] rounded-[4px]"
          style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}
        >
          GRUPO
        </span>
        <span
          className="text-[#98989d]"
          style={{ fontSize: 12, fontWeight: 600, letterSpacing: -0.2, ...fontFeature }}
        >
          {filtered.length} {filtered.length === 1 ? "campo" : "campos"}
        </span>
      </button>

      {/* Fields */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="flex flex-col">
              {filtered.map((field, i) => (
                <div key={field.key}>
                  {i > 0 && <HorizontalDivider />}
                  <div className="flex items-center gap-[12px] py-[10px] px-[8px] group/row hover:bg-[#fafbfc] rounded-[6px] transition-colors">
                    {/* Drag handle (visual only for now) */}
                    <DotsSixVertical
                      size={16}
                      weight="bold"
                      className="text-[#c8cfdb] shrink-0 opacity-0 group-hover/row:opacity-100 transition-opacity cursor-grab"
                    />

                    {/* Field label */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-[8px]">
                        <span
                          className={`text-[#28415c] truncate ${onFieldClick ? "hover:text-[#07abde] cursor-pointer hover:underline" : ""}`}
                          style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.3, ...fontFeature }}
                          onClick={onFieldClick ? (e) => { e.stopPropagation(); onFieldClick(field.key); } : undefined}
                        >
                          {field._labelOverride || field.label}
                        </span>
                        {!field.editable && (
                          <span
                            className="text-[#98989d] bg-[#f0f2f5] px-[6px] py-[1px] rounded-[4px] shrink-0"
                            style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}
                          >
                            SISTEMA
                          </span>
                        )}
                      </div>
                      {/* Show option pills for type/multipicklist/combobox with options, or plain description text */}
                      {field.options && field.options.length > 0 ? (
                        <div className="flex items-center gap-[4px] mt-[2px] flex-wrap">
                          {field.options.slice(0, 5).map((opt) => (
                            <span
                              key={opt.value}
                              className="inline-flex items-center gap-[3px] h-[18px] px-[6px] rounded-[4px]"
                              style={{ backgroundColor: opt.color + "18", fontSize: 10, fontWeight: 600, letterSpacing: -0.2, color: opt.color, ...fontFeature }}
                            >
                              <span className="size-[5px] rounded-full shrink-0" style={{ backgroundColor: opt.color }} />
                              {opt.label}
                            </span>
                          ))}
                          {field.options.length > 5 && (
                            <span
                              className="text-[#98989d]"
                              style={{ fontSize: 10, fontWeight: 600, letterSpacing: -0.2, ...fontFeature }}
                            >
                              +{field.options.length - 5}
                            </span>
                          )}
                        </div>
                      ) : field.description ? (
                        <span
                          className="text-[#98989d] block truncate"
                          style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.2, ...fontFeature }}
                        >
                          {field.description}
                        </span>
                      ) : null}
                    </div>

                    {/* Type badge + option count */}
                    <div className="w-[120px] shrink-0 flex items-center justify-center gap-[6px]">
                      <FieldTypeBadge fieldType={field.fieldType as FieldType} />
                      {field.options && field.options.length > 0 && (
                        <span
                          className="text-[#98989d] bg-[#f0f2f5] px-[4px] py-[1px] rounded-[4px] shrink-0"
                          style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.3, ...fontFeature }}
                          title={`${field.options.length} opções definidas`}
                        >
                          {field.options.length}
                        </span>
                      )}
                    </div>

                    {/* Backend column */}
                    {(() => {
                      const col = getBackendColumn(field.key, field.fieldType, objectType);
                      return (
                        <span
                          className="text-[#8c8cd4] w-[140px] shrink-0 truncate hidden xl:block"
                          style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0, fontFamily: "'DM Mono', monospace", ...fontFeature }}
                          title={col ? `${OBJECT_TABLE[objectType]}.${col}` : "Campo calculado (sem coluna)"}
                        >
                          {col ?? "—"}
                        </span>
                      );
                    })()}

                    {/* Created by */}
                    <span
                      className="text-[#4e6987] w-[100px] text-center shrink-0 truncate hidden xl:block"
                      style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.2, ...fontFeature }}
                    >
                      {field.editable ? "Admin" : "Sistema"}
                    </span>

                    {/* Created at */}
                    <span
                      className="text-[#98989d] w-[100px] text-center shrink-0 hidden xl:block"
                      style={{ fontSize: 11, fontWeight: 500, letterSpacing: -0.2, ...fontFeature }}
                    >
                      15 jan 2025
                    </span>

                    {/* Last modified */}
                    <span
                      className="text-[#98989d] w-[100px] text-center shrink-0 hidden xl:block"
                      style={{ fontSize: 11, fontWeight: 500, letterSpacing: -0.2, ...fontFeature }}
                    >
                      {field.editable ? "12 fev 2026" : "—"}
                    </span>

                    {/* Visible toggle */}
                    <div className="flex items-center justify-center shrink-0 hidden lg:flex" style={{ width: 50 }}>
                      <ZeniteToggle active={field._visible} onChange={() => onToggleVisible(field.key)} />
                    </div>

                    {/* Required toggle */}
                    <div className="flex items-center justify-center shrink-0 hidden lg:flex" style={{ width: 50 }}>
                      <ZeniteToggle
                        active={field._required}
                        onChange={() => onToggleRequired(field.key)}
                        disabled={!field.editable}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ================================================================== */
/*  Main component                                                     */
/* ================================================================== */

export function CrmSettingsNativeFields() {
  const navigate = useNavigate();
  const [activeObject, setActiveObject] = useState<ObjectType>("lead");
  const [search, setSearch] = useState("");

  // Pill animation refs
  const pillContainerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<ObjectType, HTMLButtonElement | null>>({ lead: null, oportunidade: null, contato: null, conta: null, atividade: null });
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 });

  // Custom fields from backend
  const [customFieldDefs, setCustomFieldDefs] = useState<CustomFieldDef[]>([]);
  const [customFieldsLoading, setCustomFieldsLoading] = useState(false);

  // Load custom fields
  useEffect(() => {
    setCustomFieldsLoading(true);
    listCustomFields()
      .then((defs) => setCustomFieldDefs(defs ?? []))
      .catch((err) => console.error("Error loading custom fields:", err))
      .finally(() => setCustomFieldsLoading(false));
  }, []);

  // Custom fields filtered to active object
  const customFieldsForObject = useMemo(
    () => customFieldDefs.filter((d) => d.objectType === activeObject),
    [customFieldDefs, activeObject],
  );

  // Delete custom field handler
  const handleDeleteCustomField = async (key: string, label: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o campo "${label}"? Esta acao nao pode ser desfeita.`)) return;
    try {
      await deleteCustomField(key);
      setCustomFieldDefs((prev) => prev.filter((d) => d.key !== key));
      toast.success(`Campo "${label}" excluído com sucesso.`);
    } catch (err) {
      console.error("Error deleting custom field:", err);
      toast.error("Erro ao excluir campo customizado.");
    }
  };

  // State maps for visibility and required
  const [visibilityMap, setVisibilityMap] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    [...LEAD_FIELDS, ...OPPORTUNITY_FIELDS, ...CONTACT_FIELDS, ...ACCOUNT_FIELDS, ...ACTIVITY_FIELDS].forEach((f) => { map[f.key] = f.visible; });
    return map;
  });
  const [requiredMap, setRequiredMap] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    [...LEAD_FIELDS, ...OPPORTUNITY_FIELDS, ...CONTACT_FIELDS, ...ACCOUNT_FIELDS, ...ACTIVITY_FIELDS].forEach((f) => { map[f.key] = f.required; });
    return map;
  });
  const [labelMap, setLabelMap] = useState<Record<string, string>>({});
  const [fieldTypeMap, setFieldTypeMap] = useState<Record<string, string>>({});

  // Load field config from backend on object change
  useEffect(() => {
    (async () => {
      try {
        const config = await getFieldConfig(activeObject);
        if (config && Object.keys(config).length > 0) {
          setVisibilityMap((prev) => {
            const next = { ...prev };
            for (const [key, overrides] of Object.entries(config)) {
              if (overrides.visible !== undefined) next[key] = overrides.visible;
            }
            return next;
          });
          setRequiredMap((prev) => {
            const next = { ...prev };
            for (const [key, overrides] of Object.entries(config)) {
              if (overrides.required !== undefined) next[key] = overrides.required;
            }
            return next;
          });
          setLabelMap((prev) => {
            const next = { ...prev };
            for (const [key, overrides] of Object.entries(config)) {
              if (overrides.label) next[key] = overrides.label;
              else delete next[key];
            }
            return next;
          });
          // fieldType for native fields is defined in code, not loaded from KV overrides
        }
      } catch (err) {
        console.error("Error loading field config:", err);
      }
    })();
  }, [activeObject]);

  // Persist visibility/required toggle to backend
  const persistFieldToggle = (fieldKey: string, field: "visible" | "required", value: boolean) => {
    patchFieldConfig(activeObject, { [fieldKey]: { [field]: value } }).catch((err) =>
      console.error(`Error persisting field config for ${fieldKey}:`, err)
    );
  };

  // Measure pill position
  useEffect(() => {
    const el = tabRefs.current[activeObject];
    const container = pillContainerRef.current;
    if (el && container) {
      const cRect = container.getBoundingClientRect();
      const eRect = el.getBoundingClientRect();
      setPillStyle({ left: eRect.left - cRect.left, width: eRect.width });
    }
  }, [activeObject]);

  const FIELDS_MAP: Record<ObjectType, NativeField[]> = {
    lead: LEAD_FIELDS,
    oportunidade: OPPORTUNITY_FIELDS,
    contato: CONTACT_FIELDS,
    conta: ACCOUNT_FIELDS,
    atividade: ACTIVITY_FIELDS,
  };

  const fields = FIELDS_MAP[activeObject];

  const hasFields = fields.length > 0;

  // Build sections
  const sections = useMemo(() => {
    const map = new Map<string, (NativeField & { _visible: boolean; _required: boolean; _labelOverride?: string; _fieldTypeOverride?: string })[]>();
    fields.forEach((f) => {
      if (!map.has(f.section)) map.set(f.section, []);
      map.get(f.section)!.push({
        ...f,
        _visible: visibilityMap[f.key] ?? f.visible,
        _required: requiredMap[f.key] ?? f.required,
        _labelOverride: labelMap[f.key],
        _fieldTypeOverride: fieldTypeMap[f.key],
      });
    });
    return Array.from(map.entries());
  }, [fields, visibilityMap, requiredMap, labelMap, fieldTypeMap]);

  // Stats (native + custom)
  const visibleCount =
    fields.filter((f) => visibilityMap[f.key] ?? f.visible).length +
    customFieldsForObject.filter((cf) => visibilityMap[cf.key] ?? cf.visible).length;
  const requiredCount =
    fields.filter((f) => requiredMap[f.key] ?? f.required).length +
    customFieldsForObject.filter((cf) => requiredMap[cf.key] ?? cf.required).length;

  const objectTabs: { key: ObjectType; label: string }[] = [
    { key: "lead", label: "Lead" },
    { key: "oportunidade", label: "Oportunidade" },
    { key: "contato", label: "Contato" },
    { key: "conta", label: "Conta" },
    { key: "atividade", label: "Atividade" },
  ];

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      {/* ═══════ SINGLE UNIFIED CARD ═══════ */}
      <div className="flex-1 bg-white rounded-[16px] overflow-hidden min-w-0 flex flex-col">
        {/* ─── Page Header ─── */}
        <div className="px-[24px] pt-[20px] pb-[16px] shrink-0">
          <div className="flex items-center gap-[12px]">
            <div
              className="flex items-center justify-center size-[36px] rounded-[8px] shrink-0"
              style={{ backgroundColor: "#DDE3EC" }}
            >
              <Textbox size={20} weight="duotone" style={{ color: "#4E6987" }} />
            </div>
            <div className="flex-1">
              <span
                className="text-[#28415c] block"
                style={{ fontSize: 19, fontWeight: 700, letterSpacing: -0.5, lineHeight: "24px", ...fontFeature }}
              >
                Todos Campos
              </span>
              <span
                className="text-[#98989d] block"
                style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}
              >
                Gerencie visibilidade e obrigatoriedade dos campos por grupo.
              </span>
            </div>
            <PillButton
              icon={<Plus size={16} weight="bold" />}
              onClick={() => navigate("/crm/ajustes/campos/novo")}
            >
              Adicionar Campo
            </PillButton>
          </div>
        </div>

        <HorizontalDivider />

        {/* ─── Toolbar ─── */}
        <div className="flex items-center gap-[12px] px-[24px] py-[16px] shrink-0 flex-wrap">
          {/* Object pill switcher */}
          <div
            ref={pillContainerRef}
            className="relative flex items-center h-[36px] bg-[#f0f2f5] rounded-[500px] p-[3px] overflow-hidden"
          >
            <motion.div
              className="absolute h-[30px] rounded-[500px]"
              style={{ backgroundColor: "#28415c", boxShadow: "0px 2px 4px 0px rgba(18,34,50,0.3)" }}
              animate={{ left: pillStyle.left, width: pillStyle.width }}
              transition={{ type: "spring", stiffness: 500, damping: 35, mass: 0.8 }}
            />
            {objectTabs.map((tab) => (
              <button
                key={tab.key}
                ref={(el) => { tabRefs.current[tab.key] = el; }}
                onClick={() => { setActiveObject(tab.key); setSearch(""); }}
                className={`relative z-[1] flex items-center gap-[6px] h-[30px] px-[14px] rounded-[500px] cursor-pointer transition-colors ${
                  activeObject === tab.key ? "" : "hover:bg-[#e4e7ec]"
                }`}
              >
                <span
                  className={activeObject === tab.key ? "text-white" : "text-[#98989d]"}
                  style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.3, textTransform: "uppercase", ...fontFeature }}
                >
                  {tab.label}
                </span>
              </button>
            ))}
            {/* Inner shadow overlay */}
            <div
              className="absolute inset-0 pointer-events-none rounded-[inherit]"
              style={{ boxShadow: "inset 0px -0.5px 1px 0px rgba(255,255,255,0.3), inset 0px -0.5px 1px 0px rgba(255,255,255,0.25), inset 1px 1.5px 4px 0px rgba(0,0,0,0.08), inset 1px 1.5px 4px 0px rgba(0,0,0,0.1)" }}
            />
          </div>

          {/* Search */}
          <div className="relative flex items-center gap-[8px] h-[36px] bg-[#f6f7f9] rounded-[500px] px-[14px] flex-1 min-w-[200px] max-w-[340px] overflow-hidden" style={{ border: "1px solid rgba(200,207,219,0.6)" }}>
            <MagnifyingGlass size={16} weight="bold" className="text-[#98989d] shrink-0 relative z-[1]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar campo..."
              className="relative z-[1] flex-1 bg-transparent outline-none text-[#28415c] placeholder:text-[#c8cfdb]"
              style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}
            />
            {/* Inner shadow overlay */}
            <div
              className="absolute inset-0 pointer-events-none rounded-[inherit]"
              style={{ boxShadow: "inset 0px -0.5px 1px 0px rgba(255,255,255,0.3), inset 0px -0.5px 1px 0px rgba(255,255,255,0.25), inset 0px 1.5px 4px 0px rgba(0,0,0,0.08), inset 0px 1.5px 4px 0px rgba(0,0,0,0.1)" }}
            />
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Stats */}
          <div className="flex items-center gap-[16px] shrink-0">
            <div className="flex items-center gap-[5px]">
              <Eye size={14} weight="bold" className="text-[#3ccea7]" />
              <span
                className="text-[#4e6987]"
                style={{ fontSize: 12, fontWeight: 600, letterSpacing: -0.2, ...fontFeature }}
              >
                {visibleCount} visíveis
              </span>
            </div>
            <div className="flex items-center gap-[5px]">
              <Asterisk size={14} weight="bold" className="text-[#ff8c76]" />
              <span
                className="text-[#4e6987]"
                style={{ fontSize: 12, fontWeight: 600, letterSpacing: -0.2, ...fontFeature }}
              >
                {requiredCount} obrigatórios
              </span>
            </div>
          </div>
        </div>

        <HorizontalDivider />

        {/* ─── Column headers ─── */}
        <div className="flex items-center gap-[12px] py-[8px] px-[8px] mx-[24px] shrink-0">
          <div className="w-[16px]" /> {/* drag handle space */}
          <span
            className="flex-1 text-[#98989d] uppercase"
            style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}
          >
            Campo
          </span>
          <span
            className="text-[#98989d] uppercase w-[100px] text-center shrink-0"
            style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}
          >
            Tipo
          </span>
          <span
            className="text-[#98989d] uppercase w-[140px] shrink-0 hidden xl:block"
            style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}
          >
            Backend
          </span>
          <span
            className="text-[#98989d] uppercase w-[100px] text-center shrink-0 hidden xl:block"
            style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}
          >
            Criado por
          </span>
          <span
            className="text-[#98989d] uppercase w-[100px] text-center shrink-0 hidden xl:block"
            style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}
          >
            Criação
          </span>
          <span
            className="text-[#98989d] uppercase w-[100px] text-center shrink-0 hidden xl:block"
            style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}
          >
            Alteração
          </span>
          <span
            className="text-[#98989d] uppercase shrink-0 text-center hidden lg:block"
            style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, ...fontFeature, width: 50 }}
          >
            Visível
          </span>
          <span
            className="text-[#98989d] uppercase shrink-0 text-center hidden lg:block"
            style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, ...fontFeature, width: 50 }}
          >
            Obrigatório
          </span>
        </div>

        <HorizontalDivider />

        {/* ─── Sections ─── */}
        <div className="flex-1 overflow-auto px-[24px] py-[8px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeObject}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-[4px]"
            >
              {/* Empty object state (no fields defined yet) */}
              {!hasFields && (
                <div className="flex flex-col items-center justify-center py-[64px] gap-[12px]">
                  <Textbox size={36} weight="duotone" className="text-[#c8cfdb]" />
                  <span
                    className="text-[#4e6987]"
                    style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.3, ...fontFeature }}
                  >
                    Nenhum campo configurado
                  </span>
                  <span
                    className="text-[#98989d] text-center max-w-[320px]"
                    style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}
                  >
                    Os campos deste objeto ainda não foram definidos. Em breve estará disponível.
                  </span>
                  <span
                    className="text-[#98989d] bg-[#f0f2f5] px-[8px] py-[2px] rounded-[6px] mt-[4px]"
                    style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}
                  >
                    EM BREVE
                  </span>
                </div>
              )}

              {hasFields && sections.map(([sectionTitle, sectionFields]) => (
                <FieldSection
                  key={sectionTitle}
                  title={sectionTitle}
                  fields={sectionFields}
                  search={search}
                  objectType={activeObject}
                  onToggleVisible={(key) => {
                    const newVal = !(visibilityMap[key] ?? true);
                    setVisibilityMap((m) => ({ ...m, [key]: newVal }));
                    persistFieldToggle(key, "visible", newVal);
                  }}
                  onToggleRequired={(key) => {
                    const newVal = !(requiredMap[key] ?? false);
                    setRequiredMap((m) => ({ ...m, [key]: newVal }));
                    persistFieldToggle(key, "required", newVal);
                  }}
                  onFieldClick={(fieldKey) => navigate(`/crm/ajustes/campos/editar/${fieldKey}?object=${activeObject}`)}
                />
              ))}

              {/* ── Custom Fields Section ── */}
              {customFieldsForObject.length > 0 && (() => {
                const q = search.toLowerCase();
                const filtered = search
                  ? customFieldsForObject.filter((cf) =>
                      cf.label.toLowerCase().includes(q) ||
                      cf.fieldType.toLowerCase().includes(q) ||
                      (cf.description && cf.description.toLowerCase().includes(q)) ||
                      cf.key.toLowerCase().includes(q)
                    )
                  : customFieldsForObject;
                if (filtered.length === 0) return null;
                return (
                  <div>
                    {/* Section header */}
                    <div className="flex items-center gap-[8px] w-full py-[10px] px-[4px]">
                      <span
                        className="text-[#28415c]"
                        style={{ fontSize: 13, fontWeight: 700, letterSpacing: -0.3, ...fontFeature }}
                      >
                        Campos Customizados
                      </span>
                      <span
                        className="text-[#8C8CD4] bg-[#e8e8fd] px-[5px] py-[1px] rounded-[4px] shrink-0"
                        style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}
                      >
                        CUSTOM
                      </span>
                      <span
                        className="text-[#98989d]"
                        style={{ fontSize: 12, fontWeight: 600, letterSpacing: -0.2, ...fontFeature }}
                      >
                        {filtered.length} {filtered.length === 1 ? "campo" : "campos"}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      {filtered.map((cf, i) => {
                        const meta = FIELD_TYPE_META[cf.fieldType as FieldType] ?? FIELD_TYPE_META.text;
                        const Icon = meta.icon;
                        return (
                          <div key={cf.key}>
                            {i > 0 && <HorizontalDivider />}
                            <div className="flex items-center gap-[12px] py-[10px] px-[8px] group/row hover:bg-[#fafbfc] rounded-[6px] transition-colors">
                              {/* Drag handle placeholder */}
                              <DotsSixVertical
                                size={16}
                                weight="bold"
                                className="text-[#c8cfdb] shrink-0 opacity-0 group-hover/row:opacity-100 transition-opacity cursor-grab"
                              />

                              {/* Field label */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-[8px]">
                                  <span
                                    className="text-[#28415c] truncate hover:text-[#07abde] cursor-pointer hover:underline"
                                    style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.3, ...fontFeature }}
                                    onClick={() => navigate(`/crm/ajustes/campos/editar/${cf.key}?object=${activeObject}`)}
                                  >
                                    {cf.label}
                                  </span>
                                  <span
                                    className="text-[#8C8CD4] bg-[#e8e8fd] px-[6px] py-[1px] rounded-[4px] shrink-0"
                                    style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}
                                  >
                                    CUSTOM
                                  </span>
                                </div>
                                {cf.options && cf.options.length > 0 ? (
                                  <div className="flex items-center gap-[4px] mt-[2px] flex-wrap">
                                    {cf.options.slice(0, 5).map((opt) => (
                                      <span
                                        key={opt.value}
                                        className="inline-flex items-center gap-[3px] h-[18px] px-[6px] rounded-[4px]"
                                        style={{ backgroundColor: opt.color + "18", fontSize: 10, fontWeight: 600, letterSpacing: -0.2, color: opt.color, ...fontFeature }}
                                      >
                                        <span className="size-[5px] rounded-full shrink-0" style={{ backgroundColor: opt.color }} />
                                        {opt.label}
                                      </span>
                                    ))}
                                    {cf.options.length > 5 && (
                                      <span className="text-[#98989d]" style={{ fontSize: 10, fontWeight: 600, letterSpacing: -0.2, ...fontFeature }}>
                                        +{cf.options.length - 5}
                                      </span>
                                    )}
                                  </div>
                                ) : cf.description ? (
                                  <span className="text-[#98989d] block truncate" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.2, ...fontFeature }}>
                                    {cf.description}
                                  </span>
                                ) : null}
                              </div>

                              {/* Type badge */}
                              <div className="w-[120px] shrink-0 flex items-center justify-center gap-[6px]">
                                <div
                                  className="flex items-center gap-[5px] h-[24px] px-[8px] rounded-[6px] shrink-0"
                                  style={{ backgroundColor: meta.bg }}
                                >
                                  <Icon size={12} weight="bold" style={{ color: meta.color }} />
                                  <span
                                    className="uppercase whitespace-nowrap"
                                    style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, color: meta.color, ...fontFeature }}
                                  >
                                    {meta.label}
                                  </span>
                                </div>
                                {cf.options && cf.options.length > 0 && (
                                  <span
                                    className="text-[#98989d] bg-[#f0f2f5] px-[4px] py-[1px] rounded-[4px] shrink-0"
                                    style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.3, ...fontFeature }}
                                  >
                                    {cf.options.length}
                                  </span>
                                )}
                              </div>

                              {/* Backend column */}
                              <span
                                className="text-[#8c8cd4] w-[140px] shrink-0 truncate hidden xl:block"
                                style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0, fontFamily: "'DM Mono', monospace", ...fontFeature }}
                                title={`custom.${cf.key}`}
                              >
                                {cf.key}
                              </span>

                              {/* Created by */}
                              <span className="text-[#4e6987] w-[100px] text-center shrink-0 truncate hidden xl:block" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.2, ...fontFeature }}>
                                Admin
                              </span>

                              {/* Created at */}
                              <span className="text-[#98989d] w-[100px] text-center shrink-0 hidden xl:block" style={{ fontSize: 11, fontWeight: 500, letterSpacing: -0.2, ...fontFeature }}>
                                {cf.created_at ? new Date(cf.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                              </span>

                              {/* Last modified */}
                              <span className="text-[#98989d] w-[100px] text-center shrink-0 hidden xl:block" style={{ fontSize: 11, fontWeight: 500, letterSpacing: -0.2, ...fontFeature }}>
                                {cf.updated_at ? new Date(cf.updated_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                              </span>

                              {/* Visible toggle */}
                              <div className="items-center justify-center shrink-0 hidden lg:flex" style={{ width: 50 }}>
                                <ZeniteToggle
                                  active={visibilityMap[cf.key] ?? cf.visible}
                                  onChange={() => {
                                    const newVal = !(visibilityMap[cf.key] ?? cf.visible);
                                    setVisibilityMap((m) => ({ ...m, [cf.key]: newVal }));
                                    persistFieldToggle(cf.key, "visible", newVal);
                                  }}
                                />
                              </div>

                              {/* Required toggle */}
                              <div className="items-center justify-center shrink-0 hidden lg:flex" style={{ width: 50 }}>
                                <ZeniteToggle
                                  active={requiredMap[cf.key] ?? cf.required}
                                  onChange={() => {
                                    const newVal = !(requiredMap[cf.key] ?? cf.required);
                                    setRequiredMap((m) => ({ ...m, [cf.key]: newVal }));
                                    persistFieldToggle(cf.key, "required", newVal);
                                  }}
                                />
                              </div>

                              {/* Delete button */}
                              <button
                                onClick={() => handleDeleteCustomField(cf.key, cf.label)}
                                className="flex items-center justify-center size-[28px] rounded-full text-[#c8cfdb] hover:text-[#ff8c76] hover:bg-[#ffedeb] transition-colors cursor-pointer opacity-0 group-hover/row:opacity-100 shrink-0"
                                title="Excluir campo customizado"
                              >
                                <Trash size={15} weight="bold" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Empty search state */}
              {hasFields && sections.every(([, fs]) => {
                if (!search) return false;
                const q = search.toLowerCase();
                return fs.filter(
                  (f) =>
                    f.label.toLowerCase().includes(q) ||
                    FIELD_TYPE_META[f.fieldType].label.toLowerCase().includes(q) ||
                    (f.description && f.description.toLowerCase().includes(q))
                ).length === 0;
              }) && search && (
                <div className="flex flex-col items-center justify-center py-[48px] gap-[12px]">
                  <MagnifyingGlass size={32} weight="duotone" className="text-[#c8cfdb]" />
                  <span
                    className="text-[#98989d]"
                    style={{ fontSize: 14, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}
                  >
                    Nenhum campo encontrado para "{search}"
                  </span>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

    </div>
  );
}