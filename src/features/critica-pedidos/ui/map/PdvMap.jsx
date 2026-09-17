"use client";
import dynamic from "next/dynamic";
const PdvLeaflet = dynamic(() => import("./PdvLeaflet").then((module) => module.PdvLeaflet), {
    ssr: false,
    loading: () => (<div className="grid h-full min-h-96 w-full place-items-center rounded bg-[#08141d] text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
      Carregando mapa
    </div>),
});
export function PdvMap({ clientes, onSelectionChange, overlayHeaderOpen = false, selectedClienteIds, selection, }) {
    return (<PdvLeaflet clientes={clientes} onSelectionChange={onSelectionChange} overlayHeaderOpen={overlayHeaderOpen} selectedClienteIds={selectedClienteIds} selection={selection}/>);
}
