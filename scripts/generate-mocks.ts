import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { ClienteRoteiro } from "../src/domain/cliente";
import type { PedidoRoteiro } from "../src/domain/pedido";
import type { ProdutoRoteiro } from "../src/domain/produto";
import {
  cleanId,
  decodeCsvBuffer,
  detectDelimiter,
  getField,
  normalizeHeader,
  parseCsvText,
  parsePtDate,
  parsePtNumber,
  type ParsedCsvFile,
} from "../src/data/adapters/referenceCsvAdapter";
import { referenceFieldMap } from "../src/data/adapters/referenceFieldMap";

interface SourceFile extends ParsedCsvFile {
  fileName: string;
  filePath: string;
  lastWriteTime: string;
}

interface ProductCatalogItem {
  codProduto: string;
  nomeProduto: string;
  categoria: string | null;
  pesoKgUnitario: number;
  caixasPallet: number;
}

interface PedidoDraft {
  pedidoId: string;
  data: string | null;
  clienteId: string;
  clienteNome: string;
  cidade: string;
  roteiro: string | null;
  motivo: string | null;
  operacao: string | null;
  setor: string | null;
  idadePedido: string | null;
  drop: string | null;
  soma: string | null;
  pesoBrutoKg: number;
  pesoClienteKg: number;
  volumeHl: number;
  caixas: number;
  valor: number;
  paletesFechados: number;
  palete: string | null;
}

const rootDir = process.cwd();
const generatedDir = path.join(rootDir, "src", "data", "generated");
const warnings: string[] = [];

const referenciaDir = resolveReferenceDir();
const sources = referenciaDir ? loadCsvSources(referenciaDir) : [];

const sourceClientes = findSourceByName(/relatorio-cliente/i) ?? findSourceWith(["latitude", "longitude"]);
const sourcePedidos = findSourceByName(/03\.01\.36\.04/i) ?? findSourceWith(["pedido", "cod pdv", "total pedido"]);
const sourceCritica = findSourceByName(/03\.01\.47\.01/i) ?? findSourceWith(["motivo", "cod prod", "volume marcacao"]);
const sourceRoteiro = findSourceByName(/03\.01\.17/i) ?? findSourceWith(["peso bruto", "situacao"]);
const sourceCatalogo = findSourceByName(/01\.11/i) ?? findSourceWith(["descricao", "peso bruto kg", "caixas pallet"]);

warnMissingSource("relatorio-cliente.csv", sourceClientes);
warnMissingSource("03.01.36.04.csv", sourcePedidos);
warnMissingSource("03.01.47.01.csv", sourceCritica);
warnMissingSource("03.01.17.csv", sourceRoteiro);
warnMissingSource("01.11.csv", sourceCatalogo);

warnMissingColumns(sourceClientes, "clientes", {
  clienteId: referenceFieldMap.cliente.clienteId,
  nome: referenceFieldMap.cliente.nome,
  latitude: referenceFieldMap.cliente.latitude,
  longitude: referenceFieldMap.cliente.longitude,
});
warnMissingColumns(sourcePedidos, "pedidos", {
  pedidoId: referenceFieldMap.pedido.pedidoId,
  clienteId: referenceFieldMap.pedido.clienteId,
  quantidade: referenceFieldMap.pedido.quantidade,
  valor: referenceFieldMap.pedido.valor,
});
warnMissingColumns(sourceCritica, "critica", {
  pedidoId: referenceFieldMap.pedido.pedidoId,
  motivo: referenceFieldMap.pedido.motivo,
  volumeHl: referenceFieldMap.pedido.volumeHl,
});
warnMissingColumns(sourceRoteiro, "roteiro", {
  pedidoId: referenceFieldMap.pedido.pedidoId,
  pesoBrutoKg: referenceFieldMap.pedido.pesoBrutoKg,
});
warnMissingColumns(sourceCatalogo, "catalogo", {
  codProduto: referenceFieldMap.produto.codProduto,
  nomeProduto: referenceFieldMap.produto.nomeProduto,
  pesoKg: referenceFieldMap.produto.pesoKg,
});

const catalogo = buildCatalog(sourceCatalogo);
const perfisClientes = buildClientProfiles(sourceClientes);
const roteiroPorPedido = buildRouteFacts(sourceRoteiro);
const criticaPorPedido = buildCriticaFacts(sourceCritica);
const produtos = buildProdutos(sourcePedidos, sourceCritica, catalogo);
const pedidos = buildPedidos(sourcePedidos, produtos, roteiroPorPedido, criticaPorPedido, perfisClientes);
const clientes = buildClientes(pedidos, perfisClientes, roteiroPorPedido);

