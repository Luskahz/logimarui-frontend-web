"use client";

import { useEffect, useRef, useState } from "react";

export function usePasswordAction() {
  const [config, setConfig] = useState(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!config?.isOpen) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => inputRef.current?.focus(), 0);

    function handleKeyDown(event) {
      if (event.key === "Escape" && !submitting) {
        setConfig(null);
        setValue("");
        setError("");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [config, submitting]);

  function close() {
    if (submitting) {
      return;
    }
    setConfig(null);
    setValue("");
    setError("");
  }

  function open(nextConfig) {
    setConfig({ isOpen: true, ...nextConfig });
    setValue("");
    setError("");
  }

  async function submit() {
    if (!config?.run) {
      return;
    }

    const password = value.trim();
    if (!password) {
      setError(config.requiredMessage || "Informe a senha para continuar.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await config.run(password);
      setConfig(null);
      setValue("");
    } catch (submitError) {
      setError(
        submitError instanceof Error && submitError.message
          ? submitError.message
          : "Erro ao confirmar a acao protegida.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return {
    open,
    modalProps: {
      config,
      error,
      inputRef,
      onChange: setValue,
      onClose: close,
      onSubmit: submit,
      submitting,
      value,
    },
  };
}
