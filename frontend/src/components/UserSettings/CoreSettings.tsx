"use client"

import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Input,
  Separator,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"
import { FiLock } from "react-icons/fi"

import {
  type ApiError,
  type UserPublic,
  type UserUpdateMe,
  type UpdatePassword,
  Users,
} from "@/client"
import useAuth from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"
import {
  confirmPasswordRules,
  emailPattern,
  handleError,
  passwordRules,
} from "@/utils"
import { Field } from "../ui/field"
import { PasswordInput } from "../ui/password-input"
import DeleteConfirmation from "./DeleteConfirmation"

interface UpdatePasswordForm extends UpdatePassword {
  confirm_password: string
}

const CoreSettings = () => {
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const [editMode, setEditMode] = useState(false)
  const { user: currentUser } = useAuth()

  // User info form
  const {
    register: registerInfo,
    handleSubmit: handleSubmitInfo,
    reset: resetInfo,
    getValues: getValuesInfo,
    formState: {
      isSubmitting: isSubmittingInfo,
      errors: errorsInfo,
      isDirty: isDirtyInfo,
    },
  } = useForm<UserPublic>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      full_name: currentUser?.full_name,
      email: currentUser?.email,
    },
  })

  // Password form
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    getValues: getValuesPassword,
    formState: {
      errors: errorsPassword,
      isValid: isValidPassword,
      isSubmitting: isSubmittingPassword,
    },
  } = useForm<UpdatePasswordForm>({
    mode: "onBlur",
    criteriaMode: "all",
  })

  const toggleEditMode = () => {
    setEditMode(!editMode)
  }

  const userInfoMutation = useMutation({
    mutationFn: (data: UserUpdateMe) =>
      Users.updateUserMe({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast("User updated successfully.")
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries()
    },
  })

  const passwordMutation = useMutation({
    mutationFn: (data: UpdatePassword) =>
      Users.updatePasswordMe({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Password updated successfully.")
      resetPassword()
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
  })

  const onSubmitInfo: SubmitHandler<UserUpdateMe> = async (data) => {
    userInfoMutation.mutate(data)
  }

  const onSubmitPassword: SubmitHandler<UpdatePasswordForm> = async (data) => {
    passwordMutation.mutate(data)
  }

  const onCancel = () => {
    resetInfo()
    toggleEditMode()
  }

  return (
    <Container maxW="full" p={0}>
      {/* User Information Section */}
      <Box mb={8}>
        <Box w="full" as="form" onSubmit={handleSubmitInfo(onSubmitInfo)}>
          <Field label="Name">
            {editMode ? (
              <Input
                {...registerInfo("full_name", { maxLength: 30 })}
                type="text"
                size="md"
                borderRadius="full"
              />
            ) : (
              <Text
                fontSize="md"
                py={2}
                color={!currentUser?.full_name ? "gray" : "inherit"}
                truncate
              >
                {currentUser?.full_name || "N/A"}
              </Text>
            )}
          </Field>
          <Field
            mt={4}
            label="Email"
            invalid={!!errorsInfo.email}
            errorText={errorsInfo.email?.message}
          >
            {editMode ? (
              <Input
                {...registerInfo("email", {
                  required: "Email is required",
                  pattern: emailPattern,
                })}
                type="email"
                size="md"
                borderRadius="full"
              />
            ) : (
              <Text fontSize="md" py={2} truncate>
                {currentUser?.email}
              </Text>
            )}
          </Field>
          <Flex mt={4} gap={3}>
            <Button
              variant="subtle"
              fontSize="xs"
              onClick={toggleEditMode}
              type={editMode ? "button" : "submit"}
              loading={editMode ? isSubmittingInfo : false}
              disabled={
                editMode ? !isDirtyInfo || !getValuesInfo("email") : false
              }
            >
              {editMode ? "Save" : "Edit"}
            </Button>
            {editMode && (
              <Button
                variant="subtle"
                colorPalette="gray"
                fontSize="xs"
                onClick={onCancel}
                disabled={isSubmittingInfo}
              >
                Cancel
              </Button>
            )}
          </Flex>
        </Box>
      </Box>

      {/* Change Password Section */}
      <Box mb={8}>
        <Heading size="sm" py={4}>
          Change Password
        </Heading>
        <Box as="form" onSubmit={handleSubmitPassword(onSubmitPassword)}>
          <VStack gap={4} w="full">
            <PasswordInput
              type="current_password"
              startElement={<FiLock />}
              {...registerPassword("current_password", passwordRules())}
              placeholder="Current Password"
              errors={errorsPassword}
            />
            <PasswordInput
              type="new_password"
              startElement={<FiLock />}
              {...registerPassword("new_password", passwordRules())}
              placeholder="New Password"
              errors={errorsPassword}
            />
            <PasswordInput
              type="confirm_password"
              startElement={<FiLock />}
              {...registerPassword(
                "confirm_password",
                confirmPasswordRules(getValuesPassword)
              )}
              placeholder="Confirm Password"
              errors={errorsPassword}
            />
          </VStack>
          <Button
            variant="subtle"
            mt={4}
            type="submit"
            fontSize="xs"
            loading={isSubmittingPassword}
            disabled={!isValidPassword}
          >
            Update Password
          </Button>
        </Box>
      </Box>

      {/* Delete Account Section */}
      <Box>
        <Heading size="sm" py={4}>
          Delete Account
        </Heading>
        <Text mb={4} color={{ base: "gray.600", _dark: "gray.300" }}>
          Permanently delete your data and everything associated with your
          account.
        </Text>
        <DeleteConfirmation />
      </Box>
    </Container>
  )
}

export default CoreSettings
