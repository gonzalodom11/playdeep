"use client";

import * as React from "react";
import { useToast } from "@/hooks/use-toast";
import { Toast, ToastTitle, ToastDescription, ToastClose, ToastViewport } from "@/components/ui/toast";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <>
      {toasts.map(function ({ id, title, description, ...props }) {
        return (
          <Toast key={id} {...props} open={props.open} onOpenChange={(open) => {
            if (!open) dismiss(id);
          }}>
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </>
  );
}
