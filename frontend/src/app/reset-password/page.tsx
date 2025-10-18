"use client"

import { Container, Image, Text } from "@chakra-ui/react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"
import { FiLock } from "react-icons/fi"

import type { NewPassword } from "@/client"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/ui/password-input"
import { confirmPasswordRules, passwordRules } from "@/utils"

const Logo = "/assets/images/fastapi-logo.svg"

interface NewPasswordForm extends NewPassword {
  confirm_password: string
}

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<NewPasswordForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      token,
      new_password: "",
      confirm_password: "",
    },
  })

  const onSubmit: SubmitHandler<NewPasswordForm> = async (data) => {
    // TODO: Implement password reset API call
    console.log("Reset password with token:", data.token)
  }

  return (
    <Container
      as="form"
      onSubmit={handleSubmit(onSubmit)}
      h="100vh"
      maxW="sm"
      alignItems="stretch"
      justifyContent="center"
      gap={4}
      centerContent
    >
      <Image
        src={Logo}
        alt="FastAPI logo"
        height="auto"
        maxW="2xs"
        alignSelf="center"
        mb={4}
      />
      <Text fontSize="xl" fontWeight="bold" textAlign="center" mb={4}>
        Reset Password
      </Text>
      <Text textAlign="center" mb={4} color="gray.600">
        Enter your new password below.
      </Text>
      <PasswordInput
        type="password"
        startElement={<FiLock />}
        {...register("new_password", passwordRules())}
        placeholder="New Password"
        errors={errors}
      />
      <PasswordInput
        type="password"
        startElement={<FiLock />}
        {...register("confirm_password", confirmPasswordRules(getValues))}
        placeholder="Confirm Password"
        errors={errors}
      />
      <Button variant="solid" type="submit" loading={isSubmitting} size="md">
        Reset Password
      </Button>
      <Text textAlign="center">
        Remember your password?{" "}
        <Link href="/login" className="main-link">
          Back to Login
        </Link>
      </Text>
    </Container>
  )
}

export default function ResetPassword() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
