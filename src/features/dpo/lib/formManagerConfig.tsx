"use client";

import { createContext, useContext, type ReactNode } from "react";
import { blitzApi, dtoApi, type DtoApi } from "@/features/dpo/lib/dtoApi";

export interface FormManagerConfig {
  api: DtoApi;
  managerTitle: string;
  pillarEyebrow: string;
  singular: string;
  plural: string;
  formLabel: string;
  appliedLabel: string;
  description: string;
  routeKey: string;
}

export const DTO_MANAGER_CONFIG: FormManagerConfig = {
  api: dtoApi,
  managerTitle: "Gerenciador de DTOs",
  pillarEyebrow: "Gestão DPO",
  singular: "DTO",
  plural: "DTOs",
  formLabel: "Formulário DTO",
  appliedLabel: "DTOs aplicadas",
  description:
    "Análise gerencial das aplicações de Diagnóstico Operacional do Trabalho, com foco em aderência, recorrências e oportunidades de atuação sobre os resultados negativos.",
  routeKey: "dto",
};

export const BLITZ_MANAGER_CONFIG: FormManagerConfig = {
  api: blitzApi,
  managerTitle: "Gerenciador de Blitz",
  pillarEyebrow: "Segurança DPO",
  singular: "Blitz",
  plural: "Blitz",
  formLabel: "Formulário de Blitz",
  appliedLabel: "Blitz aplicadas",
  description:
    "Análise gerencial das aplicações de Blitz de Segurança, com foco em aderência, recorrências e oportunidades de atuação sobre os resultados negativos.",
  routeKey: "blitz",
};

const FormManagerContext = createContext<FormManagerConfig>(DTO_MANAGER_CONFIG);

export function FormManagerProvider({
  children,
  config,
}: {
  children: ReactNode;
  config: FormManagerConfig;
}) {
  return (
    <FormManagerContext.Provider value={config}>
      {children}
    </FormManagerContext.Provider>
  );
}

export function useFormManagerConfig(): FormManagerConfig {
  return useContext(FormManagerContext);
}