const finalData = clientes.length > 0 && pedidos.length > 0 ? { clientes, pedidos, produtos } : buildFallbackData();

const generatedAt = new Date();
const metadata = {
  generatedAt: generatedAt.toISOString(),
  lastUpdated: formatDateTime(generatedAt),
  status: sources.length > 0 ? "Dados CSV" : "Fallback minimo",
  sourceDirectory: referenciaDir ? path.relative(rootDir, referenciaDir) : null,
  files: sources.map((source) => ({
    name: source.fileName,
    rows: source.rows.length,
    validRows: source.rows.length,
    invalidRows: 0,
    delimiter: source.delimiter,
    encoding: source.encoding,
    lastWriteTime: source.lastWriteTime,
  })),
  counts: {
    clientes: finalData.clientes.length,
    pedidos: finalData.pedidos.length,
    produtos: finalData.produtos.length,
  },
  warnings,
};

mkdirSync(generatedDir, { recursive: true });
writeJson("clientes.generated.json", finalData.clientes);
writeJson("pedidos.generated.json", finalData.pedidos);
writeJson("produtos.generated.json", finalData.produtos);
writeJson("metadata.generated.json", metadata);

if (warnings.length > 0) {
  console.warn(`generate:mocks finalizado com ${warnings.length} aviso(s):`);
  warnings.forEach((warning) => console.warn(`- ${warning}`));
} else {
  console.log("generate:mocks finalizado sem avisos.");
}
console.log(
  `Gerados ${finalData.clientes.length} clientes, ${finalData.pedidos.length} pedidos e ${finalData.produtos.length} produtos.`,
);

function resolveReferenceDir() {
  const candidates = ["referencias", "referencia"].map((folder) => path.join(rootDir, folder));
  const found = candidates.find((candidate) => existsSync(candidate) && statSync(candidate).isDirectory());
  if (!found) {
    warnings.push("Diretorio referencias/referencia nao encontrado; usando fallback minimo.");
  }
  return found;
}

function loadCsvSources(directory: string): SourceFile[] {
  const files = readdirSync(directory)
    .filter((fileName) => fileName.toLowerCase().endsWith(".csv"))
    .map((fileName) => path.join(directory, fileName));

  if (files.length === 0) {
    warnings.push(`Nenhum CSV encontrado em ${path.relative(rootDir, directory)}; usando fallback minimo.`);
  }

  return files.map((filePath) => {
    const buffer = readFileSync(filePath);
    const decoded = decodeCsvBuffer(buffer);
    const delimiter = detectDelimiter(decoded.text);
    const parsed = parseCsvText(decoded.text, delimiter, decoded.encoding);
    return {
      ...parsed,
      fileName: path.basename(filePath),
      filePath,
      lastWriteTime: statSync(filePath).mtime.toISOString(),
    };
  });
}

function findSourceByName(pattern: RegExp) {
  return sources.find((source) => pattern.test(source.fileName));
}

function findSourceWith(columns: string[]) {
  return sources.find((source) =>
    columns.every((column) => source.normalizedHeaders.includes(normalizeHeader(column))),
  );
}

function warnMissingSource(label: string, source: SourceFile | undefined) {
  if (!source) {
    warnings.push(`Fonte esperada ${label} ausente.`);
  }
}

function warnMissingColumns(
  source: SourceFile | undefined,
  context: string,
  fields: Record<string, readonly string[]>,
) {
  if (!source) {
    return;
  }

  Object.entries(fields).forEach(([field, candidates]) => {
    const found = candidates.some((candidate) => source.normalizedHeaders.includes(normalizeHeader(candidate)));
    if (!found) {
      warnings.push(
        `${source.fileName}: coluna ${context}.${field} ausente. Colunas disponiveis: ${source.headers.join(", ")}`,
      );
    }
  });
}

