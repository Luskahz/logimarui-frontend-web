"use client";
import { useMemo, useState } from "react";
import { Boxes, CircleDollarSign, Clock3, PackageCheck, Percent, Scale, Truck, Users, Warehouse, } from "lucide-react";
import { FilterPanel } from "@/features/critica-pedidos/components/filters/FilterPanel";
import { KpiCard } from "@/features/critica-pedidos/components/kpi/KpiCard";
import { DataTable } from "@/features/critica-pedidos/components/tables/DataTable";
import { emptyDashboardFilters } from "@/features/critica-pedidos/domain/filtros";
import { aggregateProdutos, buildCitySummary } from "@/features/critica-pedidos/utils/aggregations";
import { applyDashboardFilters } from "@/features/critica-pedidos/utils/filtering";
import { formatCurrency, formatDecimal, formatNumber, formatPercent, formatVolume, formatWeight, } from "@/features/critica-pedidos/utils/formatters";
import { calculateDashboardKpis } from "@/features/critica-pedidos/utils/kpis";
import { generatedDashboardRepository } from "@/features/critica-pedidos/services/generatedDashboardRepository";
const baseData = {
    clientes: generatedDashboardRepository.getClientes(),
    pedidos: generatedDashboardRepository.getPedidos(),
    produtos: generatedDashboardRepository.getProdutos(),
};
const filterOptions = generatedDashboardRepository.getFilterOptions();
const topFilterFields = [
    { key: "motivo", label: "Motivo", type: "multiselect", optionsKey: "motivo" },
    { key: "idadePedido", label: "Idade do Pedido", type: "multiselect", optionsKey: "idadePedido" },
];
const sideFilterFields = [
    { key: "idadePedido", label: "Periodo", type: "multiselect", optionsKey: "idadePedido" },
    { key: "operacao", label: "Regional", type: "multiselect", optionsKey: "operacao" },
    { key: "setor", label: "Unidade de Negocio", type: "multiselect", optionsKey: "setor" },
    { key: "cidade", label: "Cidade", type: "select", optionsKey: "cidade" },
    { key: "tipoCliente", label: "Tipo de Cliente", type: "multiselect", optionsKey: "tipoCliente" },
    { key: "clienteT", label: "Grupo de Cliente", type: "multiselect", optionsKey: "clienteT" },
    { key: "palete", label: "Categoria de Produto", type: "multiselect", optionsKey: "palete" },
    { key: "motivo", label: "Motivo", type: "multiselect", optionsKey: "motivo" },
    { key: "nomeCliente", label: "Cliente", type: "text", placeholder: "Buscar cliente" },
    { key: "pedido", label: "Pedido", type: "text", placeholder: "Buscar pedido" },
];
const cityColumns = [
    { key: "cidade", header: "Cidade", width: "7.5rem", render: (row) => row.cidade, sortValue: (row) => row.cidade },
    {
        key: "linear",
        header: "Linear (hl)",
        align: "right",
        render: (row) => formatDecimal(row.linear),
        sortValue: (row) => row.linear,
    },
    {
        key: "entregas",
        header: "Entregas",
        align: "right",
        render: (row) => formatNumber(row.entregas),
        sortValue: (row) => row.entregas,
    },
    {
        key: "volume",
        header: "Volume (hl)",
        align: "right",
        render: (row) => formatVolume(row.volumeHl),
        sortValue: (row) => row.volumeHl,
    },
    {
        key: "caixas",
        header: "Caixas",
        align: "right",
        render: (row) => formatNumber(row.caixas),
        sortValue: (row) => row.caixas,
    },
    {
        key: "peso",
        header: "Peso (kg)",
        align: "right",
        render: (row) => formatWeight(row.pesoClienteKg),
        sortValue: (row) => row.pesoClienteKg,
    },
    {
        key: "valor",
        header: "Valor (R$)",
        align: "right",
        render: (row) => formatCurrency(row.valor),
        sortValue: (row) => row.valor,
    },
    {
        key: "percentual",
        header: "% Critica",
        align: "right",
        render: (row) => <span className="font-bold text-[var(--danger)]">{formatPercent(row.percentualValor)}</span>,
        sortValue: (row) => row.percentualValor,
    },
];
const pedidoColumns = [
    { key: "pedido", header: "Pedido", render: (row) => row.pedidoId, sortValue: (row) => row.pedidoId },
    { key: "roteiro", header: "Roteiro", render: (row) => row.roteiro ?? "-", sortValue: (row) => row.roteiro ?? "" },
    { key: "cidade", header: "Cidade", render: (row) => row.cidade, sortValue: (row) => row.cidade },
    {
        key: "cliente",
        header: "Cliente",
        width: "10rem",
        render: (row) => <span className="font-medium text-white">{row.clienteNome}</span>,
        sortValue: (row) => row.clienteNome,
    },
    {
        key: "idade",
        header: "Idade",
        align: "center",
        render: (row) => <span className="rounded-sm bg-[rgba(242,169,0,0.16)] px-1.5 py-0.5 text-[var(--accent)]">{row.idadePedido ?? "-"}</span>,
        sortValue: (row) => Number(row.idadePedido ?? 0),
    },
    { key: "motivo", header: "Motivo", render: (row) => row.motivo ?? "-", sortValue: (row) => row.motivo ?? "" },
    {
        key: "linear",
        header: "Linear (hl)",
        align: "right",
        render: (row) => formatVolume(row.volumeHl),
        sortValue: (row) => row.volumeHl,
    },
    {
        key: "caixas",
        header: "Caixas",
        align: "right",
        render: (row) => formatNumber(row.caixas),
        sortValue: (row) => row.caixas,
    },
    {
        key: "valor",
        header: "Valor (R$)",
        align: "right",
        render: (row) => formatCurrency(row.valor),
        sortValue: (row) => row.valor,
    },
];
const clienteColumns = [
    {
        key: "cliente",
        header: "Cliente",
        width: "11rem",
        render: (row) => <span className="font-medium text-white">{row.nome}</span>,
        sortValue: (row) => row.nome,
    },
    { key: "cidade", header: "Cidade", render: (row) => row.cidade, sortValue: (row) => row.cidade },
    { key: "roteiro", header: "Roteiro", render: (row) => row.roteiroLabel, sortValue: (row) => row.roteiroLabel },
    {
        key: "pedidos",
        header: "Pedidos",
        align: "right",
        render: (row) => formatNumber(row.pedidosCount),
        sortValue: (row) => row.pedidosCount,
    },
    {
        key: "idade",
        header: "Idade Media",
        align: "right",
        render: (row) => (row.idadeMedia === null ? "-" : formatDecimal(row.idadeMedia)),
        sortValue: (row) => row.idadeMedia ?? 0,
    },
    { key: "motivo", header: "Motivo Principal", render: (row) => row.motivoPrincipal, sortValue: (row) => row.motivoPrincipal },
    {
        key: "linear",
        header: "Linear (hl)",
        align: "right",
        render: (row) => formatVolume(row.volumeHl),
        sortValue: (row) => row.volumeHl,
    },
    {
        key: "caixas",
        header: "Caixas",
        align: "right",
        render: (row) => formatNumber(row.caixas),
        sortValue: (row) => row.caixas,
    },
    {
        key: "valor",
        header: "Valor (R$)",
        align: "right",
        render: (row) => formatCurrency(row.valor),
        sortValue: (row) => row.valor,
    },
];
const produtoColumns = [
    { key: "categoria", header: "Categoria", render: (row) => row.categoria, sortValue: (row) => row.categoria },
    {
        key: "volume",
        header: "Volume (hl)",
        align: "right",
        render: (row) => formatVolume(row.volumeHl),
        sortValue: (row) => row.volumeHl,
    },
    {
        key: "percentualVolume",
        header: "% Vol.",
        align: "right",
        render: (row) => formatPercent(row.percentualVolume),
        sortValue: (row) => row.percentualVolume,
    },
    {
        key: "caixas",
        header: "Caixas",
        align: "right",
        render: (row) => formatNumber(row.caixas),
        sortValue: (row) => row.caixas,
    },
    {
        key: "percentualCaixas",
        header: "% Cx",
        align: "right",
        render: (row) => formatPercent(row.percentualCaixas),
        sortValue: (row) => row.percentualCaixas,
    },
    {
        key: "peso",
        header: "Peso (kg)",
        align: "right",
        render: (row) => formatWeight(row.pesoKg),
        sortValue: (row) => row.pesoKg,
    },
    {
        key: "percentualPeso",
        header: "% Peso",
        align: "right",
        render: (row) => formatPercent(row.percentualPeso),
        sortValue: (row) => row.percentualPeso,
    },
    {
        key: "valor",
        header: "Valor (R$)",
        align: "right",
        render: (row) => formatCurrency(row.valor),
        sortValue: (row) => row.valor,
    },
    {
        key: "percentualValor",
        header: "% Valor",
        align: "right",
        render: (row) => formatPercent(row.percentualValor),
        sortValue: (row) => row.percentualValor,
    },
];
export function CriticaDashboard() {
    const [filters, setFilters] = useState(emptyDashboardFilters);
    const filtered = useMemo(() => applyDashboardFilters(baseData, filters), [filters]);
    const kpis = useMemo(() => calculateDashboardKpis(filtered.clientes, filtered.pedidos), [filtered]);
    const citySummary = useMemo(() => buildCitySummary(filtered.clientes, filtered.pedidos), [filtered]);
    const produtosAgregados = useMemo(() => aggregateProdutos(filtered.produtos), [filtered.produtos]);
    const clienteRows = useMemo(() => buildClienteCriticaRows(filtered.clientes, filtered.pedidos), [filtered]);
    const produtoTotals = useMemo(() => produtosAgregados.reduce((total, item) => ({
        volumeHl: total.volumeHl + item.volumeHl,
        caixas: total.caixas + item.caixas,
        pesoKg: total.pesoKg + item.pesoKg,
        valor: total.valor + item.valor,
    }), { volumeHl: 0, caixas: 0, pesoKg: 0, valor: 0 }), [produtosAgregados]);
    return (<main className="grid min-h-[calc(100vh-3.15rem)] gap-2.5 p-2.5 xl:grid-cols-[minmax(20rem,0.9fr)_minmax(30rem,1.25fr)_13.5rem_15.5rem] xl:grid-rows-[auto_minmax(0,1fr)]">
      <section className="min-w-0 xl:col-span-2 xl:col-start-1 xl:row-start-1">
        <FilterPanel fields={topFilterFields} filters={filters} onChange={setFilters} onClear={() => setFilters(emptyDashboardFilters)} options={filterOptions} title="Filtros superiores" variant="inline"/>
      </section>

      <section className="grid min-w-0 content-start gap-2.5 xl:col-start-1 xl:row-start-2">
        <DataTable columns={cityColumns} compact data={citySummary.slice(0, 10)} footer={cityFooter(kpis)} maxHeight="15.2rem" title="Resumo por cidade"/>
        <DataTable columns={clienteColumns} compact data={clienteRows.slice(0, 60)} footer={clienteFooter(kpis, clienteRows.length)} maxHeight="19.8rem" title="Clientes em critica"/>
      </section>

      <section className="grid min-w-0 content-start gap-2.5 xl:col-start-2 xl:row-start-2">
        <DataTable columns={pedidoColumns} compact data={filtered.pedidos.slice(0, 80)} footer={pedidoFooter(kpis)} maxHeight="18.4rem" title="Pedidos em critica"/>
        <DataTable columns={produtoColumns} compact data={produtosAgregados.slice(0, 8)} footer={produtoFooter(produtoTotals)} maxHeight="16.6rem" title="Critica por produto (pivot)"/>
        <p className="rounded border border-[var(--line-soft)] bg-[rgba(2,8,13,0.64)] px-3 py-2 text-[0.66rem] text-[var(--muted)]">
          Valores referentes aos pedidos em critica no periodo e filtros aplicados.
        </p>
      </section>

      <aside className="grid content-start gap-2.5 xl:col-start-3 xl:row-span-2 xl:row-start-1">
        <section className="grid grid-cols-2 gap-2">
          <KpiCard icon={<Scale size={15}/>} label="Linear (hl)" value={formatDecimal(kpis.linear)}/>
          <KpiCard icon={<Truck size={15}/>} label="Linear Entregas" value={formatDecimal(kpis.linearEntregas)}/>
          <KpiCard icon={<Percent size={15}/>} label="ANS HL" tone="cyan" value={formatPercent(kpis.ansHl)}/>
          <KpiCard icon={<Warehouse size={15}/>} label="Volume (hl)" tone="cyan" value={formatVolume(kpis.volumeHl)}/>
          <KpiCard icon={<Users size={15}/>} label="Quant. PDVs" value={formatNumber(kpis.quantidadePdvs)}/>
          <KpiCard icon={<Boxes size={15}/>} label="Caixas" value={formatNumber(kpis.caixas)}/>
          <KpiCard icon={<Scale size={15}/>} label="Peso Cliente (kg)" value={formatWeight(kpis.pesoClienteKg)}/>
          <KpiCard icon={<CircleDollarSign size={15}/>} label="Valor (R$)" value={formatCurrency(kpis.valor)}/>
          <KpiCard icon={<PackageCheck size={15}/>} label="Paletes Fechados" tone="green" value={formatNumber(kpis.paletesFechados)}/>
          <KpiCard label="CX/PLT Fechado" value={formatDecimal(kpis.cxPltFechado)}/>
          <KpiCard icon={<Boxes size={15}/>} label="Mot. Caixas" tone="danger" value={formatNumber(kpis.motCaixas)}/>
          <KpiCard icon={<Truck size={15}/>} label="Entre. Mot" tone="danger" value={formatNumber(kpis.entreMot)}/>
          <KpiCard icon={<Clock3 size={15}/>} label="Peso Mot. (kg)" tone="danger" value={formatWeight(kpis.pesoMot)}/>
        </section>
      </aside>

      <aside className="min-w-0 xl:col-start-4 xl:row-span-2 xl:row-start-1">
        <FilterPanel fields={sideFilterFields} filters={filters} onChange={setFilters} onClear={() => setFilters(emptyDashboardFilters)} options={filterOptions} title="Filtros"/>
      </aside>
    </main>);
}
function buildClienteCriticaRows(clientes, pedidos) {
    const pedidosPorCliente = new Map();
    pedidos.forEach((pedido) => {
        const current = pedidosPorCliente.get(pedido.clienteId) ?? [];
        current.push(pedido);
        pedidosPorCliente.set(pedido.clienteId, current);
    });
    return clientes
        .map((cliente) => {
        const clientePedidos = pedidosPorCliente.get(cliente.clienteId) ?? [];
        const idades = clientePedidos.map((pedido) => Number(pedido.idadePedido)).filter((idade) => Number.isFinite(idade));
        const motivos = frequency(clientePedidos.map((pedido) => pedido.motivo));
        const roteiro = clientePedidos.find((pedido) => pedido.roteiro)?.roteiro ?? cliente.setor ?? "-";
        return {
            ...cliente,
            pedidosCount: new Set(clientePedidos.map((pedido) => pedido.pedidoId)).size,
            idadeMedia: idades.length > 0 ? idades.reduce((total, idade) => total + idade, 0) / idades.length : null,
            motivoPrincipal: motivos[0]?.label ?? cliente.motivo ?? "-",
            roteiroLabel: roteiro,
        };
    })
        .sort((a, b) => b.valor - a.valor);
}
function frequency(values) {
    const counts = new Map();
    values.forEach((value) => {
        if (!value) {
            return;
        }
        counts.set(value, (counts.get(value) ?? 0) + 1);
    });
    return Array.from(counts.entries())
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count);
}
function cityFooter(kpis) {
    return (<tr className="bg-[rgba(242,169,0,0.06)] font-bold text-[var(--accent)]">
      <td className="px-2 py-1.5 text-[0.68rem] uppercase">Total</td>
      <td className="px-2 py-1.5 text-right font-mono text-[0.68rem]">{formatDecimal(kpis.linear)}</td>
      <td className="px-2 py-1.5 text-right font-mono text-[0.68rem]">{formatNumber(kpis.quantidadePedidos)}</td>
      <td className="px-2 py-1.5 text-right font-mono text-[0.68rem]">{formatVolume(kpis.volumeHl)}</td>
      <td className="px-2 py-1.5 text-right font-mono text-[0.68rem]">{formatNumber(kpis.caixas)}</td>
      <td className="px-2 py-1.5 text-right font-mono text-[0.68rem]">{formatWeight(kpis.pesoClienteKg)}</td>
      <td className="px-2 py-1.5 text-right font-mono text-[0.68rem]">{formatCurrency(kpis.valor)}</td>
      <td className="px-2 py-1.5 text-right font-mono text-[0.68rem]">100%</td>
    </tr>);
}
function pedidoFooter(kpis) {
    return (<tr className="bg-[rgba(242,169,0,0.06)] font-bold text-[var(--accent)]">
      <td className="px-2 py-1.5 text-[0.68rem] uppercase" colSpan={6}>
        Total geral
      </td>
      <td className="px-2 py-1.5 text-right font-mono text-[0.68rem]">{formatVolume(kpis.volumeHl)}</td>
      <td className="px-2 py-1.5 text-right font-mono text-[0.68rem]">{formatNumber(kpis.caixas)}</td>
      <td className="px-2 py-1.5 text-right font-mono text-[0.68rem]">{formatCurrency(kpis.valor)}</td>
    </tr>);
}
function clienteFooter(kpis, totalClientes) {
    return (<tr className="bg-[rgba(242,169,0,0.06)] font-bold text-[var(--accent)]">
      <td className="px-2 py-1.5 text-[0.68rem] uppercase" colSpan={3}>
        Total
      </td>
      <td className="px-2 py-1.5 text-right font-mono text-[0.68rem]">{formatNumber(totalClientes)}</td>
      <td className="px-2 py-1.5 text-right font-mono text-[0.68rem]">-</td>
      <td className="px-2 py-1.5 text-[0.68rem]">-</td>
      <td className="px-2 py-1.5 text-right font-mono text-[0.68rem]">{formatVolume(kpis.volumeHl)}</td>
      <td className="px-2 py-1.5 text-right font-mono text-[0.68rem]">{formatNumber(kpis.caixas)}</td>
      <td className="px-2 py-1.5 text-right font-mono text-[0.68rem]">{formatCurrency(kpis.valor)}</td>
    </tr>);
}
function produtoFooter(totals) {
    return (<tr className="bg-[rgba(242,169,0,0.06)] font-bold text-[var(--accent)]">
      <td className="px-2 py-1.5 text-[0.68rem] uppercase">Total</td>
      <td className="px-2 py-1.5 text-right font-mono text-[0.68rem]">{formatVolume(totals.volumeHl)}</td>
      <td className="px-2 py-1.5 text-right font-mono text-[0.68rem]">100%</td>
      <td className="px-2 py-1.5 text-right font-mono text-[0.68rem]">{formatNumber(totals.caixas)}</td>
      <td className="px-2 py-1.5 text-right font-mono text-[0.68rem]">100%</td>
      <td className="px-2 py-1.5 text-right font-mono text-[0.68rem]">{formatWeight(totals.pesoKg)}</td>
      <td className="px-2 py-1.5 text-right font-mono text-[0.68rem]">100%</td>
      <td className="px-2 py-1.5 text-right font-mono text-[0.68rem]">{formatCurrency(totals.valor)}</td>
      <td className="px-2 py-1.5 text-right font-mono text-[0.68rem]">100%</td>
    </tr>);
}
