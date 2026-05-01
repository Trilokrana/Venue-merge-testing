"use client"

import {
  ConfirmDialogProvider as BaseConfirmDialogProvider,
  ConfirmOptions,
} from "@omit/react-confirm-dialog"

interface Props {
  children: React.ReactNode
  defaultOptions?: ConfirmOptions
}

export const ConfirmDialogProvider = ({ children, defaultOptions }: Props) => {
  return (
    <BaseConfirmDialogProvider
      defaultOptions={{
        confirmText: "Confirm",
        cancelText: "Cancel",
        confirmButton: {
          variant: "default",
          size: "lg",
          className: "px-4",
        },
        cancelButton: {
          variant: "outline",
          size: "lg",
          className: "px-4",
        },
        alertDialogContent: {
          className: "sm:min-w-xl rounded-lg",
        },
        alertDialogOverlay: {
          className: "bg-card/80 backdrop-blur-xl",
        },
        alertDialogFooter: {
          className: "gap-2 bg-transparent p-0 pt-2",
        },
        ...defaultOptions,
      }}
    >
      {children}
    </BaseConfirmDialogProvider>
  )
}

export default ConfirmDialogProvider
