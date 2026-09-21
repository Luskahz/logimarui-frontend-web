"use client";

import { useEffect, useRef, useState } from "react";
import { extratorApi } from "@/features/extrator-manager/api/extratorApi";

export function useBeesVerificationFlow({
  beesAuthStatus,
  historyPage,
  historyPageSize,
  refreshAll,
  reportsMeta,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dismissedFlowId, setDismissedFlowId] = useState("");
  const inputRef = useRef(null);
  const modalVisible =
    isOpen ||
    (Boolean(beesAuthStatus?.verification_required) &&
      Boolean(beesAuthStatus?.recoverable) &&
      Boolean(beesAuthStatus?.flow_id) &&
      String(beesAuthStatus.flow_id) !== dismissedFlowId);

  useEffect(() => {
    if (!modalVisible) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => inputRef.current?.focus(), 0);

    function handleKeyDown(event) {
      if (event.key === "Escape" && !submitting) {
        if (beesAuthStatus?.verification_required) {
          setDismissedFlowId(String(beesAuthStatus?.flow_id || ""));
        }
        setIsOpen(false);
        setCode("");
        setError("");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    beesAuthStatus?.flow_id,
    beesAuthStatus?.verification_required,
    modalVisible,
    submitting,
  ]);

  function close() {
    if (submitting) {
      return;
    }
    if (beesAuthStatus?.verification_required) {
      setDismissedFlowId(String(beesAuthStatus?.flow_id || ""));
    }
    setIsOpen(false);
    setCode("");
    setError("");
  }

  function showPending(base) {
    const reportInterface = String(reportsMeta?.[base]?.interface || "");
    if (
      reportInterface !== "bees-deliver" ||
      !beesAuthStatus?.verification_required ||
      !beesAuthStatus?.recoverable
    ) {
      return false;
    }

    setDismissedFlowId("");
    setError("");
    setIsOpen(true);
    return true;
  }

  async function submit() {
    const normalizedCode = String(code || "").trim();
    if (!normalizedCode) {
      setError("Informe o codigo recebido por e-mail.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await extratorApi.submitBeesVerificationCode(normalizedCode);
      setDismissedFlowId(String(beesAuthStatus?.flow_id || ""));
      setIsOpen(false);
      setCode("");
      await refreshAll({ historyPage, historyPageSize, silent: true });
      setDismissedFlowId("");
    } catch (verificationError) {
      setError(
        verificationError instanceof Error && verificationError.message
          ? verificationError.message
          : "Nao foi possivel concluir o login do Bees.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return {
    showPending,
    modalProps: {
      code,
      error,
      inputRef,
      isOpen: modalVisible,
      onChange: setCode,
      onClose: close,
      onSubmit: submit,
      status: beesAuthStatus,
      submitting,
    },
  };
}
