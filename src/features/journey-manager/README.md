# Gerenciador de Jornada v1

`page.tsx` delegates to the DPO view and this feature. The API module owns the
authenticated GET contract, the model owns query and response types, the lib
owns presentation-only grouping and formatting, and the UI renders each map
with its crew. Only the backend supplies official durations, targets, states,
outcomes and expurge flags.

The default query loads the current date and every map, role and expurge state.
Date and filter controls apply to the loaded period. The live counter adds
elapsed wall time to an open indicator's official seconds using its snapshot;
only a manual refresh fetches new official values.

TR is presented once per map, with crew rows listed as context. The current
backend contract has no BEES delivery progress (IFW-29); no progress is
inferred. Period navigation supports historical lists, while official
historical aggregations remain pending a backend contract. The page does not
choose a hidden window for earlier pending maps.
