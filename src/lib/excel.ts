import * as XLSX from "xlsx";
import { equipeLabel, situacaoLabel, statusLabel } from "./situacao";

export function exportDemandasToExcel(demandas: any[], filename = "demandas.xlsx") {
  const rows = demandas.map((d) => ({
    "Número": d.numero,
    "Data de abertura": d.data_abertura ? new Date(d.data_abertura).toLocaleString("pt-BR") : "",
    "Site": d.site_nome || "",
    "Local": d.local_nome || "",
    "TAG do equipamento": d.tag_equipamento || "",
    "Descrição": d.descricao || "",
    "Situação atual": situacaoLabel(d.situacao_atual),
    "Status": statusLabel(d.status),
    "Equipe destino": equipeLabel(d.equipe_destino),
    "Prioridade": d.prioridade || "",
    "Solicitante": d.solicitante || "",
    "Aceita por": d.aceita_por || "",
    "Aceita em": d.aceita_em ? new Date(d.aceita_em).toLocaleString("pt-BR") : "",
    "Concluída em": d.concluida_em ? new Date(d.concluida_em).toLocaleString("pt-BR") : "",
    "Análise / Resolução": d.analise_resolucao || "",
    "Foto (URL)": d.foto_url || "",
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = Object.keys(rows[0] ?? {}).map((k) => ({ wch: Math.max(14, k.length + 2) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Demandas");
  XLSX.writeFile(wb, filename);
}