function buildCatalog(source: SourceFile | undefined) {
  const catalog = new Map<string, ProductCatalogItem>();
  source?.rows.forEach((row) => {
    const codProduto = cleanId(getField(row, referenceFieldMap.produto.codProduto));
    if (!codProduto) {
      return;
    }

    catalog.set(codProduto, {
      codProduto,
      nomeProduto: getField(row, referenceFieldMap.produto.nomeProduto) ?? `Produto ${codProduto}`,
      categoria: getField(row, referenceFieldMap.produto.categoria),
      pesoKgUnitario: parsePtNumber(getField(row, referenceFieldMap.produto.pesoKg)) ?? 0,
      caixasPallet: parsePtNumber(getField(row, referenceFieldMap.produto.caixasPallet)) ?? 0,
    });
  });
  return catalog;
}

function buildClientProfiles(source: SourceFile | undefined) {
  const profiles = new Map<string, Partial<ClienteRoteiro>>();
  source?.rows.forEach((row) => {
    const clienteId = cleanId(getField(row, referenceFieldMap.cliente.clienteId));
    if (!clienteId) {
      return;
    }

    profiles.set(clienteId, {
      clienteId,
      nome: getField(row, referenceFieldMap.cliente.nome) ?? `Cliente ${clienteId}`,
      cidade: getField(row, referenceFieldMap.cliente.cidade) ?? "Sem cidade",
      bairro: getField(row, referenceFieldMap.cliente.bairro),
      tipoCliente: getField(row, referenceFieldMap.cliente.tipoCliente),
      clienteT: getField(row, referenceFieldMap.cliente.clienteT),
      latitude: parsePtNumber(getField(row, referenceFieldMap.cliente.latitude)),
      longitude: parsePtNumber(getField(row, referenceFieldMap.cliente.longitude)),
      setor: getField(row, referenceFieldMap.cliente.setor),
    });
  });
  return profiles;
}

function buildRouteFacts(source: SourceFile | undefined) {
  const facts = new Map<string, Partial<PedidoDraft> & { bairro?: string | null }>();
  source?.rows.forEach((row) => {
    const pedidoId = cleanId(getField(row, referenceFieldMap.pedido.pedidoId));
    if (!pedidoId) {
      return;
    }

    facts.set(pedidoId, {
      pedidoId,
      clienteId: cleanId(getField(row, referenceFieldMap.pedido.clienteId)),
      clienteNome: getField(row, referenceFieldMap.cliente.nome) ?? "",
      cidade: getField(row, referenceFieldMap.cliente.cidade) ?? "",
      bairro: getField(row, referenceFieldMap.cliente.bairro),
      roteiro: getField(row, referenceFieldMap.pedido.roteiro),
      motivo: getField(row, referenceFieldMap.pedido.motivo),
      pesoBrutoKg: parsePtNumber(getField(row, referenceFieldMap.pedido.pesoBrutoKg)) ?? 0,
    });
  });
  return facts;
}

function buildCriticaFacts(source: SourceFile | undefined) {
  const facts = new Map<string, Partial<PedidoDraft> & { tipoCliente?: string | null }>();
  source?.rows.forEach((row) => {
    const pedidoId = cleanId(getField(row, referenceFieldMap.pedido.pedidoId));
    if (!pedidoId) {
      return;
    }

    const current = facts.get(pedidoId) ?? {};
    const volume = parsePtNumber(getField(row, referenceFieldMap.pedido.volumeHl)) ?? 0;
    const quantidade = parsePtNumber(getField(row, referenceFieldMap.pedido.quantidade)) ?? 0;
    facts.set(pedidoId, {
      ...current,
      pedidoId,
      data: current.data ?? parsePtDate(getField(row, referenceFieldMap.pedido.data)),
      clienteId: current.clienteId || cleanId(getField(row, referenceFieldMap.pedido.clienteId)),
      clienteNome: current.clienteNome || getField(row, referenceFieldMap.pedido.clienteNome) || "",
      cidade: current.cidade || getField(row, referenceFieldMap.pedido.cidade) || "",
      roteiro: current.roteiro ?? getField(row, referenceFieldMap.pedido.roteiro),
      motivo: current.motivo ?? getField(row, referenceFieldMap.pedido.motivo),
      operacao: current.operacao ?? getField(row, referenceFieldMap.pedido.operacao),
      setor: current.setor ?? getField(row, referenceFieldMap.pedido.setor),
      idadePedido: current.idadePedido ?? getField(row, referenceFieldMap.pedido.idadePedido),
      drop: current.drop ?? getField(row, referenceFieldMap.pedido.drop),
      soma: current.soma ?? getField(row, referenceFieldMap.pedido.soma),
      volumeHl: (current.volumeHl ?? 0) + volume,
      caixas: (current.caixas ?? 0) + quantidade,
      tipoCliente: current.tipoCliente ?? getField(row, referenceFieldMap.cliente.tipoCliente),
    });
  });
  return facts;
}

