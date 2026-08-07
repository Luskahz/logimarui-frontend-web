import { adaptClienteReportRow } from "@/features/critica-pedidos/services/reportAdapters";
const cityCatalog = [
    { cidade: "Itajai", bairros: ["Cordeiros", "Centro", "Sao Vicente"], lat: -26.9101, lng: -48.6705 },
    { cidade: "Blumenau", bairros: ["Itoupava", "Velha", "Garcia"], lat: -26.9188, lng: -49.0661 },
    { cidade: "Joinville", bairros: ["America", "Floresta", "Boa Vista"], lat: -26.3044, lng: -48.8487 },
    { cidade: "Florianopolis", bairros: ["Capoeiras", "Centro", "Trindade"], lat: -27.5949, lng: -48.5482 },
    { cidade: "Sao Jose", bairros: ["Kobrasol", "Barreiros", "Forquilhas"], lat: -27.6136, lng: -48.6366 },
    { cidade: "Criciuma", bairros: ["PrProspera", "Centro", "Pinheirinho"], lat: -28.6775, lng: -49.3697 },
    { cidade: "Tubarao", bairros: ["Oficinas", "Humaita", "Centro"], lat: -28.4713, lng: -49.0144 },
    { cidade: "Imbituba", bairros: ["Vila Nova", "Centro", "Porto"], lat: -28.2401, lng: -48.6703 },
    { cidade: "Laguna", bairros: ["Mar Grosso", "Centro", "Progresso"], lat: -28.4826, lng: -48.7808 },
    { cidade: "Brusque", bairros: ["Azambuja", "Centro", "Santa Rita"], lat: -27.0984, lng: -48.9171 },
    { cidade: "Balneario Camboriu", bairros: ["Nações", "Centro", "Barra"], lat: -26.9972, lng: -48.6322 },
    { cidade: "Ararangua", bairros: ["Coloninha", "Centro", "Urussanguinha"], lat: -28.9346, lng: -49.4859 },
];
const namePrefixes = [
    "Mercado",
    "Padaria",
    "Bar",
    "Distribuidora",
    "Restaurante",
    "Conveniência",
    "Atacado",
    "Super",
    "Emporio",
    "Lanchonete",
    "Mercearia",
    "Casa de Carnes",
];
const nameSuffixes = [
    "Central",
    "Boa Vista",
    "Santa Clara",
    "Do Porto",
    "Sao Joao",
    "Uniao",
    "Nova Rota",
    "Do Vale",
    "Costa Azul",
    "Avenida",
    "Jardim",
    "Estrela",
];
const tipoClientes = ["Varejo", "Bar/Restaurante", "Atacado", "Conveniência", "Distribuidor"];
const clienteTValues = ["T1", "T2", "T3", null];
const drops = ["Drop 1", "Drop 2", "Drop 3"];
const somas = ["Rota Urbana", "Interior", "Especial"];
const idades = ["0-1 dia", "2-3 dias", "4-5 dias", "6+ dias"];
function round(value, precision = 2) {
    return Number(value.toFixed(precision));
}
const legacyClienteRows = Array.from({ length: 36 }, (_, index) => {
    const city = cityCatalog[index % cityCatalog.length];
    const bairro = city.bairros[index % city.bairros.length];
    const pedido = `79${String(4300 + index).padStart(5, "0")}`;
    const hasCoordinates = index % 17 !== 0;
    const latShift = ((index % 5) - 2) * 0.012;
    const lngShift = ((index % 7) - 3) * 0.014;
    const caixas = 48 + ((index * 11) % 260);
    const pesoCliente = 820 + ((index * 421) % 5600);
    const volume = round(5.2 + ((index * 1.37) % 42), 2);
    return {
        "Cliente": String(10100 + index),
        "Nome": `${namePrefixes[index % namePrefixes.length]} ${nameSuffixes[(index * 3) % nameSuffixes.length]}`,
        "Cidade": city.cidade,
        "Bairro": bairro,
        "Tipo_cliente": tipoClientes[index % tipoClientes.length],
        "Cliente T.": clienteTValues[index % clienteTValues.length],
        "Latitude": hasCoordinates ? round(city.lat + latShift, 6) : null,
        "Longitude": hasCoordinates ? round(city.lng + lngShift, 6) : null,
        "Peso Bruto": round(pesoCliente * (1.04 + (index % 4) * 0.015), 2),
        "Peso Cliente": round(pesoCliente, 2),
        "Volume": volume,
        "Valor": round(3200 + ((index * 733) % 42000), 2),
        "Caixa viagem": caixas,
        "Pedido": pedido,
        "Idade": idades[index % idades.length],
        "Drop": drops[index % drops.length],
        "Soma": somas[index % somas.length],
    };
});
export const clientesMock = legacyClienteRows.map(adaptClienteReportRow);
