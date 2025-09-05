"use client"

import { Container, Image, Input, Text } from "@chakra-ui/react"
import Link from "next/link"
import { type SubmitHandler, useForm } from "react-hook-form"
import { FiMail } from "react-icons/fi"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { InputGroup } from "@/components/ui/input-group"
import { emailPattern } from "@/utils"

const Logo = "/assets/images/fastapi-logo.svg"

interface FormData {
  email: string
}

export default function RecoverPassword() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      email: "",
    },
  })

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    // TODO: Implement password recovery API call
    console.log("Recover password for:", data.email)
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
        Password Recovery
      </Text>
      <Text textAlign="center" mb={4} color="gray.600">
        Enter your email address and we&apos;ll send you a link to reset your
        password.
      </Text>
      <Field invalid={!!errors.email} errorText={errors.email?.message}>
        <InputGroup w="100%" startElement={<FiMail />}>
          <Input
            id="email"
            {...register("email", {
              required: "Email is required",
              pattern: emailPattern,
            })}
            placeholder="Email"
            type="email"
          />
        </InputGroup>
      </Field>
      <Button variant="solid" type="submit" loading={isSubmitting} size="md">
        Send Recovery Email
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
