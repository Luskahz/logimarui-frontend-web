import { pedidosMock } from "./pedidos.mock";
import { adaptProdutoReportRow } from "@/features/critica-pedidos/services/reportAdapters";
const productCatalog = [
    "Skol 350ml",
    "Brahma 350ml",
    "Antarctica 350ml",
    "Original 600ml",
    "Budweiser 330ml",
    "Stella 275ml",
    "Becks 350ml",
    "Corona 330ml",
    "Bohemia 350ml",
    "Guarana 2L",
    "Pepsi 2L",
    "Soda 2L",
    "Tonica 350ml",
    "Agua 500ml",
    "Energetico 269ml",
    "Brahma Duplo Malte 350ml",
    "Spaten 350ml",
    "Michelob 330ml",
    "Skol Beats 269ml",
    "Chopp Claro 30L",
    "Chopp Escuro 30L",
    "Brahma 600ml",
    "Skol 600ml",
    "Antarctica 600ml",
    "Budweiser 600ml",
    "Stella 550ml",
    "Original 300ml",
    "Serra Malte 600ml",
    "Polar 350ml",
    "Colorado 410ml",
    "Guarana Zero 2L",
    "Pepsi Black 2L",
    "Agua com Gas 500ml",
    "Tonica Zero 350ml",
    "H2OH Limao 500ml",
    "H2OH Limoneto 500ml",
    "Lipton Pessego 1,5L",
    "Lipton Limao 1,5L",
    "Fusion 473ml",
    "Red Bull 250ml",
    "Long Neck Mix",
    "Cerveja Pilsen Pack",
    "Cerveja Premium Pack",
    "Refrigerante Pack",
    "Agua Pack",
    "Chopp Pack",
    "Especial Sazonal",
    "Retornavel Mix",
    "One Way Mix",
    "Promocional Rota",
];
function round(value, precision = 2) {
    return Number(value.toFixed(precision));
}
const legacyProdutoRows = Array.from({ length: 72 }, (_, index) => {
    const pedido = pedidosMock[index % pedidosMock.length];
    const productIndex = index % productCatalog.length;
    const quantidade = 4 + ((index * 9) % 70);
    return {
        "Cod. Prod.": String(30000 + productIndex),
        "Nome Prod.": productCatalog[productIndex],
        "Quantidade": quantidade,
        "Peso Total": round(quantidade * (6.8 + (productIndex % 6) * 0.82), 2),
        "Paletes_Fechados": index % 4 === 0 ? Math.max(1, Math.floor(quantidade / 36)) : 0,
        "Pedido": pedido.pedidoId,
        "Cliente": pedido.clienteId,
    };
});
export const produtosMock = legacyProdutoRows.map(adaptProdutoReportRow);
