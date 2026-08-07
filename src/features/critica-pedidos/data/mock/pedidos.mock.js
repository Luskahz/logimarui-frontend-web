import { clientesMock } from "./clientes.mock";
import { adaptPedidoReportRow } from "@/features/critica-pedidos/services/reportAdapters";
const motivos = [
    null,
    "Janela de entrega",
    "Peso acima da rota",
    "Cliente fora de setor",
    "Restricao operacional",
    "Pedido fracionado",
];
const operacoes = ["D01", "D02", "D03", "RET", "MIX"];
const setores = ["Norte", "Sul", "Litoral", "Vale", "Serra"];
const paletes = ["Fechado", "Misto", "Sem palete"];
const idades = ["0-1 dia", "2-3 dias", "4-5 dias", "6+ dias"];
function round(value, precision = 2) {
    return Number(value.toFixed(precision));
}
const legacyPedidoRows = Array.from({ length: 90 }, (_, index) => {
    const cliente = clientesMock[index % clientesMock.length];
    const caixas = 8 + ((index * 7) % 92);
    const peso = round(260 + caixas * (8.7 + (index % 5) * 0.9), 2);
    const volume = round(caixas * (0.11 + (index % 4) * 0.018), 2);
    const paletesFechados = index % 3 === 0 ? Math.max(1, Math.floor(caixas / 42)) : Math.floor(caixas / 58);
    return {
        "Pedido": `88${String(620000 + index).padStart(6, "0")}`,
        "Cliente": cliente.clienteId,
        "Nome": cliente.nome,
        "Cidade": cliente.cidade,
        "Motivo": motivos[(index * 2) % motivos.length],
        "Operacao": operacoes[index % operacoes.length],
        "Setor": setores[(index + 2) % setores.length],
        "Idade do Pedido": idades[(index + 1) % idades.length],
        "Peso Total": peso,
        "Volume Marcacao": volume,
        "Quantidade": 12 + ((index * 13) % 180),
        "Caixa viagem": caixas,
        "Paletes_Fechados": paletesFechados,
        "Palete": paletes[index % paletes.length],
        "Valor": round(900 + caixas * (74 + (index % 6) * 8.5), 2),
        "Drop": cliente.drop ?? "",
        "Soma": cliente.soma ?? "",
    };
});
export const pedidosMock = legacyPedidoRows.map(adaptPedidoReportRow);
