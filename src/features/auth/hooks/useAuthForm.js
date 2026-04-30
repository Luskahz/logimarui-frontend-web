"use client";

import { useState } from "react";
import { validateAuthForm } from "@/features/auth/lib/validators";
import { getAuthService } from "@/features/auth/services";

const IDLE_FEEDBACK = {
  type: "idle",
  message: "",
};

function buildInitialValues(fields) {
  return fields.reduce((accumulator, field) => {
    accumulator[field.name] = field.defaultValue ?? "";
    return accumulator;
  }, {});
}

function removeFieldError(currentErrors, fieldName) {
  if (!currentErrors[fieldName]) {
    return currentErrors;
  }

  const nextErrors = { ...currentErrors };
  delete nextErrors[fieldName];
  return nextErrors;
}

export function useAuthForm({
  mode,
  fields,
  successPrefix,
}) {
  const [values, setValues] = useState(() => buildInitialValues(fields));
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState(IDLE_FEEDBACK);
  const [result, setResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }));
    setErrors((currentErrors) => removeFieldError(currentErrors, name));

    if (feedback.message) {
      setFeedback(IDLE_FEEDBACK);
    }

    if (result) {
      setResult(null);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = validateAuthForm(fields, values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setResult(null);
      setFeedback({
        type: "error",
        message: "Revise os campos destacados antes de continuar.",
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(IDLE_FEEDBACK);
    setResult(null);

    try {
      const response = await getAuthService(mode)(values);

      setFeedback({
        type: "success",
        message: response?.message || `${successPrefix} Operacao concluida.`,
      });
      setResult(response?.result ?? null);

      if (response?.resetForm) {
        setValues(buildInitialValues(fields));
      }
    } catch (error) {
      setFeedback({
        type: "error",
        message: error?.message || "Nao foi possivel concluir a acao agora.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    values,
    errors,
    feedback,
    result,
    isSubmitting,
    handleChange,
    handleSubmit,
  };
}
