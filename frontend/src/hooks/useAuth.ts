"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useState } from "react"

import {
  type Body_login_login_access_token as AccessToken,
  type ApiError,
  Login,
  type UserPublic,
  type UserRegister,
  Users,
} from "@/client"
import { useErrorHandler } from "@/utils"

const isLoggedIn = () => {
  if (typeof window === "undefined") {
    return false // Server-side rendering
  }
  return localStorage.getItem("access_token") !== null
}

const useAuth = () => {
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const queryClient = useQueryClient()
  const { handleError } = useErrorHandler()
  const { data: user } = useQuery<UserPublic | null, Error>({
    queryKey: ["currentUser"],
    queryFn: Users.readUserMe,
    enabled: isLoggedIn(),
    retry: 1,
  })

  const signUpMutation = useMutation({
    mutationFn: (data: UserRegister) =>
      Users.registerUser({ requestBody: data }),

    onSuccess: () => {
      router.push("/login")
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })

  const login = async (data: AccessToken) => {
    const response = await Login.loginAccessToken({
      formData: data,
    })
    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", response.access_token)
    }
  }

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["currentUser"] })
      router.push("/")
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
  })

  const logout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token")
    }
    router.push("/login")
  }

  return {
    signUpMutation,
    loginMutation,
    logout,
    user,
    error,
    resetError: () => setError(null),
  }
}

export { isLoggedIn }
export default useAuth
