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
  const [invoiceInput, setInvoiceInput] = useState("");
  const [orders, setOrders] = useState<PagedResponse<OrderSummary> | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderSummary | null>(null);
  const [context, setContext] = useState<ReturnAlertContext | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [occurrence, setOccurrence] = useState<Occurrence | null>(null);
  const [phase, setPhase] = useState<RequestPhase>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const requestControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => requestControllerRef.current?.abort();
  }, []);

  const clearFeedback = useCallback(() => {
    setError("");
    setSuccess("");
  }, []);

  const clearSelection = useCallback(() => {
    setOrders(null);
    setSelectedOrder(null);
    setContext(null);
    setItems([]);
    setOccurrence(null);
    clearFeedback();
  }, [clearFeedback]);

  const changeCustomerInput = useCallback(
    (value: string) => {
      setCustomerInput(value);
      clearSelection();
    },
    [clearSelection],
  );

  const changeInvoiceInput = useCallback(
    (value: string) => {
      setInvoiceInput(value);
      clearSelection();
    },
    [clearSelection],
  );

  const loadInvoice = useCallback(
    async (
      customerId: number,
      invoiceNumber: number,
      order: OrderSummary | null = null,
    ) => {
      requestControllerRef.current?.abort();
      const controller = new AbortController();
      requestControllerRef.current = controller;

      clearFeedback();
      setPhase("loading-context");
      setContext(null);
      setItems([]);
      setOccurrence(null);
      setSelectedOrder(order);
      setInvoiceInput(String(invoiceNumber));

      try {
        const [nextContext, itemPage, occurrencePage] = await Promise.all([
          cmeOccurrenceApi.getReturnContext(
            customerId,
            invoiceNumber,
            controller.signal,
          ),
          cmeOccurrenceApi.getInvoiceItems(invoiceNumber, controller.signal),
          cmeOccurrenceApi.searchOccurrences(
            customerId,
            invoiceNumber,
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

  const consult = useCallback(async () => {
    clearFeedback();

    let customerId: number;

    try {
      customerId = parsePositiveInteger(customerInput, "Código do cliente");
    } catch (validationError) {
      setError(errorMessage(validationError));
      return;
    }

    if (invoiceInput.trim()) {
      try {
        const invoiceNumber = parsePositiveInteger(invoiceInput, "Nota fiscal");
        await loadInvoice(customerId, invoiceNumber);
      } catch (validationError) {
        setError(errorMessage(validationError));
      }
      return;
    }

    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;

    setPhase("searching");
    setOrders(null);
    setSelectedOrder(null);
    setContext(null);
    setItems([]);
    setOccurrence(null);

    try {
      const result = await cmeOccurrenceApi.getCustomerOrders(
        customerId,
        controller.signal,
      );
      setOrders(result);

      if (result.content.length === 0) {
        setError("Nenhum pedido foi encontrado para este cliente.");
      } else if (result.content.length === 1) {
        await loadInvoice(customerId, result.content[0].invoiceNumber, result.content[0]);
      }
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
  }, [clearFeedback, customerInput, invoiceInput, loadInvoice]);

  const selectOrder = useCallback(
    async (order: OrderSummary) => {
      try {
        const customerId = parsePositiveInteger(customerInput, "Código do cliente");
        await loadInvoice(customerId, order.invoiceNumber, order);
      } catch (selectionError) {
        setError(errorMessage(selectionError));
      }
    },
    [customerInput, loadInvoice],
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
        currentOccurrence = await cmeOccurrenceApi.confirmReturn(
          currentOccurrence.id,
        );
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
    changeInvoiceInput,
    consult,
    confirmReturn,
    context,
    customerInput,
    error,
    invoiceInput,
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
