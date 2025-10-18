import type { ApiError } from "./client"
import useCustomToast from "./hooks/useCustomToast"

export const emailPattern = {
  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  message: "Invalid email address",
}

export const namePattern = {
  value: /^[A-Za-z\s\u00C0-\u017F]{1,30}$/,
  message: "Invalid name",
}

export const passwordRules = (isRequired = true) => {
  const rules: any = {
    minLength: {
      value: 8,
      message: "Password must be at least 8 characters",
    },
  }

  if (isRequired) {
    rules.required = "Password is required"
  }

  return rules
}

export const confirmPasswordRules = (
  getValues: () => any,
  isRequired = true
) => {
  const rules: any = {
    validate: (value: string) => {
      const password = getValues().password || getValues().new_password
      return value === password ? true : "The passwords do not match"
    },
  }

  if (isRequired) {
    rules.required = "Password confirmation is required"
  }

  return rules
}

// Helper function to extract error message from API error
export const getErrorMessage = (err: ApiError): string => {
  const errDetail = (err.body as any)?.detail
  let errorMessage = errDetail || "Something went wrong."
  if (Array.isArray(errDetail) && errDetail.length > 0) {
    errorMessage = errDetail[0].msg
  }
  return errorMessage
}

// Custom hook for handling errors with toast
export const useErrorHandler = () => {
  const { showErrorToast } = useCustomToast()

  const handleError = (err: ApiError) => {
    const errorMessage = getErrorMessage(err)
    showErrorToast(errorMessage)
  }

  return { handleError }
}

// Backwards compatibility - deprecated function
// @deprecated Use useErrorHandler hook instead
export const handleError = (err: ApiError) => {
  console.warn("handleError is deprecated. Use useErrorHandler hook instead.")
  // For backwards compatibility, just log the error
  console.error("API Error:", getErrorMessage(err))
}