function buildProdutos(
  sourcePedidos: SourceFile | undefined,
  sourceCritica: SourceFile | undefined,
  catalogo: Map<string, ProductCatalogItem>,
) {
  const primary = sourcePedidos?.rows.length ? sourcePedidos : sourceCritica;
  const criticaProdutos = buildCriticaProductFacts(sourceCritica);
  const produtos = new Map<string, ProdutoRoteiro>();

  primary?.rows.forEach((row) => {
    const pedidoId = cleanId(getField(row, referenceFieldMap.pedido.pedidoId));
    const clienteId = cleanId(getField(row, referenceFieldMap.pedido.clienteId));
    const codProduto = cleanId(getField(row, referenceFieldMap.produto.codProduto));
    if (!pedidoId || !clienteId || !codProduto) {
      return;
    }

    const catalogItem = catalogo.get(codProduto);
    const criticaProduct = criticaProdutos.get(`${pedidoId}:${clienteId}:${codProduto}`);
    const quantidade = parsePtNumber(getField(row, referenceFieldMap.produto.quantidade)) ?? 0;
    const precoUnitario = parsePtNumber(getField(row, referenceFieldMap.produto.precoUnitario)) ?? 0;
    const pesoKg = parsePtNumber(getField(row, referenceFieldMap.produto.pesoKg)) ?? quantidade * (catalogItem?.pesoKgUnitario ?? 0);
    const volumeHl = parsePtNumber(getField(row, referenceFieldMap.produto.volumeHl)) ?? criticaProduct?.volumeHl ?? 0;
    const caixasPallet = catalogItem?.caixasPallet ?? 0;
    const key = `${pedidoId}:${clienteId}:${codProduto}`;
    const current = produtos.get(key);
    const next: ProdutoRoteiro = {
      codProduto,
      nomeProduto:
        catalogItem?.nomeProduto ??
        criticaProduct?.nomeProduto ??
        getField(row, referenceFieldMap.produto.nomeProduto) ??
        `Produto ${codProduto}`,
      categoria: catalogItem?.categoria ?? criticaProduct?.categoria ?? getField(row, referenceFieldMap.produto.categoria),
      quantidade: (current?.quantidade ?? 0) + quantidade,
      caixas: (current?.caixas ?? 0) + quantidade,
      pesoKg: (current?.pesoKg ?? 0) + pesoKg,
      volumeHl: (current?.volumeHl ?? 0) + volumeHl,
      valor: (current?.valor ?? 0) + quantidade * precoUnitario,
      paletesFechados: (current?.paletesFechados ?? 0) + (caixasPallet > 0 ? quantidade / caixasPallet : 0),
      pedidoId,
      clienteId,
    };
    produtos.set(key, next);
  });

  return Array.from(produtos.values());
}

function buildCriticaProductFacts(source: SourceFile | undefined) {
  const facts = new Map<string, Pick<ProdutoRoteiro, "nomeProduto" | "categoria" | "volumeHl">>();
  source?.rows.forEach((row) => {
    const pedidoId = cleanId(getField(row, referenceFieldMap.pedido.pedidoId));
    const clienteId = cleanId(getField(row, referenceFieldMap.pedido.clienteId));
    const codProduto = cleanId(getField(row, referenceFieldMap.produto.codProduto));
    if (!pedidoId || !clienteId || !codProduto) {
      return;
    }

    const key = `${pedidoId}:${clienteId}:${codProduto}`;
    const current = facts.get(key);
    facts.set(key, {
      nomeProduto: current?.nomeProduto ?? getField(row, referenceFieldMap.produto.nomeProduto) ?? `Produto ${codProduto}`,
      categoria: current?.categoria ?? getField(row, referenceFieldMap.produto.categoria),
      volumeHl: (current?.volumeHl ?? 0) + (parsePtNumber(getField(row, referenceFieldMap.produto.volumeHl)) ?? 0),
    });
  });
  return facts;
}

