"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Boxes, ChevronDown, CircleDollarSign, ClipboardList, MapPinned, Maximize2, Minimize2, PackageSearch, Scale, Store, X, } from "lucide-react";
import { FilterPanel } from "@/features/critica-pedidos/components/filters/FilterPanel";
import { KpiCard } from "@/features/critica-pedidos/components/kpi/KpiCard";
import { PdvMap } from "@/features/critica-pedidos/components/map/PdvMap";
import { DataTable } from "@/features/critica-pedidos/components/tables/DataTable";
import { emptyDashboardFilters } from "@/features/critica-pedidos/domain/filtros";
import { applyDashboardFilters } from "@/features/critica-pedidos/utils/filtering";
import { formatCurrency, formatNumber, formatVolume, formatWeight } from "@/features/critica-pedidos/utils/formatters";
import { calculateDashboardKpis } from "@/features/critica-pedidos/utils/kpis";
import { generatedDashboardRepository } from "@/features/critica-pedidos/services/generatedDashboardRepository";
const baseData = {
    clientes: generatedDashboardRepository.getClientes(),
    pedidos: generatedDashboardRepository.getPedidos(),
    produtos: generatedDashboardRepository.getProdutos(),
};
const filterOptions = generatedDashboardRepository.getFilterOptions();
const mapFilterFields = [
    { key: "soma", label: "Soma", type: "multiselect", optionsKey: "soma" },
    { key: "drop", label: "Drop", type: "multiselect", optionsKey: "drop" },
    { key: "cidade", label: "Cidade", type: "select", optionsKey: "cidade" },
    { key: "bairro", label: "Bairro", type: "select", optionsKey: "bairro" },
    { key: "nomeCliente", label: "Nome", type: "text", placeholder: "Buscar nome do PDV" },
    { key: "clienteT", label: "Cliente T.", type: "multiselect", optionsKey: "clienteT" },
    { key: "idade", label: "Idade", type: "multiselect", optionsKey: "idade" },
    { key: "pedido", label: "Pedido", type: "text", placeholder: "Buscar pedido" },
    { key: "tipoCliente", label: "Tipo Cliente", type: "multiselect", optionsKey: "tipoCliente" },
];
const clienteMapColumns = [
    { key: "codigo", header: "Codigo", width: "4.4rem", render: (row) => row.clienteId, sortValue: (row) => row.clienteId },
    {
        key: "nome",
        header: "Nome",
        width: "10rem",
        render: (row) => <span className="font-medium text-white">{row.nome}</span>,
        sortValue: (row) => row.nome,
    },
    { key: "cidade", header: "Cidade", render: (row) => row.cidade, sortValue: (row) => row.cidade },
    {
        key: "peso",
        header: "Peso Bruto (kg)",
        align: "right",
        render: (row) => formatWeight(row.pesoBrutoKg),
        sortValue: (row) => row.pesoBrutoKg,
    },
];
const pedidoMapColumns = [
    { key: "pedido", header: "Pedido", render: (row) => row.pedidoId, sortValue: (row) => row.pedidoId },
    { key: "data", header: "Data", render: (row) => row.data ?? "-", sortValue: (row) => row.data ?? "" },
    {
        key: "cliente",
        header: "Cliente",
        width: "9rem",
        render: (row) => <span className="font-medium text-white">{row.clienteNome}</span>,
        sortValue: (row) => row.clienteNome,
    },
    { key: "cidade", header: "Cidade", render: (row) => row.cidade, sortValue: (row) => row.cidade },
    {
        key: "peso",
        header: "Peso Bruto",
        align: "right",
        render: (row) => formatWeight(row.pesoBrutoKg),
        sortValue: (row) => row.pesoBrutoKg,
    },
    {
        key: "volume",
        header: "Volume",
        align: "right",
        render: (row) => formatVolume(row.volumeHl),
        sortValue: (row) => row.volumeHl,
    },
];
const emptyMapDashboardSelection = {
    kind: "none",
    label: "Global",
    clienteIds: [],
};
export function MapaDashboard() {
    const mapPanelRef = useRef(null);
    const [filters, setFilters] = useState(emptyDashboardFilters);
    const [isMapFullscreen, setIsMapFullscreen] = useState(false);
    const [mapSelection, setMapSelection] = useState(emptyMapDashboardSelection);
    const [showFullscreenKpis, setShowFullscreenKpis] = useState(true);
    const filtered = useMemo(() => applyDashboardFilters(baseData, filters), [filters]);
    const selectedClienteIdSet = useMemo(() => new Set(mapSelection.clienteIds), [mapSelection.clienteIds]);
    const hasMapSelection = mapSelection.clienteIds.length > 0;
    const scopedClientes = useMemo(() => (hasMapSelection ? filtered.clientes.filter((cliente) => selectedClienteIdSet.has(cliente.clienteId)) : filtered.clientes), [filtered.clientes, hasMapSelection, selectedClienteIdSet]);
    const scopedPedidos = useMemo(() => (hasMapSelection ? filtered.pedidos.filter((pedido) => selectedClienteIdSet.has(pedido.clienteId)) : filtered.pedidos), [filtered.pedidos, hasMapSelection, selectedClienteIdSet]);
    const kpis = useMemo(() => calculateDashboardKpis(scopedClientes, scopedPedidos), [scopedClientes, scopedPedidos]);
    const kpiSubtitle = hasMapSelection ? mapSelection.label : undefined;
    const mapKpiItems = useMemo(() => [
        { icon: <Scale size={15}/>, label: "Peso Bruto (kg)", subtitle: kpiSubtitle, value: formatWeight(kpis.pesoBrutoKg) },
        { icon: <Store size={15}/>, label: "Quant. PDVs", subtitle: kpiSubtitle, value: formatNumber(kpis.quantidadePdvs) },
        { icon: <PackageSearch size={15}/>, label: "Volume (hl)", subtitle: kpiSubtitle, tone: "cyan", value: formatVolume(kpis.volumeHl) },
        { icon: <CircleDollarSign size={15}/>, label: "Valor (R$)", subtitle: kpiSubtitle, value: formatCurrency(kpis.valor) },
        { icon: <ClipboardList size={15}/>, label: "Quantidade de pedidos", subtitle: kpiSubtitle, value: formatNumber(kpis.quantidadePedidos) },
        { icon: <Boxes size={15}/>, label: "Caixas", subtitle: kpiSubtitle, value: formatNumber(kpis.caixas) },
    ], [kpiSubtitle, kpis]);
    const missingCoordinates = filtered.clientes.filter((cliente) => cliente.latitude === null || cliente.longitude === null).length;
    const visiblePoints = filtered.clientes.length - missingCoordinates;
    const handleMapSelectionChange = useCallback((nextSelection) => {
        setMapSelection(nextSelection);
    }, []);
    const handleFiltersChange = useCallback((nextFilters) => {
        setMapSelection(emptyMapDashboardSelection);
        setFilters(nextFilters);
    }, []);
    const handleClearFilters = useCallback(() => {
        setMapSelection(emptyMapDashboardSelection);
        setFilters(emptyDashboardFilters);
    }, []);
    const handleToggleMapFullscreen = useCallback(async () => {
        if (isMapFullscreen) {
            setIsMapFullscreen(false);
            if (document.fullscreenElement) {
                await document.exitFullscreen().catch(() => undefined);
            }
            return;
        }
        setShowFullscreenKpis(true);
        setIsMapFullscreen(true);
        await mapPanelRef.current?.requestFullscreen?.().catch(() => undefined);
    }, [isMapFullscreen]);
    useEffect(() => {
        function handleFullscreenChange() {
            if (!document.fullscreenElement) {
                setIsMapFullscreen(false);
            }
        }
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
        };
    }, []);
    useEffect(() => {
        if (!isMapFullscreen)
            return;
        function handleKeyDown(event) {
            if (event.key === "Escape") {
                setIsMapFullscreen(false);
            }
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isMapFullscreen]);
    return (<main className="grid min-h-[calc(100vh-3.15rem)] gap-2.5 p-2.5 xl:grid-cols-[minmax(38rem,1fr)_24rem_16.5rem] xl:grid-rows-[auto_minmax(0,1fr)]">
      <section className="grid min-w-0 gap-2.5 xl:col-span-2 xl:col-start-1 xl:row-start-1">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-6">
          {mapKpiItems.map((item) => (<KpiCard icon={item.icon} key={item.label} label={item.label} subtitle={item.subtitle} tone={item.tone} value={item.value}/>))}
        </div>
      </section>

      <section className="grid min-w-0 gap-2.5 xl:col-start-1 xl:row-start-2">
        <section className={`grid min-w-0 grid-rows-[2.25rem_minmax(0,1fr)] overflow-hidden border border-[var(--line-soft)] bg-[var(--panel)] shadow-[0_18px_45px_rgba(0,0,0,0.24)] ${isMapFullscreen
            ? "fixed inset-0 z-[1000] h-screen min-h-screen rounded-none"
            : "h-[calc(100vh-12rem)] min-h-[30rem] rounded"}`} ref={mapPanelRef}>
          <div className="flex min-h-9 items-center justify-between gap-3 border-b border-[var(--line-soft)] bg-[#08141d] px-2.5">
            <div className="flex items-center gap-2">
              <MapPinned size={15} className="text-[var(--cyan)]"/>
              <h2 className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-[var(--muted-strong)]">
                Camadas / PDVs
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[0.66rem] text-[var(--muted)]">{formatNumber(visiblePoints)} pontos</span>
              {hasMapSelection && (<button aria-label="Limpar selecao do mapa" className="hidden h-7 max-w-48 items-center gap-1.5 rounded-[3px] border border-amber-300/22 bg-amber-400/10 px-2 text-[0.58rem] font-bold uppercase tracking-[0.08em] text-amber-200 transition hover:border-amber-300/45 hover:bg-amber-400/16 sm:inline-flex" onClick={() => setMapSelection(emptyMapDashboardSelection)} type="button">
                  <X size={12}/>
                  <span className="truncate">{mapSelection.label}</span>
                </button>)}
              <button aria-label={isMapFullscreen ? "Sair da tela cheia do mapa" : "Abrir mapa em tela cheia"} aria-pressed={isMapFullscreen} className="inline-flex h-7 items-center gap-1.5 rounded-[3px] border border-cyan-400/25 bg-cyan-400/8 px-2 text-[0.6rem] font-bold uppercase tracking-[0.08em] text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-400/14" onClick={handleToggleMapFullscreen} type="button">
                {isMapFullscreen ? <Minimize2 size={13}/> : <Maximize2 size={13}/>}
                <span>{isMapFullscreen ? "Sair" : "Tela cheia"}</span>
              </button>
            </div>
          </div>
          <div className="relative min-h-0">
            <PdvMap clientes={filtered.clientes} onSelectionChange={handleMapSelectionChange} overlayHeaderOpen={isMapFullscreen && showFullscreenKpis} selectedClienteIds={mapSelection.clienteIds} selection={mapSelection}/>
            {isMapFullscreen && (<FullscreenKpiHeader items={mapKpiItems} onToggle={() => setShowFullscreenKpis((current) => !current)} open={showFullscreenKpis}/>)}
            <div className="absolute inset-x-2 bottom-2 z-[500] flex items-center gap-2 rounded-[3px] border border-[rgba(242,169,0,0.22)] bg-[rgba(9,13,16,0.9)] px-3 py-2 text-[0.66rem] text-[var(--muted-strong)] shadow-[0_14px_35px_rgba(0,0,0,0.35)]">
              <AlertTriangle size={14} className="shrink-0 text-[var(--accent)]"/>
              <span>
                Existem {formatNumber(missingCoordinates)} PDVs sem coordenadas e {formatNumber(filtered.pedidos.length)} pedidos associados.
                Esses registros nao sao exibidos no mapa.
              </span>
            </div>
          </div>
        </section>
      </section>

      <section className="grid min-w-0 content-start gap-2.5 xl:col-start-2 xl:row-start-2">
        <DataTable columns={clienteMapColumns} compact data={scopedClientes.slice(0, 60)} footer={clienteFooter(kpis)} maxHeight="21rem" title="Clientes"/>
        <DataTable columns={pedidoMapColumns} compact data={scopedPedidos.slice(0, 70)} footer={pedidoFooter(kpis)} maxHeight="17.5rem" title="Pedidos"/>
      </section>

      <aside className="min-w-0 xl:col-start-3 xl:row-span-2 xl:row-start-1">
        <FilterPanel fields={mapFilterFields} filters={filters} onChange={handleFiltersChange} onClear={handleClearFilters} options={filterOptions} title="Filtros"/>
      </aside>
    </main>);
}
function FullscreenKpiHeader({ items, onToggle, open, }) {
    if (!open) {
        return (<button aria-expanded={false} className="pointer-events-auto absolute right-16 top-3 z-[650] inline-flex h-8 items-center gap-1.5 rounded-[3px] border border-cyan-400/25 bg-[#071119]/95 px-2.5 text-[0.6rem] font-bold uppercase tracking-[0.08em] text-cyan-200 shadow-[0_14px_35px_rgba(0,0,0,0.36)] backdrop-blur transition hover:border-cyan-300 hover:bg-cyan-400/14" onClick={onToggle} type="button">
        <ChevronDown size={13}/>
        Indicadores
      </button>);
    }
    return (<div className="pointer-events-auto absolute left-3 right-16 top-3 z-[650] overflow-hidden rounded border border-cyan-400/15 bg-[#071119]/94 text-slate-300 shadow-[0_16px_42px_rgba(0,0,0,0.42)] backdrop-blur">
      <div className="flex min-h-8 items-center justify-between gap-3 border-b border-white/10 bg-[#0a1822] px-2.5">
        <span className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-white">Indicadores do mapa</span>
        <button aria-expanded aria-label="Ocultar indicadores do mapa" className="inline-flex h-6 items-center gap-1 rounded-[3px] border border-white/10 bg-white/[0.03] px-2 text-[0.56rem] font-bold uppercase tracking-[0.08em] text-slate-300 transition hover:border-cyan-400/35 hover:text-white" onClick={onToggle} type="button">
          <X size={12}/>
          Ocultar
        </button>
      </div>
      <div className="dashboard-scroll grid max-h-[34vh] gap-2 overflow-y-auto p-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        {items.map((item) => (<CompactFullscreenKpi item={item} key={item.label}/>))}
      </div>
    </div>);
}
function CompactFullscreenKpi({ item }) {
    const toneClass = {
        amber: "text-[var(--accent)]",
        cyan: "text-[var(--cyan)]",
        green: "text-[var(--green)]",
        danger: "text-[var(--danger)]",
    }[item.tone ?? "amber"];
    return (<article className="min-h-[3.65rem] rounded-[3px] border border-white/10 bg-[linear-gradient(145deg,#101d27,#08121a_66%,#071018)] px-2 py-1.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[0.52rem] font-bold uppercase leading-tight tracking-[0.06em] text-[var(--muted)]">
          {item.label}
        </p>
        <div className="shrink-0 text-[var(--cyan)]">{item.icon}</div>
      </div>
      <strong className={`mt-1 block truncate font-mono text-[0.92rem] font-black leading-none tracking-normal ${toneClass}`}>
        {item.value}
      </strong>
      {item.subtitle ? <span className="mt-1 block truncate text-[0.52rem] text-[var(--muted)]">{item.subtitle}</span> : null}
    </article>);
}
function clienteFooter(kpis) {
    return (<tr className="bg-[rgba(242,169,0,0.06)] font-bold text-[var(--accent)]">
      <td className="px-2 py-1.5 text-[0.68rem] uppercase" colSpan={3}>
        Total
      </td>
      <td className="px-2 py-1.5 text-right font-mono text-[0.68rem]">{formatWeight(kpis.pesoBrutoKg)}</td>
    </tr>);
}
function pedidoFooter(kpis) {
    return (<tr className="bg-[rgba(242,169,0,0.06)] font-bold text-[var(--accent)]">
      <td className="px-2 py-1.5 text-[0.68rem] uppercase" colSpan={4}>
        Total
      </td>
      <td className="px-2 py-1.5 text-right font-mono text-[0.68rem]">{formatWeight(kpis.pesoBrutoKg)}</td>
      <td className="px-2 py-1.5 text-right font-mono text-[0.68rem]">{formatVolume(kpis.volumeHl)}</td>
    </tr>);
}
