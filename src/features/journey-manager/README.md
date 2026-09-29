# Gerenciador de Jornada v1

`page.tsx` delegates to the DPO view and this feature. The API module owns the
authenticated GET contract, the model owns query and response types, the lib
owns presentation-only grouping and formatting, and the UI renders each map
with its crew. Only the backend supplies official durations, targets, states,
outcomes and expurge flags.

The default query loads the current date and every map, role and expurge state.
Date and filter controls apply to the loaded period. The live counter adds
elapsed wall time to an open indicator's official seconds using its snapshot;
the official target status and outcome remain those of the last snapshot.
When a visible query contains an indicator in progress, a silent API refresh
updates the snapshot about every 60 seconds. The page pauses automatic refresh
while hidden and while no loaded row is live. A failed refresh preserves the
last data; query changes abort the old request. Manual refresh remains available.

TR is presented once per map, with crew rows listed as context. The current
backend contract has no BEES delivery progress (IFW-29); no progress is
inferred. Expurge belongs to each crew member and is never inferred for the
whole map from its first row. TML, TI and JL show their official fields and
timestamps without recomputing KPI values. Period navigation supports historical lists, while official
historical aggregations remain pending a backend contract. The page does not
choose a hidden window for earlier pending maps. When `mapOrigin` explicitly
equals `LIVE`, the loaded period can be narrowed to today's D0 maps or earlier
pending maps; other origins are not classified as pending.