function buildPedidos(
  source: SourceFile | undefined,
  produtos: ProdutoRoteiro[],
  roteiroPorPedido: Map<string, Partial<PedidoDraft> & { bairro?: string | null }>,
  criticaPorPedido: Map<string, Partial<PedidoDraft> & { tipoCliente?: string | null }>,
  perfisClientes: Map<string, Partial<ClienteRoteiro>>,
) {
  const produtosPorPedido = groupBy(produtos, (produto) => produto.pedidoId);
  const drafts = new Map<string, PedidoDraft>();

  source?.rows.forEach((row) => {
    const pedidoId = cleanId(getField(row, referenceFieldMap.pedido.pedidoId));
    const clienteId = cleanId(getField(row, referenceFieldMap.pedido.clienteId));
    if (!pedidoId || !clienteId || drafts.has(pedidoId)) {
      return;
    }

    const route = roteiroPorPedido.get(pedidoId);
    const critica = criticaPorPedido.get(pedidoId);
    const profile = perfisClientes.get(clienteId) ?? (route?.clienteId ? perfisClientes.get(route.clienteId) : undefined);
    const pedidoProdutos = produtosPorPedido.get(pedidoId) ?? [];
    const pesoProdutos = sum(pedidoProdutos.map((produto) => produto.pesoKg));
    const volumeProdutos = sum(pedidoProdutos.map((produto) => produto.volumeHl));
    const caixasProdutos = sum(pedidoProdutos.map((produto) => produto.caixas));
    const valorProdutos = sum(pedidoProdutos.map((produto) => produto.valor));
    const paletesProdutos = sum(pedidoProdutos.map((produto) => produto.paletesFechados));
    const routeWeight = route?.pesoBrutoKg ?? 0;
    const valorPedido = parsePtNumber(getField(row, referenceFieldMap.pedido.valor)) ?? valorProdutos;

    drafts.set(pedidoId, {
      pedidoId,
      data: parsePtDate(getField(row, referenceFieldMap.pedido.data)) ?? critica?.data ?? null,
      clienteId,
      clienteNome:
        getField(row, referenceFieldMap.pedido.clienteNome) ??
        route?.clienteNome ??
        profile?.nome ??
        `Cliente ${clienteId}`,
      cidade:
        critica?.cidade ||
        route?.cidade ||
        profile?.cidade ||
        getField(row, referenceFieldMap.pedido.cidade) ||
        "Sem cidade",
      roteiro: getField(row, referenceFieldMap.pedido.roteiro) ?? route?.roteiro ?? critica?.roteiro ?? null,
      motivo: critica?.motivo ?? getField(row, referenceFieldMap.pedido.motivo) ?? route?.motivo ?? null,
      operacao: getField(row, referenceFieldMap.pedido.operacao) ?? critica?.operacao ?? null,
      setor: getField(row, referenceFieldMap.pedido.setor) ?? critica?.setor ?? profile?.setor ?? null,
      idadePedido: getField(row, referenceFieldMap.pedido.idadePedido) ?? critica?.idadePedido ?? null,
      drop: getField(row, referenceFieldMap.pedido.drop) ?? critica?.drop ?? null,
      soma: getField(row, referenceFieldMap.pedido.soma) ?? critica?.soma ?? null,
      pesoBrutoKg: routeWeight || pesoProdutos,
      pesoClienteKg: routeWeight || pesoProdutos,
      volumeHl: volumeProdutos || critica?.volumeHl || 0,
      caixas: caixasProdutos || critica?.caixas || 0,
      valor: valorPedido,
      paletesFechados: paletesProdutos,
      palete: paletesProdutos > 0 ? "Fechado" : "Sem palete",
    });
  });

  roteiroPorPedido.forEach((route, pedidoId) => {
    if (drafts.has(pedidoId) || !route.clienteId) {
      return;
    }
    const profile = perfisClientes.get(route.clienteId);
    drafts.set(pedidoId, {
      pedidoId,
      data: null,
      clienteId: route.clienteId,
      clienteNome: route.clienteNome || profile?.nome || `Cliente ${route.clienteId}`,
      cidade: route.cidade || profile?.cidade || "Sem cidade",
      roteiro: route.roteiro ?? null,
      motivo: route.motivo ?? null,
      operacao: null,
      setor: profile?.setor ?? null,
      idadePedido: null,
      drop: null,
      soma: null,
      pesoBrutoKg: route.pesoBrutoKg ?? 0,
      pesoClienteKg: route.pesoBrutoKg ?? 0,
      volumeHl: 0,
      caixas: 0,
      valor: 0,
      paletesFechados: 0,
      palete: "Sem palete",
    });
  });

  return Array.from(drafts.values()).sort((a, b) => b.valor - a.valor);
}

