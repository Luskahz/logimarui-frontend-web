"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { cmeOccurrenceApi } from "@/features/dpo/lib/cmeOccurrenceApi";
import type {
  InvoiceItem,
  Occurrence,
  OrderSummary,
  PagedResponse,
  ReturnAlertContext,
} from "@/features/dpo/lib/cmeTypes";

type RequestPhase =
  | "searching"
  | "loading-context"
  | "confirming"
  | "reverting"
  | null;

function parsePositiveInteger(value: string, label: string): number {
  const normalized = value.trim();

  if (!/^\d+$/.test(normalized)) {
    throw new Error(`${label} deve conter apenas números.`);
  }

  const parsed = Number(normalized);

  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} deve ser um número positivo válido.`);
  }

  return parsed;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Não foi possível concluir a solicitação.";
}

export function useCmeRouteTracking() {
  const [customerInput, setCustomerInput] = useState("");
  const [orders, setOrders] = useState<PagedResponse<OrderSummary> | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderSummary | null>(null);
  const [context, setContext] = useState<ReturnAlertContext | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [occurrence, setOccurrence] = useState<Occurrence | null>(null);
  const [phase, setPhase] = useState<RequestPhase>(null);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const requestControllerRef = useRef<AbortController | null>(null);
  const debounceTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => requestControllerRef.current?.abort();
  }, []);

  const clearFeedback = useCallback(() => {
    setError("");
    setSuccess("");
  }, []);

  const clearResult = useCallback(() => {
    setOrders(null);
    setSelectedOrder(null);
    setContext(null);
    setItems([]);
    setOccurrence(null);
  }, []);

  const loadInvoice = useCallback(
    async (order: OrderSummary) => {
      requestControllerRef.current?.abort();
      const controller = new AbortController();
      requestControllerRef.current = controller;

      clearFeedback();
      setPhase("loading-context");
      setContext(null);
      setItems([]);
      setOccurrence(null);
      setSelectedOrder(order);

      try {
        const [nextContext, itemPage, occurrencePage] = await Promise.all([
          cmeOccurrenceApi.getReturnContext(
            order.customerId,
            order.invoiceNumber,
            controller.signal,
          ),
          cmeOccurrenceApi.getInvoiceItems(order.invoiceNumber, controller.signal),
          cmeOccurrenceApi.searchOccurrences(
            order.customerId,
            order.invoiceNumber,
            controller.signal,
          ),
        ]);

        setContext(nextContext);
        setItems(itemPage.content);
        setOccurrence(occurrencePage.content[0] ?? null);
      } catch (loadError) {
        if (!isAbortError(loadError)) {
          setError(errorMessage(loadError));
        }
      } finally {
        if (requestControllerRef.current === controller) {
          requestControllerRef.current = null;
          setPhase(null);
        }
      }
    },
    [clearFeedback],
  );

  const searchCustomer = useCallback(
    async (rawCustomerId: string) => {
      clearFeedback();

      let customerId: number;

      try {
        customerId = parsePositiveInteger(rawCustomerId, "Código do cliente");
      } catch (validationError) {
        setError(errorMessage(validationError));
        return;
      }

      requestControllerRef.current?.abort();
      const controller = new AbortController();
      requestControllerRef.current = controller;

      setPhase("searching");
      clearResult();

      try {
        const result = await cmeOccurrenceApi.getCustomerOrders(
          customerId,
          controller.signal,
        );
        setOrders(result);

        if (result.content.length === 0) {
          setError("Nenhuma nota fiscal foi encontrada para este cliente.");
          return;
        }

        await loadInvoice(result.content[0]);
      } catch (searchError) {
        if (!isAbortError(searchError)) {
          setError(errorMessage(searchError));
        }
      } finally {
        if (requestControllerRef.current === controller) {
          requestControllerRef.current = null;
          setPhase(null);
        }
      }
    },
    [clearFeedback, clearResult, loadInvoice],
  );

  useEffect(() => {
    const normalized = customerInput.trim();

    if (!normalized) {
      return;
    }

    debounceTimeoutRef.current = window.setTimeout(() => {
      debounceTimeoutRef.current = null;
      setIsDebouncing(false);
      void searchCustomer(normalized);
    }, 2000);

    return () => {
      if (debounceTimeoutRef.current !== null) {
        window.clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }
    };
  }, [customerInput, searchCustomer]);

  const changeCustomerInput = useCallback(
    (value: string) => {
      const normalized = value.replace(/\D/g, "");
      requestControllerRef.current?.abort();
      setCustomerInput(normalized);
      setIsDebouncing(Boolean(normalized));
      setPhase(null);
      clearFeedback();
      clearResult();
    },
    [clearFeedback, clearResult],
  );

  const consult = useCallback(() => {
    if (debounceTimeoutRef.current !== null) {
      window.clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    setIsDebouncing(false);
    void searchCustomer(customerInput);
  }, [customerInput, searchCustomer]);

  const selectOrder = useCallback(
    (order: OrderSummary) => {
      void loadInvoice(order);
    },
    [loadInvoice],
  );

  const confirmReturn = useCallback(async () => {
    if (!context) {
      setError("Consulte e selecione uma nota fiscal antes de confirmar.");
      return;
    }

    clearFeedback();
    setPhase("confirming");

    try {
      let currentOccurrence = occurrence;

      if (!currentOccurrence || currentOccurrence.status === "REVERTED") {
        currentOccurrence = await cmeOccurrenceApi.createReturn(
          context.customerId,
          context.invoiceNumber,
        );
        setOccurrence(currentOccurrence);
      }

      if (currentOccurrence.status !== "RETURNED") {
        currentOccurrence = await cmeOccurrenceApi.confirmReturn(currentOccurrence.id);
        setOccurrence(currentOccurrence);
      }

      setSuccess("Devolução confirmada com sucesso.");
    } catch (confirmError) {
      setError(errorMessage(confirmError));
    } finally {
      setPhase(null);
    }
  }, [clearFeedback, context, occurrence]);

  const revertOccurrence = useCallback(async () => {
    if (!occurrence || occurrence.status === "REVERTED") {
      setError("Não existe uma ocorrência ativa para reverter.");
      return;
    }

    clearFeedback();
    setPhase("reverting");

    try {
      const reverted = await cmeOccurrenceApi.revertOccurrence(occurrence.id);
      setOccurrence(reverted);
      setSuccess("Apontamento revertido com sucesso.");
    } catch (revertError) {
      setError(errorMessage(revertError));
    } finally {
      setPhase(null);
    }
  }, [clearFeedback, occurrence]);

  return {
    changeCustomerInput,
    confirmReturn,
    consult,
    context,
    customerInput,
    error,
    isDebouncing,
    items,
    occurrence,
    orders,
    phase,
    revertOccurrence,
    selectedOrder,
    selectOrder,
    success,
  };
}
