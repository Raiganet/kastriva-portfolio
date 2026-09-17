"use client";
import { useState, useCallback, useRef } from "react";
import { OrderService, SubmitOrderResult } from "@/lib/services/order.service";
import { OrderFormData } from "@/lib/validators/order";

interface UseOrderReturn {
  submit: (data: unknown) => Promise<SubmitOrderResult>;
  submitting: boolean;
  lastResult: SubmitOrderResult | null;
  reset: () => void;
}

export function useOrder(): UseOrderReturn {
  const inFlight = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<SubmitOrderResult | null>(null);

  const submit = useCallback(async (data: unknown): Promise<SubmitOrderResult> => {
    if (inFlight.current) return { success:false,error:"Pengiriman masih berlangsung." };
    inFlight.current=true;
    setSubmitting(true);
    try {
      const result = await OrderService.submit(data);
      setLastResult(result);
      return result;
    } catch (err) {
      const errorResult: SubmitOrderResult = {
        success: false,
        error: err instanceof Error ? err.message : "Gagal mengirim order",
      };
      setLastResult(errorResult);
      return errorResult;
    } finally {
      inFlight.current=false;
      setSubmitting(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLastResult(null);
  }, []);

  return { submit, submitting, lastResult, reset };
}