function buildClientes(
  pedidos: PedidoRoteiro[],
  perfisClientes: Map<string, Partial<ClienteRoteiro>>,
  roteiroPorPedido: Map<string, Partial<PedidoDraft> & { bairro?: string | null }>,
) {
  const pedidosPorCliente = groupBy(pedidos, (pedido) => pedido.clienteId);
  return Array.from(pedidosPorCliente.entries())
    .map(([clienteId, clientePedidos]) => {
      const first = clientePedidos[0];
      const profile = perfisClientes.get(clienteId);
      const route = roteiroPorPedido.get(first.pedidoId);
      return {
        clienteId,
        nome: profile?.nome ?? first.clienteNome,
        cidade: profile?.cidade ?? first.cidade,
        bairro: profile?.bairro ?? route?.bairro ?? null,
        tipoCliente: profile?.tipoCliente ?? null,
        clienteT: profile?.clienteT ?? null,
        latitude: profile?.latitude ?? null,
        longitude: profile?.longitude ?? null,
        pesoBrutoKg: sum(clientePedidos.map((pedido) => pedido.pesoBrutoKg)),
        pesoClienteKg: sum(clientePedidos.map((pedido) => pedido.pesoClienteKg)),
        volumeHl: sum(clientePedidos.map((pedido) => pedido.volumeHl)),
        valor: sum(clientePedidos.map((pedido) => pedido.valor)),
        caixas: sum(clientePedidos.map((pedido) => pedido.caixas)),
        pedidoId: first.pedidoId,
        idadePedido: first.idadePedido,
        operacao: first.operacao,
        setor: first.setor,
        palete: first.palete,
        motivo: first.motivo,
        drop: first.drop,
        soma: first.soma,
      } satisfies ClienteRoteiro;
    })
    .sort((a, b) => b.pesoClienteKg - a.pesoClienteKg);
}

function buildFallbackData() {
  const cliente: ClienteRoteiro = {
    clienteId: "1",
    nome: "Cliente exemplo",
    cidade: "Sao Paulo",
    bairro: "Centro",
    tipoCliente: "Varejo",
    clienteT: "Normal",
    latitude: -23.55052,
    longitude: -46.633308,
    pesoBrutoKg: 1250,
    pesoClienteKg: 1250,
    volumeHl: 12.5,
    valor: 16750,
    caixas: 120,
    pedidoId: "500001",
    idadePedido: "0",
    operacao: "Venda",
    setor: "Padrao",
    palete: "Fechado",
    motivo: "Fallback",
    drop: "Nao",
    soma: "Todos",
  };
  const pedido: PedidoRoteiro = {
    pedidoId: "500001",
    data: null,
    clienteId: cliente.clienteId,
    clienteNome: cliente.nome,
    cidade: cliente.cidade,
    roteiro: "1",
    motivo: "Fallback",
    operacao: "Venda",
    setor: "Padrao",
    drop: "Nao",
    soma: "Todos",
    idadePedido: "0",
    pesoBrutoKg: cliente.pesoBrutoKg,
    pesoClienteKg: cliente.pesoClienteKg,
    volumeHl: cliente.volumeHl,
    caixas: cliente.caixas,
    paletesFechados: 2,
    palete: "Fechado",
    valor: cliente.valor,
  };
  const produto: ProdutoRoteiro = {
    codProduto: "1",
    nomeProduto: "Produto exemplo",
    categoria: "Fallback",
    quantidade: 120,
    caixas: 120,
    pesoKg: 1250,
    volumeHl: 12.5,
    valor: 16750,
    paletesFechados: 2,
    pedidoId: pedido.pedidoId,
    clienteId: cliente.clienteId,
  };
  return { clientes: [cliente], pedidos: [pedido], produtos: [produto] };
}

function writeJson(fileName: string, data: unknown) {
  writeFileSync(path.join(generatedDir, fileName), `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function groupBy<T>(items: T[], getKey: (item: T) => string) {
  const groups = new Map<string, T[]>();
  items.forEach((item) => {
    const key = getKey(item);
    const current = groups.get(key) ?? [];
    current.push(item);
    groups.set(key, current);
  });
  return groups;
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}
